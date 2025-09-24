import { NextRequest, NextResponse } from "next/server";
import { ExternalJobFilterService } from "@/lib/external-job-filter";
import dbConnection from "@/lib/database";
import { ObjectId } from "mongodb";
import { apiLogger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      );
    }

    await dbConnection.connect();
    const jobsCol = dbConnection.getJobsCollection();

    // Get the job to process
    const job = await jobsCol.findOne({
      _id: new ObjectId(jobId),
    } as Record<string, unknown>);

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if job is already processed
    if (job.isProcessed) {
      return NextResponse.json({
        success: true,
        message: "Job is already processed",
        job: job,
        alreadyProcessed: true,
      });
    }

    apiLogger.info(`🔄 Starting manual processing for job ${jobId}`);

    // Prepare the post data for external AI processing
    const postForProcessing = {
      text: job.content || job.originalPost || "",
      user: job.user || job.author,
      facebookUrl: job.facebookUrl || job.postUrl,
      likesCount: job.likesCount || job.engagementMetrics?.likes || 0,
      commentsCount: job.commentsCount || job.engagementMetrics?.comments || 0,
      attachments: job.attachments || [],
    };

    const postsText = JSON.stringify([postForProcessing]);

    // Step 1: Send to external AI for processing
    console.log("🔄 Sending job to external AI for processing...");
    const externalFilterResult =
      await ExternalJobFilterService.filterAndStructureJobs(postsText);

    if (!externalFilterResult.success) {
      apiLogger.warn("⚠️ External filtering failed for manual processing");
      return NextResponse.json({
        success: false,
        error: "External AI processing failed",
        details: externalFilterResult.error,
      });
    }

    // Step 2: Parse external API response
    const structuredJobs = ExternalJobFilterService.parseExternalResponse(
      externalFilterResult.data
    );

    if (structuredJobs.length === 0) {
      apiLogger.warn("⚠️ No structured jobs returned from external AI");
      return NextResponse.json({
        success: false,
        error: "No structured job data returned from AI processing",
      });
    }

    const processedJob = structuredJobs[0]; // Take the first (and should be only) result

    // Step 3: Update the job in database with processed data
    const updateData = {
      // Mark as processed
      isProcessed: true,
      extractedAt: new Date(),
      processingVersion: "manual_external_ai_v1",

      // Update with AI-extracted data
      jobTitle: processedJob.jobTitle || job.jobTitle,
      company: processedJob.company || job.company,
      location: processedJob.location || job.location,
      salary: processedJob.salary || job.salary,
      employmentType: processedJob.employmentType || job.employmentType,
      experienceLevel: processedJob.experienceLevel || job.experienceLevel,
      experienceRequired:
        processedJob.experienceRequired || job.experienceRequired,
      education: processedJob.education || job.education,
      technicalSkills:
        processedJob.technicalSkills || job.technicalSkills || [],
      niceToHaveSkills:
        processedJob.niceToHaveSkills || job.niceToHaveSkills || [],
      softSkills: processedJob.softSkills || job.softSkills || [],
      responsibilities:
        processedJob.responsibilities || job.responsibilities || [],
      benefits: processedJob.benefits || job.benefits || [],
      applicationDeadline:
        processedJob.applicationDeadline || job.applicationDeadline,
      applicationMethods:
        processedJob.applicationMethods || job.applicationMethods || [],
      workingDaysHours: processedJob.workingDaysHours || job.workingDaysHours,
      genderEligibility:
        processedJob.genderEligibility || job.genderEligibility,
      howToApply: processedJob.howToApply || job.howToApply,

      // Add structured job details
      jobDetails: {
        title: processedJob.jobTitle || processedJob.title || job.jobTitle,
        company: processedJob.company || job.company,
        location: processedJob.location || job.location,
        salary: processedJob.salary || job.salary,
        type: processedJob.employmentType || job.employmentType,
        description:
          processedJob.jobSummary || processedJob.description || job.jobSummary,
        requirements: processedJob.technicalSkills || job.technicalSkills || [],
        contactInfo: processedJob.howToApply || job.howToApply,
      },
    };

    // Update the job
    const updateResult = await jobsCol.updateOne(
      { _id: new ObjectId(jobId) } as Record<string, unknown>,
      { $set: updateData as Record<string, unknown> }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update job" },
        { status: 500 }
      );
    }

    // Get the updated job
    const updatedJob = await jobsCol.findOne({
      _id: new ObjectId(jobId),
    } as Record<string, unknown>);

    apiLogger.info(`✅ Successfully processed job ${jobId} manually`);

    return NextResponse.json({
      success: true,
      message: "Job processed successfully",
      job: updatedJob,
      processedData: processedJob,
    });
  } catch (error) {
    apiLogger.error("❌ Manual job processing failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process job manually" },
      { status: 500 }
    );
  }
}

// GET endpoint to get next unprocessed job
export async function GET(request: NextRequest) {
  try {
    await dbConnection.connect();
    const jobsCol = dbConnection.getJobsCollection();

    // Find the next unprocessed job (oldest first)
    const unprocessedJob = await jobsCol.findOne({
      isProcessed: { $ne: true },
    } as Record<string, unknown>);

    if (!unprocessedJob) {
      return NextResponse.json({
        success: true,
        job: null,
        message: "No more unprocessed jobs found",
      });
    }

    // Also get the count of remaining unprocessed jobs
    const remainingCount = await jobsCol.countDocuments({
      isProcessed: { $ne: true },
    } as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      job: unprocessedJob,
      remainingCount: remainingCount,
    });
  } catch (error) {
    apiLogger.error("❌ Failed to get unprocessed job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get unprocessed job" },
      { status: 500 }
    );
  }
}
