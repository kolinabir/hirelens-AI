import { NextRequest, NextResponse } from "next/server";
import { JobPostExtractor } from "@/lib/job-extractor";
import { ExternalJobFilterService } from "@/lib/external-job-filter";
import dbConnection from "@/lib/database";

/**
 * POST /api/jobs/extract
 * Extracts structured job information from Facebook posts using external AI service
 *
 * @description Processes scraped job posts through external Smyth AI for filtering and structuring, then saves to database
 * @body { "postsText": "string containing JSON array of posts" }
 * @returns Array of extracted and structured job posts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postsText = body.postsText || body.posts; // Support both formats

    if (!postsText || typeof postsText !== "string") {
      return NextResponse.json(
        {
          error:
            'Invalid input. Expected "postsText" field with string containing JSON array.',
        },
        { status: 400 }
      );
    }

    // Validate that postsText is a valid JSON array and not empty
    let parsedPosts: unknown;
    try {
      parsedPosts = JSON.parse(postsText);
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON in "postsText". Expected a JSON array string.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(parsedPosts)) {
      return NextResponse.json(
        {
          error: 'Invalid input. "postsText" must be a JSON array string.',
        },
        { status: 400 }
      );
    }

    if (parsedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        processing: {
          localExtractionCount: 0,
          externalFilteringCount: 0,
          savedToDbCount: 0,
        },
        jobs: [],
        metadata: {
          processedAt: new Date().toISOString(),
          source: "facebook_scraping",
          processingPipeline: [
            "local_extraction",
            "external_ai_filtering",
            "database_storage",
          ],
          note: "Empty input array. Skipped external AI call and DB writes.",
        },
      });
    }

    console.log("🔄 Starting job extraction and filtering process...");

    // Step 1: Local extraction using existing JobPostExtractor
    const localExtractedJobs = JobPostExtractor.extractJobPosts(postsText);
    console.log(
      `✅ Local extraction completed: ${localExtractedJobs.length} jobs found`
    );

    // Step 2: Send to external API for advanced filtering and structuring
    console.log("🔄 Sending jobs to external AI for advanced filtering...");
    const externalFilterResult =
      await ExternalJobFilterService.filterAndStructureJobs(postsText);

    if (!externalFilterResult.success) {
      console.warn(
        "⚠️ External filtering failed, falling back to local extraction only"
      );
      return NextResponse.json({
        success: true,
        count: localExtractedJobs.length,
        jobs: localExtractedJobs,
        warning:
          "External AI filtering unavailable, using local extraction only",
        externalError: externalFilterResult.error,
      });
    }

    // Step 3: Parse external API response
    const structuredJobs = ExternalJobFilterService.parseExternalResponse(
      externalFilterResult.data
    );
    console.log(
      `✅ External filtering completed: ${structuredJobs.length} structured jobs received`
    );

    // Step 4: Save structured jobs to database
    console.log("🔄 Saving structured jobs to database...");
    const savedJobs = [];

    await dbConnection.connect();
    const db = dbConnection.getDb();

    for (const job of structuredJobs) {
      try {
        type StructuredJob = {
          postUrl?: string;
          attachments?: Array<{ url?: string }>;
          facebookUrl?: string;
          [key: string]: unknown;
        };
        const j = job as StructuredJob;

        // Derive a stable post URL for uniqueness: prefer job.postUrl, else first attachment url, else facebookUrl
        // If none available, create a unique identifier from user and content
        const derivedPostUrl: string | undefined =
          (typeof j.postUrl === "string" && j.postUrl.trim()) ||
          (Array.isArray(j.attachments) && j.attachments[0]?.url) ||
          (typeof j.facebookUrl === "string" && j.facebookUrl.trim()) ||
          undefined;

        let finalPostUrl: string;
        if (derivedPostUrl) {
          finalPostUrl = derivedPostUrl;
        } else {
          // Create a unique identifier from available data
          const userInfo = j.user?.id || j.user?.name || "unknown";
          const contentHash = j.originalPost
            ? j.originalPost.substring(0, 50).replace(/[^a-zA-Z0-9]/g, "")
            : "no-content";
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 15);
          finalPostUrl = `generated://${userInfo}/${contentHash}/${timestamp}/${randomId}`;
          console.log(`Generated postUrl for job: ${finalPostUrl}`);
        }

        const jobData = {
          ...job,
          postUrl: finalPostUrl,
          source: "facebook_external_ai",
          extractedAt: new Date(),
          processingVersion: "external_ai_v1",
          // Add required fields for dashboard compatibility
          postId:
            j.user?.id ||
            `generated-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 15)}`,
          groupId: "facebook-external",
          groupName: "Facebook Group (External AI)",
          content: j.originalPost || "Job post extracted via external AI",
          author: {
            name: j.user?.name || "Unknown Author",
            profileUrl: j.facebookUrl || "#",
            profileImage: undefined,
          },
          postedDate: new Date(),
          engagementMetrics: {
            likes: j.likesCount || 0,
            comments: j.commentsCount || 0,
            shares: 0,
          },
          jobDetails: {
            title: j.jobTitle,
            company: j.company,
            location: j.location,
            salary: j.salary,
            type: j.employmentType as any,
            description: j.jobSummary,
            requirements: j.technicalSkills || [],
            contactInfo: j.howToApply,
          },
          scrapedAt: new Date(),
          isProcessed: true,
          isDuplicate: false,
          tags: j.technicalSkills || [],
        };

        // Ensure we never save jobs with null/empty postUrl or postId
        if (!finalPostUrl || !jobData.postId) {
          console.error("❌ Skipping job with invalid postUrl or postId:", {
            postUrl: finalPostUrl,
            postId: jobData.postId,
          });
          continue;
        }

        let result;
        try {
          result = await dbConnection
            .getJobsCollection()
            .updateOne(
              { postUrl: finalPostUrl },
              { $set: jobData },
              { upsert: true }
            );
        } catch (duplicateError: any) {
          // Handle duplicate key errors by skipping and continuing
          if (duplicateError.code === 11000) {
            console.warn(
              `⚠️ Skipping duplicate job with postUrl: ${finalPostUrl}`
            );
            continue;
          } else {
            // Re-throw non-duplicate errors
            throw duplicateError;
          }
        }

        savedJobs.push({
          ...jobData,
          _id: result.upsertedId ?? undefined,
          _op: result.upsertedId
            ? "upserted"
            : result.modifiedCount > 0
            ? "updated"
            : "unchanged",
        });
      } catch (dbError) {
        console.error("❌ Error saving job to database:", dbError);
        // Continue with other jobs even if one fails
      }
    }

    console.log(`✅ Successfully saved ${savedJobs.length} jobs to database`);

    return NextResponse.json({
      success: true,
      processing: {
        localExtractionCount: localExtractedJobs.length,
        externalFilteringCount: structuredJobs.length,
        savedToDbCount: savedJobs.length,
      },
      jobs: savedJobs,
      metadata: {
        processedAt: new Date().toISOString(),
        source: "facebook_scraping",
        processingPipeline: [
          "local_extraction",
          "external_ai_filtering",
          "database_storage",
        ],
      },
    });
  } catch (error) {
    console.error("❌ Error in job extraction pipeline:", error);
    return NextResponse.json(
      {
        error: "Failed to extract and process job posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
