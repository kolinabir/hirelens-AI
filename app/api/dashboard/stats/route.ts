import { NextResponse } from "next/server";
import { dbConnection, DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve real-time dashboard statistics including job counts, processing rates, active groups, and success metrics. All statistics are synchronized with the jobs API filtering logic.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function GET() {
  try {
    await dbConnection.connect();

    const stats = await DatabaseUtils.getDashboardStats();

    apiLogger.info("📊 Dashboard stats retrieved");
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    apiLogger.error("❌ Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard stats",
      },
      { status: 500 }
    );
  }
}
