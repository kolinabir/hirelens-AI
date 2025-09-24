import { NextRequest, NextResponse } from "next/server";
import dbConnection from "@/lib/database";

// POST - Clean up duplicate snapshots, keeping only the most recent one per website
export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();
    const snapshotsCol = dbConnection.getWebsiteSnapshotsCollection();

    // Get all snapshots grouped by websiteId
    const allSnapshots = await snapshotsCol
      .find({})
      .sort({ websiteId: 1, scrapedAt: -1 })
      .toArray();

    console.log(`🔍 Found ${allSnapshots.length} total snapshots`);

    // Group by websiteId
    const snapshotsByWebsite: { [websiteId: string]: unknown[] } = {};
    for (const snapshot of allSnapshots) {
      if (!snapshotsByWebsite[snapshot.websiteId]) {
        snapshotsByWebsite[snapshot.websiteId] = [];
      }
      snapshotsByWebsite[snapshot.websiteId].push(snapshot);
    }

    let totalDeleted = 0;
    const results = [];

    // For each website, keep only the most recent snapshot
    for (const [websiteId, snapshots] of Object.entries(snapshotsByWebsite)) {
      if (snapshots.length <= 1) {
        console.log(
          `✅ Website ${websiteId}: Only ${snapshots.length} snapshot, no cleanup needed`
        );
        results.push({
          websiteId,
          snapshotsFound: snapshots.length,
          snapshotsDeleted: 0,
          action: "no_cleanup_needed",
        });
        continue;
      }

      // Sort by scrapedAt descending (most recent first)
      snapshots.sort(
        (a, b) =>
          new Date((b as { scrapedAt: string }).scrapedAt).getTime() -
          new Date((a as { scrapedAt: string }).scrapedAt).getTime()
      );

      // Keep the most recent, delete the rest
      const toKeep = snapshots[0];
      const toDelete = snapshots.slice(1);

      console.log(
        `🧹 Website ${websiteId}: Keeping 1 snapshot (${
          (toKeep as { scrapedAt: string }).scrapedAt
        }), deleting ${toDelete.length} duplicates`
      );

      // Delete duplicate snapshots
      const deleteIds = toDelete.map((s) => (s as { _id: string })._id);
      const deleteResult = await snapshotsCol.deleteMany({
        _id: { $in: deleteIds },
      });

      totalDeleted += deleteResult.deletedCount;

      results.push({
        websiteId,
        snapshotsFound: snapshots.length,
        snapshotsDeleted: deleteResult.deletedCount,
        keptSnapshot: {
          id: (toKeep as { _id: string })._id,
          scrapedAt: (toKeep as { scrapedAt: string }).scrapedAt,
          jobCount: (toKeep as { jobCount: number }).jobCount,
        },
        action: "cleaned_up",
      });
    }

    console.log(
      `✅ Cleanup completed: ${totalDeleted} duplicate snapshots deleted`
    );

    return NextResponse.json({
      success: true,
      data: {
        totalSnapshotsBefore: allSnapshots.length,
        totalSnapshotsDeleted: totalDeleted,
        totalSnapshotsAfter: allSnapshots.length - totalDeleted,
        websiteResults: results,
      },
      message: `Cleanup completed: ${totalDeleted} duplicate snapshots deleted`,
    });
  } catch (error) {
    console.error("❌ Error cleaning up duplicate snapshots:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup duplicate snapshots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
