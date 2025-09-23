import { NextRequest, NextResponse } from "next/server";
import { apifyService } from "@/lib/apify-service";
import { DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";

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
    const body = await request.json();
    const { groupUrls, maxPosts = 50, scrapeComments = false, scrapePhotos = true } = body;

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
        return urlObj.hostname.includes('facebook.com') && url.includes('/groups/');
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

    apiLogger.info('Starting manual Facebook group scraping', { 
      groupUrls: validUrls, 
      maxPosts, 
      scrapeComments, 
      scrapePhotos 
    });

    // Configure Apify scraping
    const config = {
      groupUrls: validUrls,
      maxPosts,
      scrapeComments,
      scrapePhotos,
      maxPhotos: 5,
    };

    // Scrape with Apify
    const posts = await apifyService.scrapeFacebookGroups(config);

    // Process and save posts for each group
    const groupResults = [];
    let totalSaved = 0;
    let totalDuplicates = 0;

    for (const groupUrl of validUrls) {
      // Filter posts for this specific group
      const groupPosts = posts.filter(post => post.facebookUrl === groupUrl);
      
      // Extract group ID and name from URL
      const groupIdMatch = groupUrl.match(/groups\/([^\/\?]+)/);
      const groupId = groupIdMatch ? groupIdMatch[1] : 'unknown';
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
            totalPostsScraped: (existingGroups[0].totalPostsScraped || 0) + saved,
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

    const responseData = {
      totalPosts: posts.length,
      saved: totalSaved,
      duplicates: totalDuplicates,
      groups: groupResults,
    };

    apiLogger.info('Manual scraping completed', responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Successfully scraped ${posts.length} posts from ${validUrls.length} group(s). Saved ${totalSaved} new posts, ${totalDuplicates} duplicates found.`,
    });

  } catch (error) {
    apiLogger.error('Error in manual scraping', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to scrape Facebook groups" 
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
        supportedFeatures: ["photos", "attachments", "OCR", "engagement_metrics"],
        lastRun: lastResults.length > 0 ? new Date().toISOString() : null,
        lastRunPostCount: lastResults.length,
      },
    });
  } catch (error) {
    apiLogger.error('Error getting manual scraping status', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get scraping status" 
      },
      { status: 500 }
    );
  }
}