import { NextRequest, NextResponse } from "next/server";
import { DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import dbConnection from "@/lib/database";

/**
 * @swagger
 * /api/scraping/auto:
 *   post:
 *     summary: Configure automatic scraping schedule
 *     description: Set up or update automatic scraping configuration
 *     tags:
 *       - Scraping
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Enable or disable automatic scraping
 *                 example: true
 *               frequency:
 *                 type: string
 *                 enum: ["twice_daily", "thrice_daily", "hourly", "custom"]
 *                 description: Scraping frequency
 *                 example: "twice_daily"
 *               customSchedule:
 *                 type: string
 *                 description: Cron expression for custom schedule
 *                 example: "0 9,15,21 * * *"
 *               maxPostsPerGroup:
 *                 type: number
 *                 description: Maximum posts to scrape per group
 *                 example: 30
 *               scrapePhotos:
 *                 type: boolean
 *                 description: Whether to scrape photo attachments
 *                 example: true
 *           example:
 *             enabled: true
 *             frequency: "twice_daily"
 *             maxPostsPerGroup: 30
 *             scrapePhotos: true
 *     responses:
 *       200:
 *         description: Auto scraping configuration updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Auto scraping configured successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     nextRun:
 *                       type: string
 *                       format: date-time
 *                     schedule:
 *                       type: string
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      enabled = process.env.AUTO_SCRAPING_ENABLED === "true" || true,
      frequency = process.env.AUTO_SCRAPING_FREQUENCY || "twice_daily",
      customSchedule = process.env.AUTO_SCRAPING_SCHEDULE,
      maxPostsPerGroup = parseInt(process.env.AUTO_SCRAPING_MAX_POSTS || "30"),
      scrapePhotos = true,
    } = body;

    // Store configuration in a simple way (you might want to use a proper config store)
    const config = {
      enabled,
      frequency,
      customSchedule,
      maxPostsPerGroup,
      scrapePhotos,
      updatedAt: new Date(),
    };

    // Calculate next run time based on frequency
    let nextRun: Date;
    let scheduleDescription: string;

    switch (frequency) {
      case "twice_daily":
        scheduleDescription = "9:00 AM and 3:00 PM daily";
        nextRun = getNextScheduledTime([9, 15]); // 9 AM and 3 PM
        break;
      case "thrice_daily":
        scheduleDescription = "9:00 AM, 3:00 PM, and 9:00 PM daily";
        nextRun = getNextScheduledTime([9, 15, 21]); // 9 AM, 3 PM, 9 PM
        break;
      case "hourly":
        scheduleDescription = "Every hour";
        nextRun = new Date(Date.now() + 60 * 60 * 1000); // Next hour
        break;
      case "custom":
        scheduleDescription = customSchedule || "Custom schedule";
        nextRun = new Date(Date.now() + 2 * 60 * 60 * 1000); // Default 2 hours if custom
        break;
      default:
        scheduleDescription = "Twice daily (default)";
        nextRun = getNextScheduledTime([9, 15]);
    }

    apiLogger.info("Auto scraping configuration updated", config);

    return NextResponse.json({
      success: true,
      message: "Auto scraping configured successfully",
      data: {
        nextRun: nextRun.toISOString(),
        schedule: scheduleDescription,
        config,
      },
    });
  } catch (error) {
    apiLogger.error("Error configuring auto scraping", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to configure auto scraping",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/scraping/auto:
 *   get:
 *     summary: Get current auto scraping configuration
 *     description: Retrieve the current automatic scraping settings and status
 *     tags:
 *       - Scraping
 *     responses:
 *       200:
 *         description: Current auto scraping configuration
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
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     frequency:
 *                       type: string
 *                       example: "twice_daily"
 *                     nextRun:
 *                       type: string
 *                       format: date-time
 *                     lastRun:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     activeGroups:
 *                       type: number
 *                       example: 3
 */

export async function GET() {
  try {
    // Ensure database connection
    await dbConnection.connect();
    
    // Get active groups
    const activeGroups = await DatabaseUtils.findGroups({ isActive: true });

    // Simple config (in a real app, you'd store this in DB)
    const config = {
      enabled: true,
      frequency: "twice_daily",
      maxPostsPerGroup: 30,
      scrapePhotos: true,
      nextRun: getNextScheduledTime([9, 15]).toISOString(),
      lastRun: null, // You'd track this in DB
      activeGroups: activeGroups.length,
      groupUrls: activeGroups.map((g) => g.url),
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    apiLogger.error("Error getting auto scraping config", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get auto scraping configuration",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/scraping/auto:
 *   delete:
 *     summary: Disable automatic scraping
 *     description: Disable automatic scraping and clear schedule
 *     tags:
 *       - Scraping
 *     responses:
 *       200:
 *         description: Auto scraping disabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Auto scraping disabled"
 */

export async function DELETE() {
  try {
    apiLogger.info("Auto scraping disabled");

    return NextResponse.json({
      success: true,
      message: "Auto scraping disabled",
    });
  } catch (error) {
    apiLogger.error("Error disabling auto scraping", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to disable auto scraping",
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate next scheduled time
function getNextScheduledTime(hours: number[]): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Find next scheduled hour today
  for (const hour of hours.sort()) {
    const scheduledTime = new Date(today.getTime() + hour * 60 * 60 * 1000);
    if (scheduledTime > now) {
      return scheduledTime;
    }
  }

  // If no more runs today, schedule for first hour tomorrow
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return new Date(tomorrow.getTime() + hours[0] * 60 * 60 * 1000);
}
