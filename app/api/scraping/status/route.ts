import { NextResponse } from "next/server";
import { apifyService } from "@/lib/apify-service";
import { apiLogger } from "@/lib/logger";

/**
 * @swagger
 * /api/scraping/status:
 *   get:
 *     summary: Get scraping status
 *     description: Get the current status of all running scraping processes
 *     tags:
 *       - Scraping
 *     responses:
 *       200:
 *         description: Scraping status retrieved successfully
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
 *                     runningProcesses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           runId:
 *                             type: string
 *                           status:
 *                             type: string
 *                           startedAt:
 *                             type: string
 *                             format: date-time
 *                           elapsedTime:
 *                             type: string
 *                     recentRuns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           runId:
 *                             type: string
 *                           status:
 *                             type: string
 *                           startedAt:
 *                             type: string
 *                             format: date-time
 *                           finishedAt:
 *                             type: string
 *                             format: date-time
 *                           duration:
 *                             type: string
 *                           itemsScraped:
 *                             type: number
 *       500:
 *         description: Server error
 */
export async function GET() {
  try {
    apiLogger.info("Getting running processes status");

    // Get running processes
    const runningProcesses = await apifyService.getRunningProcesses();

    // Get recent runs
    const recentRuns = await apifyService.getRecentRuns(10);

    const data = {
      runningProcesses: runningProcesses.map((run) => ({
        runId: run.id,
        status: run.status,
        startedAt: run.startedAt,
        elapsedTime: run.startedAt
          ? `${Math.floor(
              (Date.now() - new Date(run.startedAt).getTime()) / 1000
            )}s`
          : "Unknown",
      })),
      recentRuns: recentRuns.map((run) => ({
        runId: run.id,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        duration:
          run.startedAt && run.finishedAt
            ? `${Math.floor(
                (new Date(run.finishedAt).getTime() -
                  new Date(run.startedAt).getTime()) /
                  1000
              )}s`
            : "Unknown",
        itemsScraped: run.stats?.itemsScraped || 0,
      })),
    };

    apiLogger.info("Found running Apify processes", {
      count: runningProcesses.length,
      runIds: runningProcesses.map((r) => r.id),
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    apiLogger.error("❌ Error getting scraping status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get scraping status",
      },
      { status: 500 }
    );
  }
}
