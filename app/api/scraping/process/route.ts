import { NextRequest, NextResponse } from "next/server";
import { apifyService } from "@/lib/apify-service";
import { dbConnection, DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import { ExternalJobFilterService } from "@/lib/external-job-filter";

interface ProcessingResponseData {
  totalPosts: number;
  saved: number;
  duplicates: number;
  processingTime: string;
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
}

/**
 * @swagger
 * /api/scraping/process:
 *   post:
 *     summary: Process and save results from a completed Apify run
 *     description: Retrieve results from an Apify dataset and save them to the database
 *     tags:
 *       - Scraping
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               runId:
 *                 type: string
 *                 description: Apify run ID to process results from
 *                 example: "cibk1JdzaqqNc7CoM"
 *               datasetId:
 *                 type: string
 *                 description: Direct dataset ID (alternative to runId)
 *                 example: "nuA7GygxGzXM9AvdQ"
 *               groupId:
 *                 type: string
 *                 description: Target group ID for the posts
 *                 example: "devforhire"
 *               groupName:
 *                 type: string
 *                 description: Target group name for the posts
 *                 example: "Dev For Hire"
 *           example:
 *             datasetId: "nuA7GygxGzXM9AvdQ"
 *             groupId: "devforhire"
 *             groupName: "Dev For Hire"
 *     responses:
 *       200:
 *         description: Results processed and saved successfully
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
 *                       example: 72
 *                     saved:
 *                       type: number
 *                       example: 68
 *                     duplicates:
 *                       type: number
 *                       example: 4
 *                     processingTime:
 *                       type: string
 *                       example: "1.2s"
 *                 message:
 *                   type: string
 *                   example: "Processed 72 posts, saved 68 new posts"
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Connect to database
    await dbConnection.connect();

    const body = await request.json();
    const {
      runId,
      datasetId,
      groupId = "devforhire",
      groupName = "Dev For Hire",
    } = body;

    if (!runId && !datasetId) {
      return NextResponse.json(
        { success: false, error: "Either runId or datasetId is required" },
        { status: 400 }
      );
    }

    apiLogger.info("Processing Apify results", { runId, datasetId, groupId });

    let posts;

    if (datasetId) {
      // Use dataset ID directly
      posts = await apifyService.getDatasetItems(datasetId);
    } else {
      // Use run ID to get results
      posts = await apifyService.getRunResults(runId);
    }

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalPosts: 0,
          saved: 0,
          duplicates: 0,
          processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        },
        message: "No posts found to process",
      });
    }

    // Save posts to database
    const { saved, duplicates } = await DatabaseUtils.saveApifyPosts(
      posts,
      groupId,
      groupName
    );

    // Update group's last scraped time
    const existingGroups = await DatabaseUtils.findGroups({ groupId });
    if (existingGroups.length > 0) {
      await DatabaseUtils.updateGroup(groupId, {
        lastScraped: new Date(),
        totalPostsScraped: (existingGroups[0].totalPostsScraped || 0) + saved,
        updatedAt: new Date(),
      });
    }

    const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

    const responseData: ProcessingResponseData = {
      totalPosts: posts.length,
      saved,
      duplicates,
      processingTime,
    };

    // Step 2: Process posts through external AI job filtering
    if (posts.length > 0) {
      try {
        console.log('🔄 Processing scraped posts through external AI job filtering...');
        
        // Convert posts to string format for external API
        const postsJson = JSON.stringify(posts);
        
        // Send to external AI for job filtering and structuring
        const externalFilterResult = await ExternalJobFilterService.filterAndStructureJobs(postsJson);
        
        if (externalFilterResult.success && externalFilterResult.data) {
          // Parse and save structured job posts
          const structuredJobs = ExternalJobFilterService.parseExternalResponse(externalFilterResult.data);
          
          if (structuredJobs.length > 0) {
            await dbConnection.connect();
            const db = dbConnection.getDb();
            
            const savedJobs = [];
            for (const job of structuredJobs) {
              try {
                const jobData = {
                  ...job,
                  source: 'facebook_processing_external_ai',
                  extractedAt: new Date(),
                  processingVersion: 'external_ai_v1',
                  originalPostsCount: posts.length,
                  groupId,
                  groupName
                };

                const result = await db.collection('jobs').insertOne(jobData);
                savedJobs.push({
                  ...jobData,
                  _id: result.insertedId
                });
              } catch (dbError) {
                console.error('❌ Error saving structured job to database:', dbError);
              }
            }
            
            // Add job extraction results to response
            responseData.jobExtraction = {
              success: true,
              structuredJobsFound: structuredJobs.length,
              savedJobs: savedJobs.length,
              processingMethod: 'external_ai'
            };
            
            console.log(`✅ Successfully processed ${savedJobs.length} structured jobs from external AI`);
          } else {
            responseData.jobExtraction = {
              success: true,
              structuredJobsFound: 0,
              message: 'No job posts identified by external AI'
            };
          }
        } else {
          console.warn('⚠️ External AI job filtering failed:', externalFilterResult.error);
          responseData.jobExtraction = {
            success: false,
            error: externalFilterResult.error,
            fallback: 'External AI unavailable - posts saved without job structuring'
          };
        }
      } catch (jobProcessingError) {
        console.error('❌ Error during job processing:', jobProcessingError);
        responseData.jobExtraction = {
          success: false,
          error: 'Job processing failed',
          details: jobProcessingError instanceof Error ? jobProcessingError.message : 'Unknown error'
        };
      }
    }

    apiLogger.info("Apify results processed successfully", responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Processed ${posts.length} posts, saved ${saved} new posts, ${duplicates} duplicates found in ${processingTime}`,
    });
  } catch (error) {
    const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    apiLogger.error("Error processing Apify results", {
      error,
      processingTime,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process Apify results",
        processingTime,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/scraping/process:
 *   get:
 *     summary: Get information about recent Apify runs
 *     description: Get the latest Apify runs and their dataset information
 *     tags:
 *       - Scraping
 *     responses:
 *       200:
 *         description: Recent Apify runs information
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
 *                     lastRun:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         datasetId:
 *                           type: string
 *                         startedAt:
 *                           type: string
 *                         finishedAt:
 *                           type: string
 *                     availableForProcessing:
 *                       type: boolean
 */

export async function GET() {
  try {
    // For demonstration, return info about processing capability
    return NextResponse.json({
      success: true,
      data: {
        lastKnownDataset: "nuA7GygxGzXM9AvdQ", // The 72-post dataset we found
        lastKnownRun: "cibk1JdzaqqNc7CoM",
        availableForProcessing: true,
        supportedFormats: ["runId", "datasetId"],
        note: "Use POST with datasetId: 'nuA7GygxGzXM9AvdQ' to process the 72 posts from the recent run",
      },
    });
  } catch (error) {
    apiLogger.error("Error getting process information", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get process information",
      },
      { status: 500 }
    );
  }
}
