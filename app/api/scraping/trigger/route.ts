import { NextRequest, NextResponse } from "next/server";
import { apifyService } from "@/lib/apify-service";
import { DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import { ExternalJobFilterService } from "@/lib/external-job-filter";
import { JobPostExtractor } from "@/lib/job-extractor";
import dbConnection from "@/lib/database";

interface AutoScrapingResponseData {
  totalGroups: number;
  totalPosts: number;
  saved: number;
  duplicates: number;
  executionTime: string;
  groups: Array<{
    groupId: string;
    groupName: string;
    postsFound: number;
    saved: number;
    duplicates: number;
  }>;
  jobExtraction?: {
    success: boolean;
    structuredJobsFound?: number;
    savedJobs?: number;
    processingMethod?: string;
    message?: string;
    error?: string;
    fallback?: string;
    details?: string;
  };
  // runtime metadata additions
  runId?: string;
  aborted?: boolean;
  status?: string;
}

/**
 * @swagger
 * /api/scraping/trigger:
 *   post:
 *     summary: Trigger automatic scraping for all active groups
 *     description: Execute scraping for all active Facebook groups (designed for cron/scheduler)
 *     tags:
 *       - Scraping
 *     parameters:
 *       - in: header
 *         name: x-cron-key
 *         schema:
 *           type: string
 *         description: Secret key for cron authentication
 *     responses:
 *       200:
 *         description: Automatic scraping executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalGroups:
 *                       type: number
 *                       example: 3
 *                     totalPosts:
 *                       type: number
 *                       example: 45
 *                     saved:
 *                       type: number
 *                       example: 40
 *                     duplicates:
 *                       type: number
 *                       example: 5
 *                     executionTime:
 *                       type: string
 *                       example: "2.5s"
 *                 message:
 *                   type: string
 *                   example: "Scraped 45 posts from 3 groups in 2.5s"
 *       401:
 *         description: Unauthorized - invalid cron key
 *       500:
 *         description: Server error during automatic scraping
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Simple authentication for cron jobs
    const cronKey = request.headers.get("x-cron-key");
    const expectedKey = process.env.CRON_SECRET_KEY;

    if (!expectedKey) {
      apiLogger.error("CRON_SECRET_KEY environment variable not set");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!cronKey || cronKey !== expectedKey) {
      apiLogger.warn("Unauthorized cron trigger attempt", {
        providedKey: cronKey ? "***" : "none",
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    apiLogger.info("Starting automatic scraping trigger");

    // Ensure database connection
    await dbConnection.connect();

    // Get all active groups
    const activeGroups = await DatabaseUtils.findGroups({ isActive: true });

    if (activeGroups.length === 0) {
      apiLogger.info("No active groups found for automatic scraping");
      return NextResponse.json({
        success: true,
        data: {
          totalGroups: 0,
          totalPosts: 0,
          saved: 0,
          duplicates: 0,
          executionTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        },
        message: "No active groups to scrape",
      });
    }

    const groupUrls = activeGroups.map((group) => group.url);

    // Configure for automatic scraping (lighter than manual)
    const config = {
      groupUrls,
      maxPosts: 30, // Reasonable limit for automatic runs
      scrapeComments: false, // Skip comments for faster execution
      scrapePhotos: true,
      maxPhotos: 3, // Limit photos for faster execution
    };

    apiLogger.info("Executing automatic scraping", {
      groupCount: activeGroups.length,
      config,
    });

    // Start async run with 60s watchdog
    const { runId } = await apifyService.startScraping(config);
    const maxDurationMs = 60_000;
    const pollIntervalMs = 3_000;
    const t0 = Date.now();
    let lastStatus = "RUNNING";
    let aborted = false;

    while (Date.now() - t0 < maxDurationMs) {
      try {
        const status = await apifyService.getRunStatus(runId);
        lastStatus = status.status;
        if (["SUCCEEDED", "FAILED", "ABORTED"].includes(lastStatus)) {
          break;
        }
      } catch (e) {
        apiLogger.error("Error polling Apify run status", { error: e, runId });
        break;
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    if (!["SUCCEEDED", "FAILED", "ABORTED"].includes(lastStatus)) {
      apiLogger.info("Max runtime reached, aborting run via abort API", {
        runId,
      });
      try {
        const res = await fetch("http://localhost:3000/api/scraping/abort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
        });
        apiLogger.info("Abort API called", { status: res.status });
        aborted = true;
      } catch (e) {
        apiLogger.error("Abort API call failed", { error: e, runId });
        // Fallback to direct Apify abort
        try {
          await apifyService.abortRun(runId);
          aborted = true;
        } catch (err) {
          apiLogger.error("Direct Apify abort failed", { error: err, runId });
        }
      }
    }

    // Retrieve results of the run
    const posts = await apifyService.getRunResults(runId);

    // Process and save posts for each group
    let totalSaved = 0;
    let totalDuplicates = 0;
    const groupResults = [];

    for (const group of activeGroups) {
      // Filter posts for this specific group
      const groupPosts = posts.filter((post) => post.facebookUrl === group.url);

      if (groupPosts.length > 0) {
        // Save posts to database
        const { saved, duplicates } = await DatabaseUtils.saveApifyPosts(
          groupPosts,
          group.groupId,
          group.name
        );

        totalSaved += saved;
        totalDuplicates += duplicates;

        groupResults.push({
          groupId: group.groupId,
          groupName: group.name,
          postsFound: groupPosts.length,
          saved,
          duplicates,
        });

        // Update group's last scraped time
        await DatabaseUtils.updateGroup(group.groupId, {
          lastScraped: new Date(),
          totalPostsScraped: (group.totalPostsScraped || 0) + saved,
          updatedAt: new Date(),
        });
      }
    }

    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

    const responseData: AutoScrapingResponseData = {
      totalGroups: activeGroups.length,
      totalPosts: posts.length,
      saved: totalSaved,
      duplicates: totalDuplicates,
      executionTime,
      groups: groupResults,
      runId,
      aborted,
      status: lastStatus,
    };

    // Step 2: Process posts through external AI job filtering
    if (Array.isArray(posts) && posts.length > 0) {
      try {
        apiLogger.info(
          "Processing scraped posts through external AI job filtering..."
        );

        // Convert posts to string format for external API
        const postsJson = JSON.stringify(posts);

        // Send to external AI for job filtering and structuring
        const externalFilterResult =
          await ExternalJobFilterService.filterAndStructureJobs(postsJson);

        if (externalFilterResult.success && externalFilterResult.data) {
          // Parse and save structured job posts
          const structuredJobs = ExternalJobFilterService.parseExternalResponse(
            externalFilterResult.data
          );

          if (structuredJobs.length > 0) {
            await dbConnection.connect();
            const db = dbConnection.getDb();

            // Index creation is handled by database connection initialization

            const savedJobs = [];
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
                  apiLogger.warn(
                    "Skipping structured job without resolvable postUrl",
                    { jobSample: j }
                  );
                  continue;
                }

                const jobData = {
                  ...job,
                  postUrl: derivedPostUrl,
                  source: "facebook_auto_scraping_external_ai",
                  extractedAt: new Date(),
                  processingVersion: "external_ai_v1",
                  originalPostsCount: posts.length,
                  scrapingType: "automatic",
                };

                let result;
                try {
                  result = await db
                    .collection("jobs")
                    .updateOne(
                      { postUrl: derivedPostUrl },
                      { $set: jobData },
                      { upsert: true }
                    );
                } catch (duplicateError: any) {
                  // Handle duplicate key errors by skipping and continuing
                  if (duplicateError.code === 11000) {
                    console.warn(
                      `⚠️ Skipping duplicate job with postUrl: ${derivedPostUrl}`
                    );
                    continue;
                  } else {
                    // Re-throw non-duplicate errors
                    throw duplicateError;
                  }
                }

                // Track saved/updated jobs for response metrics
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
                apiLogger.error(
                  "Error saving structured job to database:",
                  dbError
                );
              }
            }

            // Add job extraction results to response
            responseData.jobExtraction = {
              success: true,
              structuredJobsFound: structuredJobs.length,
              savedJobs: savedJobs.length,
              processingMethod: "external_ai",
            };

            apiLogger.info(
              `Successfully processed ${savedJobs.length} structured jobs from external AI during auto-scraping`
            );
          } else {
            responseData.jobExtraction = {
              success: true,
              structuredJobsFound: 0,
              message: "No job posts identified by external AI",
            };
          }
        } else {
          apiLogger.warn(
            "External AI job filtering failed:",
            externalFilterResult.error
          );

          // Fallback: Use local job extractor
          try {
            apiLogger.info(
              "Attempting fallback job extraction using local extractor..."
            );

            const localExtractedJobs =
              JobPostExtractor.extractJobPosts(postsJson);

            if (localExtractedJobs.length > 0) {
              await dbConnection.connect();
              const db = dbConnection.getDb();

              const fallbackSavedJobs = [];
              for (const job of localExtractedJobs) {
                try {
                  const derivedPostUrl =
                    job.facebookUrl ||
                    `fallback_${Date.now()}_${Math.random()}`;

                  const jobData = {
                    ...job,
                    postUrl: derivedPostUrl,
                    source: "facebook_auto_scraping_local_fallback",
                    extractedAt: new Date(),
                    processingVersion: "local_extractor_v1",
                    originalPostsCount: posts.length,
                    scrapingType: "automatic_fallback",
                  };

                  let result;
                  try {
                    result = await db
                      .collection("jobs")
                      .updateOne(
                        { postUrl: derivedPostUrl },
                        { $set: jobData },
                        { upsert: true }
                      );
                  } catch (duplicateError: any) {
                    // Handle duplicate key errors by skipping and continuing
                    if (duplicateError.code === 11000) {
                      console.warn(
                        `⚠️ Skipping duplicate fallback job with postUrl: ${derivedPostUrl}`
                      );
                      continue;
                    } else {
                      // Re-throw non-duplicate errors
                      throw duplicateError;
                    }
                  }

                  fallbackSavedJobs.push({
                    ...jobData,
                    _id: result.upsertedId ?? undefined,
                    _op: result.upsertedId
                      ? "upserted"
                      : result.modifiedCount > 0
                      ? "updated"
                      : "unchanged",
                  });
                } catch (dbError) {
                  apiLogger.error(
                    "Error saving fallback job to database:",
                    dbError
                  );
                }
              }

              responseData.jobExtraction = {
                success: true,
                structuredJobsFound: localExtractedJobs.length,
                savedJobs: fallbackSavedJobs.length,
                processingMethod: "local_fallback",
                fallback: `External AI failed, used local extractor - processed ${fallbackSavedJobs.length} jobs`,
              };

              apiLogger.info(
                `Fallback successful: processed ${fallbackSavedJobs.length} jobs using local extractor`
              );
            } else {
              responseData.jobExtraction = {
                success: false,
                error: externalFilterResult.error,
                fallback:
                  "External AI unavailable and local extractor found no jobs",
              };
            }
          } catch (fallbackError) {
            apiLogger.error(
              "Fallback job extraction also failed:",
              fallbackError
            );
            responseData.jobExtraction = {
              success: false,
              error: externalFilterResult.error,
              fallback: "Both external AI and local extractor failed",
              details:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : "Unknown fallback error",
            };
          }
        }
      } catch (jobProcessingError) {
        apiLogger.error("Error during job processing:", jobProcessingError);
        responseData.jobExtraction = {
          success: false,
          error: "Job processing failed",
          details:
            jobProcessingError instanceof Error
              ? jobProcessingError.message
              : "Unknown error",
        };
      }
    }

    apiLogger.info("Automatic scraping completed", responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Scraped ${posts.length} posts from ${activeGroups.length} groups in ${executionTime}. Saved ${totalSaved} new posts.`,
    });
  } catch (error) {
    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    apiLogger.error("Error in automatic scraping trigger", {
      error,
      executionTime,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute automatic scraping",
        executionTime,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/scraping/trigger:
 *   get:
 *     summary: Get trigger endpoint information
 *     description: Get information about the automatic scraping trigger
 *     tags:
 *       - Scraping
 *     responses:
 *       200:
 *         description: Trigger endpoint information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     endpoint:
 *                       type: string
 *                       example: "/api/scraping/trigger"
 *                     method:
 *                       type: string
 *                       example: "POST"
 *                     authentication:
 *                       type: string
 *                       example: "x-cron-key header required"
 *                     suggestedSchedule:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["0 9 * * *", "0 15 * * *", "0 21 * * *"]
 */

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      endpoint: "/api/scraping/trigger",
      method: "POST",
      authentication: "x-cron-key header required",
      suggestedSchedule: [
        "0 9 * * *", // 9 AM daily
        "0 15 * * *", // 3 PM daily
        "0 21 * * *", // 9 PM daily (optional)
      ],
      cronExamples: {
        twice_daily: "0 9,15 * * *",
        thrice_daily: "0 9,15,21 * * *",
        every_6_hours: "0 */6 * * *",
      },
    },
  });
}
