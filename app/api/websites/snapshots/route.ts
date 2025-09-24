import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import dbConnection from "@/lib/database";

// GET - Fetch website snapshots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    await dbConnection.connect();

    const snapshotsCol = dbConnection.getWebsiteSnapshotsCollection();
    const websitesCol = dbConnection.getTrackedWebsitesCollection();

    // Build query
    const query: Record<string, unknown> = {};
    if (websiteId) {
      query.websiteId = websiteId;
    }

    // Fetch snapshots with pagination
    const snapshots = await snapshotsCol
      .find(query)
      .sort({ scrapedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Enrich snapshots with website names
    const enrichedSnapshots = await Promise.all(
      snapshots.map(async (snapshot) => {
        const website = await websitesCol.findOne({
          _id: new ObjectId(snapshot.websiteId),
        } as Record<string, unknown>);

        return {
          ...snapshot,
          websiteName: website?.name || "Unknown Website",
          websiteUrl: website?.url,
          companyName: website?.companyName,
        };
      })
    );

    // Get total count for pagination
    const totalCount = await snapshotsCol.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: enrichedSnapshots,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching website snapshots:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch website snapshots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete old snapshots (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");
    const daysOld = parseInt(searchParams.get("daysOld") || "30");

    await dbConnection.connect();

    const snapshotsCol = dbConnection.getWebsiteSnapshotsCollection();

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Build query
    const query: Record<string, unknown> = {
      scrapedAt: { $lt: cutoffDate },
    };

    if (websiteId) {
      query.websiteId = websiteId;
    }

    // Delete old snapshots
    const result = await snapshotsCol.deleteMany(query);

    console.log(
      `🗑️ Deleted ${result.deletedCount} old snapshots (older than ${daysOld} days)`
    );

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString(),
      },
      message: `Deleted ${result.deletedCount} old snapshots`,
    });
  } catch (error) {
    console.error("❌ Error deleting old snapshots:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete old snapshots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
