import { NextRequest, NextResponse } from "next/server";
import { apifyService } from "@/lib/apify-service";
import { apiLogger } from "@/lib/logger";

/**
 * @swagger
 * /api/scraping/abort:
 *   post:
 *     summary: Abort running Apify processes
 *     description: Stop currently running Apify Facebook Groups Scraper processes
 *     tags:
 *       - Scraping
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               runId:
 *                 type: string
 *                 description: Specific run ID to abort (optional - if not provided, all running processes will be aborted)
 *                 example: "eOEwA3AluMYFsu8gx"
 *           example:
 *             runId: "eOEwA3AluMYFsu8gx"
 *     responses:
 *       200:
 *         description: Processes aborted successfully
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
 *                     aborted:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           runId:
 *                             type: string
 *                           status:
 *                             type: string
 *                     total:
 *                       type: number
 *                       example: 2
 *                 message:
 *                   type: string
 *                   example: "Aborted 2 running processes"
 *       404:
 *         description: No running processes found
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
 *                   example: "No running processes found"
 *       500:
 *         description: Server error during abort operation
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { runId } = body;

    apiLogger.info('Starting abort operation', { runId });

    if (runId) {
      // Abort specific run
      try {
        await apifyService.abortRun(runId);
        return NextResponse.json({
          success: true,
          data: {
            aborted: [{ runId, status: 'aborted' }],
            total: 1,
          },
          message: `Aborted run ${runId}`,
        });
      } catch (error) {
        return NextResponse.json(
          { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to abort specific run"
          },
          { status: 500 }
        );
      }
    } else {
      // Abort all running processes
      const runningProcesses = await apifyService.getRunningProcesses();
      
      if (runningProcesses.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: "No running processes found" 
          },
          { status: 404 }
        );
      }

      const aborted = [];
      const errors = [];

      for (const process of runningProcesses) {
        try {
          await apifyService.abortRun(process.id);
          aborted.push({ runId: process.id, status: 'aborted' });
        } catch (error) {
          errors.push({
            runId: process.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          aborted,
          errors,
          total: aborted.length,
        },
        message: `Aborted ${aborted.length} running processes${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      });
    }

  } catch (error) {
    apiLogger.error('Error in abort operation', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to abort processes" 
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/scraping/abort:
 *   get:
 *     summary: Get currently running Apify processes
 *     description: List all currently running Facebook Groups Scraper processes
 *     tags:
 *       - Scraping
 *     responses:
 *       200:
 *         description: List of running processes
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
 *                     running:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           startedAt:
 *                             type: string
 *                             format: date-time
 *                           datasetId:
 *                             type: string
 *                             nullable: true
 *                     total:
 *                       type: number
 *                       example: 0
 *                     recentRuns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           status:
 *                             type: string
 *                           startedAt:
 *                             type: string
 *                           finishedAt:
 *                             type: string
 *                             nullable: true
 */

export async function GET() {
  try {
    apiLogger.info('Getting running processes status');

    const [runningProcesses, recentRuns] = await Promise.all([
      apifyService.getRunningProcesses(),
      apifyService.getRecentRuns(5)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        running: runningProcesses,
        total: runningProcesses.length,
        recentRuns: recentRuns.map(run => ({
          id: run.id,
          status: run.status,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
          datasetId: run.datasetId,
        })),
      },
    });

  } catch (error) {
    apiLogger.error('Error getting running processes', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get running processes" 
      },
      { status: 500 }
    );
  }
}