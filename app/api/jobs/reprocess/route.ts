import { NextRequest, NextResponse } from "next/server";
import { JobPostExtractor } from "@/lib/job-extractor";
import dbConnection from "@/lib/database";
import { apiLogger } from "@/lib/logger";

/**
 * Re-process existing jobs to extract job details from OCR text
 * This is useful when jobs have empty title, company, location, salary fields
 * but contain rich OCR text in attachments
 */
export async function POST(request: NextRequest) {
  try {
    apiLogger.info("Starting job re-processing to extract details from OCR text...");

    await dbConnection.connect();
    const db = dbConnection.getDb();

    // Find jobs with empty job details but with OCR text in attachments
    const jobsToReprocess = await db.collection("job_posts").find({
      $and: [
        {
          $or: [
            { jobTitle: { $in: ["", null] } },
            { company: { $in: ["", null] } },
            { location: { $in: ["", null] } },
            { salary: { $in: ["", null] } }
          ]
        },
        {
          "apifyData.attachments.ocrText": { $exists: true, $ne: "" }
        }
      ]
    }).toArray();

    apiLogger.info(`Found ${jobsToReprocess.length} jobs to re-process`);

    if (jobsToReprocess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No jobs found that need re-processing",
        processed: 0,
        updated: 0
      });
    }

    let processedCount = 0;
    let updatedCount = 0;

    for (const job of jobsToReprocess) {
      try {
        // Convert job to the format expected by JobPostExtractor
        const postForExtraction = {
          facebookUrl: job.apifyData?.facebookUrl || job.postUrl,
          text: job.apifyData?.text || job.content || "",
          content: job.content || "",
          user: {
            id: job.apifyData?.user?.id || job.author?.id || "",
            name: job.apifyData?.user?.name || job.author?.name || "",
          },
          likesCount: job.apifyData?.likesCount || job.engagementMetrics?.likes || 0,
          commentsCount: job.apifyData?.commentsCount || job.engagementMetrics?.comments || 0,
          attachments: job.apifyData?.attachments || []
        };

        // Extract job details using the local extractor
        const extractedJobs = JobPostExtractor.extractJobPosts(JSON.stringify([postForExtraction]));

        if (extractedJobs.length > 0) {
          const extractedData = extractedJobs[0];

          // Update the job with extracted details
          const updateData: Record<string, unknown> = {
            lastReprocessedAt: new Date(),
            reprocessingVersion: "local_extractor_ocr_v1"
          };

          // Only update fields that have meaningful extracted data
          if (extractedData.jobTitle && extractedData.jobTitle.trim()) {
            updateData.jobTitle = extractedData.jobTitle;
            updateData["jobDetails.title"] = extractedData.jobTitle;
          }
          
          if (extractedData.company && extractedData.company.trim()) {
            updateData.company = extractedData.company;
            updateData["jobDetails.company"] = extractedData.company;
          }
          
          if (extractedData.location && extractedData.location.trim()) {
            updateData.location = extractedData.location;
            updateData["jobDetails.location"] = extractedData.location;
          }
          
          if (extractedData.salary && extractedData.salary.trim()) {
            updateData.salary = extractedData.salary;
            updateData["jobDetails.salary"] = extractedData.salary;
          }
          
          if (extractedData.employmentType && extractedData.employmentType.trim()) {
            updateData.employmentType = extractedData.employmentType;
            updateData["jobDetails.type"] = extractedData.employmentType;
          }

          // Update additional extracted fields
          if (extractedData.responsibilities && extractedData.responsibilities.length > 0) {
            updateData.responsibilities = extractedData.responsibilities;
          }
          
          if (extractedData.technicalSkills && extractedData.technicalSkills.length > 0) {
            updateData.technicalSkills = extractedData.technicalSkills;
          }
          
          if (extractedData.applicationMethods && extractedData.applicationMethods.length > 0) {
            updateData.applicationMethods = extractedData.applicationMethods;
          }

          // Only update if we have meaningful data to add
          if (Object.keys(updateData).length > 2) { // More than just timestamps
            const result = await db.collection("job_posts").updateOne(
              { _id: job._id },
              { $set: updateData }
            );

            if (result.modifiedCount > 0) {
              updatedCount++;
              apiLogger.info(`Updated job ${job._id} with extracted details`);
            }
          }
        }

        processedCount++;
      } catch (error) {
        apiLogger.error(`Error processing job ${job._id}:`, error);
      }
    }

    apiLogger.info(`Job re-processing completed: ${processedCount} processed, ${updatedCount} updated`);

    return NextResponse.json({
      success: true,
      message: `Successfully re-processed jobs`,
      processed: processedCount,
      updated: updatedCount,
      totalFound: jobsToReprocess.length
    });

  } catch (error) {
    apiLogger.error("Error in job re-processing:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to re-process jobs"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Job re-processing endpoint. Use POST to trigger re-processing of jobs with empty details.",
    usage: "POST /api/jobs/reprocess"
  });
}