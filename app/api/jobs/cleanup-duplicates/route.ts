import { NextRequest, NextResponse } from "next/server";
import dbConnection from "@/lib/database";
import { apiLogger } from "@/lib/logger";

/**
 * @swagger
 * /api/jobs/cleanup-duplicates:
 *   post:
 *     summary: Clean up duplicate job posts
 *     description: Remove duplicate job posts from the database, keeping only the most recent version of each duplicate group based on postId. This helps maintain data quality and prevents React key conflicts.
 *     tags: [Jobs]
 *     requestBody:
 *       description: No request body required
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
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
 *                     duplicateGroupsFound:
 *                       type: number
 *                       description: Number of duplicate groups found
 *                       example: 4
 *                     totalJobsDeleted:
 *                       type: number
 *                       description: Total number of duplicate jobs removed
 *                       example: 5
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           postId:
 *                             type: string
 *                             description: Facebook post ID
 *                           jobsFound:
 *                             type: number
 *                             description: Number of duplicates found for this post
 *                           jobsDeleted:
 *                             type: number
 *                             description: Number of duplicates removed
 *                           keptJob:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: MongoDB ID of the kept job
 *                               title:
 *                                 type: string
 *                                 description: Job title
 *                               scrapedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: When the job was scraped
 *                           action:
 *                             type: string
 *                             example: "cleaned_up"
 *                 message:
 *                   type: string
 *                   example: "Cleanup completed: 5 duplicate jobs deleted"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// POST - Clean up duplicate job posts, keeping only the most recent one per postId
export async function POST(_request: NextRequest) {
  try {
    await dbConnection.connect();
    const jobsCol = dbConnection.getJobsCollection();

    // Find all jobs grouped by postId
    const duplicateGroups = await jobsCol
      .aggregate([
        {
          $group: {
            _id: "$postId",
            docs: { $push: "$$ROOT" },
            count: { $sum: 1 },
          },
        },
        {
          $match: { count: { $gt: 1 } },
        },
      ])
      .toArray();

    console.log(`🔍 Found ${duplicateGroups.length} groups of duplicate jobs`);

    let totalDeleted = 0;
    const results = [];

    for (const group of duplicateGroups) {
      const postId = group._id;
      const docs = group.docs;

      // Sort by scrapedAt descending (most recent first)
      docs.sort(
        (a: { scrapedAt: string }, b: { scrapedAt: string }) =>
          new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime()
      );

      // Keep the most recent, delete the rest
      const toKeep = docs[0];
      const toDelete = docs.slice(1);

      console.log(
        `🧹 PostId ${postId}: Keeping 1 job (${toKeep.scrapedAt}), deleting ${toDelete.length} duplicates`
      );

      // Delete duplicate jobs
      const deleteIds = toDelete.map((job: { _id: string }) => job._id);
      const deleteResult = await jobsCol.deleteMany({
        _id: { $in: deleteIds },
      });

      totalDeleted += deleteResult.deletedCount;

      results.push({
        postId,
        jobsFound: docs.length,
        jobsDeleted: deleteResult.deletedCount,
        keptJob: {
          id: toKeep._id,
          title: toKeep.jobTitle || toKeep.jobDetails?.title,
          scrapedAt: toKeep.scrapedAt,
        },
        action: "cleaned_up",
      });
    }

    console.log(`✅ Cleanup completed: ${totalDeleted} duplicate jobs deleted`);
    apiLogger.info(
      `🧹 Job duplicates cleanup: ${totalDeleted} duplicates removed`
    );

    return NextResponse.json({
      success: true,
      data: {
        duplicateGroupsFound: duplicateGroups.length,
        totalJobsDeleted: totalDeleted,
        results,
      },
      message: `Cleanup completed: ${totalDeleted} duplicate jobs deleted`,
    });
  } catch (error) {
    console.error("❌ Error cleaning up duplicate jobs:", error);
    apiLogger.error("❌ Job duplicates cleanup failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup duplicate jobs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
