import { NextRequest, NextResponse } from "next/server";
import { apifyService } from "@/lib/apify-service";
import { DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";

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
    const cronKey = request.headers.get('x-cron-key');
    const expectedKey = process.env.CRON_SECRET_KEY || 'default-cron-key';
    
    if (cronKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    apiLogger.info('Starting automatic scraping trigger');

    // Get all active groups
    const activeGroups = await DatabaseUtils.findGroups({ isActive: true });
    
    if (activeGroups.length === 0) {
      apiLogger.info('No active groups found for automatic scraping');
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

    const groupUrls = activeGroups.map(group => group.url);
    
    // Configure for automatic scraping (lighter than manual)
    const config = {
      groupUrls,
      maxPosts: 30, // Reasonable limit for automatic runs
      scrapeComments: false, // Skip comments for faster execution
      scrapePhotos: true,
      maxPhotos: 3, // Limit photos for faster execution
    };

    apiLogger.info('Executing automatic scraping', { 
      groupCount: activeGroups.length,
      config 
    });

    // Execute scraping
    const posts = await apifyService.scrapeFacebookGroups(config);

    // Process and save posts for each group
    let totalSaved = 0;
    let totalDuplicates = 0;
    const groupResults = [];

    for (const group of activeGroups) {
      // Filter posts for this specific group
      const groupPosts = posts.filter(post => post.facebookUrl === group.url);
      
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
    
    const responseData = {
      totalGroups: activeGroups.length,
      totalPosts: posts.length,
      saved: totalSaved,
      duplicates: totalDuplicates,
      executionTime,
      groups: groupResults,
    };

    apiLogger.info('Automatic scraping completed', responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Scraped ${posts.length} posts from ${activeGroups.length} groups in ${executionTime}. Saved ${totalSaved} new posts.`,
    });

  } catch (error) {
    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    apiLogger.error('Error in automatic scraping trigger', { error, executionTime });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to execute automatic scraping",
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
        "0 9 * * *",   // 9 AM daily
        "0 15 * * *",  // 3 PM daily
        "0 21 * * *",  // 9 PM daily (optional)
      ],
      cronExamples: {
        twice_daily: "0 9,15 * * *",
        thrice_daily: "0 9,15,21 * * *",
        every_6_hours: "0 */6 * * *",
      },
    },
  });
}