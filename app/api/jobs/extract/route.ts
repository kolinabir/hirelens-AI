import { NextRequest, NextResponse } from "next/server";
import { JobPostExtractor } from "@/lib/job-extractor";
import { ExternalJobFilterService } from "@/lib/external-job-filter";
import dbConnection from "@/lib/database";

/**
 * POST /api/jobs/extract
 * Extracts structured job information from Facebook posts using external AI service
 *
 * @description Processes scraped job posts through external Smyth AI for filtering and structuring, then saves to database
 * @body { "posts": "string containing JSON array of posts" }
 * @returns Array of extracted and structured job posts
 */
export async function POST(request: NextRequest) {
  try {
    const { posts } = await request.json();

    if (!posts || typeof posts !== "string") {
      return NextResponse.json(
        {
          error:
            'Invalid input. Expected "posts" field with string containing JSON array.',
        },
        { status: 400 }
      );
    }

    // Validate that posts is a valid JSON array and not empty
    let parsedPosts: unknown;
    try {
      parsedPosts = JSON.parse(posts);
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON in "posts". Expected a JSON array string.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(parsedPosts)) {
      return NextResponse.json(
        {
          error: 'Invalid input. "posts" must be a JSON array string.',
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
    const localExtractedJobs = JobPostExtractor.extractJobPosts(posts);
    console.log(
      `✅ Local extraction completed: ${localExtractedJobs.length} jobs found`
    );

    // Step 2: Send to external API for advanced filtering and structuring
    console.log("🔄 Sending jobs to external AI for advanced filtering...");
    const externalFilterResult =
      await ExternalJobFilterService.filterAndStructureJobs(posts);

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
        const derivedPostUrl: string | undefined =
          (typeof j.postUrl === "string" && j.postUrl.trim()) ||
          (Array.isArray(j.attachments) && j.attachments[0]?.url) ||
          (typeof j.facebookUrl === "string" && j.facebookUrl.trim()) ||
          undefined;

        if (!derivedPostUrl) {
          // Skip if we cannot determine a unique post URL
          console.warn("Skipping structured job without resolvable postUrl", { jobSample: j });
          continue;
        }

        const jobData = {
          ...job,
          postUrl: derivedPostUrl,
          source: "facebook_external_ai",
          extractedAt: new Date(),
          processingVersion: "external_ai_v1",
        };

        const result = await dbConnection.getJobsCollection().updateOne(
          { postUrl: derivedPostUrl },
          { $set: jobData },
          { upsert: true }
        );

        savedJobs.push({
          ...jobData,
          _id: result.upsertedId ?? undefined,
          _op: result.upsertedId ? "upserted" : result.modifiedCount > 0 ? "updated" : "unchanged",
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
