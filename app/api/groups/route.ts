import { NextRequest, NextResponse } from "next/server";
import { dbConnection, DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import type { FacebookGroup } from "@/types";

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all Facebook groups
 *     description: Retrieve all active Facebook groups configured for scraping
 *     tags:
 *       - Groups
 *     responses:
 *       200:
 *         description: List of Facebook groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       groupId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       url:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       lastScraped:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       totalPostsScraped:
 *                         type: number
 *                       memberCount:
 *                         type: number
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
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
 *                   example: "Failed to fetch groups"
 */

export async function GET() {
  try {
    await dbConnection.connect();

    const groups = await DatabaseUtils.findGroups({ isActive: true });

    apiLogger.info(`📋 Retrieved ${groups.length} groups`);
    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    apiLogger.error("❌ Error fetching groups:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch groups",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Add Facebook groups for scraping
 *     description: Add one or more Facebook group URLs to the scraping list
 *     tags:
 *       - Groups
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Facebook group URLs
 *                 example:
 *                   - "https://www.facebook.com/groups/devforhire/"
 *                   - "https://www.facebook.com/groups/dhakajobs/"
 *                   - "https://www.facebook.com/groups/bangladeshijobs/"
 *             required:
 *               - urls
 *           example:
 *             urls:
 *               - "https://www.facebook.com/groups/devforhire/"
 *               - "https://www.facebook.com/groups/dhakajobs/"
 *     responses:
 *       200:
 *         description: Groups added successfully
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
 *                     added:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           groupId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           url:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           totalPostsScraped:
 *                             type: number
 *                     invalid:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: URLs that were invalid or not Facebook group URLs
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Any errors encountered while adding groups
 *       400:
 *         description: Invalid request - URLs array required
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
 *                   example: "URLs array is required"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to add groups"
 */

export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();

    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        {
          success: false,
          error: "URLs array is required",
        },
        { status: 400 }
      );
    }

    // Simple URL validation
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const url of urls) {
      try {
        // Basic URL validation
        const urlObj = new URL(url);
        if (
          urlObj.hostname === "facebook.com" ||
          urlObj.hostname === "www.facebook.com"
        ) {
          if (url.includes("/groups/")) {
            valid.push(url);
          } else {
            invalid.push(url);
          }
        } else {
          invalid.push(url);
        }
      } catch {
        invalid.push(url);
      }
    }

    if (invalid.length > 0) {
      apiLogger.warn(`⚠️ Invalid URLs provided: ${invalid.join(", ")}`);
    }

    const addedGroups: FacebookGroup[] = [];
    const errors: string[] = [];
    const duplicates: string[] = [];

    // Add each valid group
    for (const url of valid) {
      try {
        // Extract group ID from URL
        const groupIdMatch = url.match(/groups\/([^\/\?]+)/);
        const groupId = groupIdMatch
          ? groupIdMatch[1]
          : url.replace(/[^\w]/g, "_");

        // Check if group already exists
        const existingGroups = await DatabaseUtils.findGroups({ groupId });
        if (existingGroups.length > 0) {
          duplicates.push(url);
          continue;
        }

        const now = new Date();

        const newGroup: Omit<FacebookGroup, "_id"> = {
          groupId,
          name: `Facebook Group ${groupId}`, // Will be updated when first scraped
          url,
          isActive: true,
          totalPostsScraped: 0,
          description: `Facebook group: ${groupId}`,
          createdAt: now,
          updatedAt: now,
        };

        const insertedId = await DatabaseUtils.insertGroup(newGroup);
        addedGroups.push({ ...newGroup, _id: insertedId });

        apiLogger.info(`✅ Added group: ${url} (ID: ${groupId})`);
      } catch (error) {
        const errorMsg = `Failed to add group ${url}: ${error}`;
        errors.push(errorMsg);
        apiLogger.error(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        added: addedGroups,
        duplicates,
        invalid,
        errors,
      },
      message: `Added ${addedGroups.length} new groups. ${duplicates.length} duplicates skipped. ${invalid.length} invalid URLs.`,
    });
  } catch (error) {
    apiLogger.error("❌ Error adding groups:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add groups",
      },
      { status: 500 }
    );
  }
}
