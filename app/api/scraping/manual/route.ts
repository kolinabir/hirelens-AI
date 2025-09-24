import { NextRequest, NextResponse } from "next/server";
import { apifyService } from "@/lib/apify-service";
import { DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import { ExternalJobFilterService } from "@/lib/external-job-filter";
import dbConnection from "@/lib/database";

interface ScrapingResponseData {
  totalPosts: number;
  saved: number;
  duplicates: number;
  groups: Array<{
    url: string;
    postsFound: number;
    postsSaved: number;
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
  // Added runtime control metadata
  runId?: string;
  aborted?: boolean;
  timeElapsed?: string;
  status?: string;
}

/**
 * @swagger
 * /api/scraping/manual:
 *   post:
 *     summary: Manually scrape Facebook groups using Apify
 *     description: Trigger manual scraping of specified Facebook groups
 *     tags:
 *       - Scraping
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Facebook group URLs to scrape
 *                 example: ["https://www.facebook.com/groups/devforhire/"]
 *               maxPosts:
 *                 type: number
 *                 description: Maximum number of posts to scrape per group
 *                 example: 50
 *               scrapeComments:
 *                 type: boolean
 *                 description: Whether to scrape comments
 *                 example: false
 *               scrapePhotos:
 *                 type: boolean
 *                 description: Whether to scrape photo attachments
 *                 example: true
 *             required:
 *               - groupUrls
 *           example:
 *             groupUrls: ["https://www.facebook.com/groups/devforhire/"]
 *             maxPosts: 50
 *             scrapeComments: false
 *             scrapePhotos: true
 *     responses:
 *       200:
 *         description: Scraping completed successfully
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
 *                     totalPosts:
 *                       type: number
 *                       example: 25
 *                     saved:
 *                       type: number
 *                       example: 20
 *                     duplicates:
 *                       type: number
 *                       example: 5
 *                     groups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           postsFound:
 *                             type: number
 *                           postsSaved:
 *                             type: number
 *                 message:
 *                   type: string
 *                   example: "Successfully scraped 25 posts from 1 group(s)"
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "groupUrls is required and must be an array"
 *       500:
 *         description: Server error during scraping
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to scrape Facebook groups"
 */

export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();
    const body = await request.json();
    const {
      groupUrls,
      maxPosts = 50,
      scrapeComments = false,
      scrapePhotos = true,
    } = body;

    // Validation
    if (!groupUrls || !Array.isArray(groupUrls) || groupUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "groupUrls is required and must be an array" },
        { status: 400 }
      );
    }

    // Validate Facebook group URLs
    const validUrls = groupUrls.filter((url: string) => {
      try {
        const urlObj = new URL(url);
        return (
          urlObj.hostname.includes("facebook.com") && url.includes("/groups/")
        );
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid Facebook group URLs provided" },
        { status: 400 }
      );
    }

    apiLogger.info("Starting manual Facebook group scraping", {
      groupUrls: validUrls,
      maxPosts,
      scrapeComments,
      scrapePhotos,
    });

    // Configure Apify scraping
    const config = {
      groupUrls: validUrls,
      maxPosts,
      scrapeComments,
      scrapePhotos,
      maxPhotos: 5,
    };

    // Scrape with Apify (async run with 60s timeout and abort)
    apiLogger.info("Starting async Apify run with 60s timeout", {
      groupUrls: validUrls,
    });
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

    const posts = await apifyService.getRunResults(runId);
    const timeElapsed = `${Math.floor((Date.now() - t0) / 1000)}s`;

    // Process and save posts for each group
    const groupResults = [];
    let totalSaved = 0;
    let totalDuplicates = 0;

    for (const groupUrl of validUrls) {
      // Filter posts for this specific group
      const groupPosts = posts.filter((post) => post.facebookUrl === groupUrl);

      // Extract group ID and name from URL
      const groupIdMatch = groupUrl.match(/groups\/([^\/\?]+)/);
      const groupId = groupIdMatch ? groupIdMatch[1] : "unknown";
      const groupName = `Group ${groupId}`;

      if (groupPosts.length > 0) {
        // Save posts to database
        const { saved, duplicates } = await DatabaseUtils.saveApifyPosts(
          groupPosts,
          groupId,
          groupName
        );

        totalSaved += saved;
        totalDuplicates += duplicates;

        groupResults.push({
          url: groupUrl,
          postsFound: groupPosts.length,
          postsSaved: saved,
          duplicates,
        });

        // Update group's last scraped time
        const existingGroups = await DatabaseUtils.findGroups({ groupId });
        if (existingGroups.length === 0) {
          // Create new group record
          await DatabaseUtils.insertGroup({
            groupId,
            name: groupName,
            url: groupUrl,
            isActive: true,
            totalPostsScraped: saved,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Update existing group
          await DatabaseUtils.updateGroup(groupId, {
            lastScraped: new Date(),
            totalPostsScraped:
              (existingGroups[0].totalPostsScraped || 0) + saved,
            updatedAt: new Date(),
          });
        }
      } else {
        groupResults.push({
          url: groupUrl,
          postsFound: 0,
          postsSaved: 0,
          duplicates: 0,
        });
      }
    }

    const responseData: ScrapingResponseData = {
      totalPosts: posts.length,
      saved: totalSaved,
      duplicates: totalDuplicates,
      groups: groupResults,
      runId,
      aborted,
      timeElapsed,
      status: lastStatus,
    };

    // Step 2: Process each post individually through external AI job filtering
    if (Array.isArray(posts) && posts.length > 0) {
      try {
        console.log(
          `🔄 Processing ${posts.length} scraped posts individually through external AI job filtering...`
        );

        const allStructuredJobs = [];

        // Process each post individually
        for (let i = 0; i < posts.length; i++) {
          const post = posts[i];
          console.log(
            `🔄 Processing post ${i + 1}/${posts.length} by ${
              post.author?.name || "Unknown"
            }`
          );

          // Convert single post to string format for external API
          const singlePostJson = JSON.stringify([post]);

          // Send to external AI for job filtering and structuring
          const externalFilterResult =
            await ExternalJobFilterService.filterAndStructureJobs(
              singlePostJson
            );

          if (externalFilterResult.success && externalFilterResult.data) {
            // Parse structured job posts from this individual post
            const structuredJobs =
              ExternalJobFilterService.parseExternalResponse(
                externalFilterResult.data
              );

            if (structuredJobs.length > 0) {
              console.log(
                `✅ Found ${
                  structuredJobs.length
                } structured job(s) from post ${i + 1}`
              );
              allStructuredJobs.push(...structuredJobs);
            } else {
              console.log(`ℹ️ No job data found in post ${i + 1}`);
            }
          } else {
            console.warn(
              `⚠️ External AI processing failed for post ${i + 1}:`,
              externalFilterResult.error
            );
          }

          // Add small delay between API calls to avoid rate limiting
          if (i < posts.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        console.log(
          `🎯 Total structured jobs found: ${allStructuredJobs.length}`
        );

        if (allStructuredJobs.length > 0) {
          await dbConnection.connect();
          const db = dbConnection.getDb();

          // Index creation is handled by database connection initialization

          const savedJobs = [];
          for (const job of allStructuredJobs) {
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
                const userInfo =
                  (j as any).user?.id || (j as any).user?.name || "unknown";
                const contentHash = (j as any).originalPost
                  ? (j as any).originalPost
                      .substring(0, 50)
                      .replace(/[^a-zA-Z0-9]/g, "")
                  : "no-content";
                const timestamp = Date.now();
                const randomId = Math.random().toString(36).substring(2, 15);
                finalPostUrl = `generated://${userInfo}/${contentHash}/${timestamp}/${randomId}`;
                console.log(`Generated postUrl for Apify job: ${finalPostUrl}`);
              }

              const jobData = {
                ...job,
                postUrl: finalPostUrl,
                source: "facebook_scraping_external_ai",
                extractedAt: new Date(),
                processingVersion: "external_ai_v1",
                originalPostsCount: posts.length,
                // Add required fields for dashboard compatibility
                postId:
                  (j as any).user?.id ||
                  `apify-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 15)}`,
                groupId: "facebook-apify",
                groupName: "Facebook Group (Apify + External AI)",
                content:
                  (j as any).originalPost ||
                  "Job post scraped via Apify and processed by external AI",
                author: {
                  name: (j as any).user?.name || "Unknown Author",
                  profileUrl: (j as any).facebookUrl || "#",
                  profileImage: undefined,
                },
                postedDate: new Date(),
                engagementMetrics: {
                  likes: (j as any).likesCount || 0,
                  comments: (j as any).commentsCount || 0,
                  shares: 0,
                },
                jobDetails: {
                  title: (j as any).jobTitle,
                  company: (j as any).company,
                  location: (j as any).location,
                  salary: (j as any).salary,
                  type: (j as any).employmentType as any,
                  description: (j as any).jobSummary,
                  requirements: (j as any).technicalSkills || [],
                  contactInfo: (j as any).howToApply,
                },
                scrapedAt: new Date(),
                isProcessed: true,
                isDuplicate: false,
                tags: (j as any).technicalSkills || [],
              };

              // Ensure we never save jobs with null/empty postUrl or postId
              if (!finalPostUrl || !jobData.postId) {
                console.error(
                  "❌ Skipping job with invalid postUrl or postId:",
                  {
                    postUrl: finalPostUrl,
                    postId: jobData.postId,
                  }
                );
                continue;
              }

              let result;
              try {
                result = await db
                  .collection("jobs")
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
              console.error(
                "❌ Error saving structured job to database:",
                dbError
              );
            }
          }

          // Add job extraction results to response
          responseData.jobExtraction = {
            success: true,
            structuredJobsFound: allStructuredJobs.length,
            savedJobs: savedJobs.length,
            processingMethod: "external_ai",
          };

          console.log(
            `✅ Successfully processed ${savedJobs.length} structured jobs from external AI`
          );
        } else {
          responseData.jobExtraction = {
            success: true,
            structuredJobsFound: 0,
            message: "No job posts identified by external AI",
          };
        }
      } catch (jobProcessingError) {
        console.error("❌ Error during job processing:", jobProcessingError);
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

    apiLogger.info("Manual scraping completed", responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Successfully scraped ${posts.length} posts from ${validUrls.length} group(s). Saved ${totalSaved} new posts, ${totalDuplicates} duplicates found.`,
    });
  } catch (error) {
    apiLogger.error("Error in manual scraping", { error });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to scrape Facebook groups",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/scraping/manual:
 *   get:
 *     summary: Get manual scraping status and options
 *     description: Get information about manual scraping capabilities
 *     tags:
 *       - Scraping
 *     responses:
 *       200:
 *         description: Scraping status and options
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
 *                     available:
 *                       type: boolean
 *                       example: true
 *                     maxPostsPerGroup:
 *                       type: number
 *                       example: 100
 *                     supportedFeatures:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["photos", "attachments", "OCR"]
 *                     lastRun:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 */

export async function GET() {
  try {
    // Get last successful run info
    const lastResults = await apifyService.getLastRunResults();

    return NextResponse.json({
      success: true,
      data: {
        available: true,
        maxPostsPerGroup: 100,
        supportedFeatures: [
          "photos",
          "attachments",
          "OCR",
          "engagement_metrics",
        ],
        lastRun: lastResults.length > 0 ? new Date().toISOString() : null,
        lastRunPostCount: lastResults.length,
      },
    });
  } catch (error) {
    apiLogger.error("Error getting manual scraping status", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get scraping status",
      },
      { status: 500 }
    );
  }
}
