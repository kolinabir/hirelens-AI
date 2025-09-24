import { NextRequest, NextResponse } from "next/server";
import dbConnection from "@/lib/database";
import type { TrackedWebsite } from "@/types";

// GET - List all tracked websites
export async function GET() {
  try {
    await dbConnection.connect();
    const col = dbConnection.getTrackedWebsitesCollection();

    const websites = await col.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      data: websites,
    });
  } catch (error) {
    console.error("Error fetching tracked websites:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch websites" },
      { status: 500 }
    );
  }
}

// POST - Add new website to track
export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();
    const { url, name, companyName } = await request.json();

    if (!url || !name) {
      return NextResponse.json(
        { success: false, error: "url and name are required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const col = dbConnection.getTrackedWebsitesCollection();

    // Check if URL already exists
    const existing = await col.findOne({ url: url.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Website already being tracked" },
        { status: 400 }
      );
    }

    const website: Omit<TrackedWebsite, "_id"> = {
      url: url.toLowerCase(),
      name,
      companyName,
      isActive: true,
      lastJobCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      scrapingInterval: 24, // default 24 hours
    };

    const result = await col.insertOne(website);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...website },
    });
  } catch (error) {
    console.error("Error adding tracked website:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add website" },
      { status: 500 }
    );
  }
}

// DELETE - Remove tracked website
export async function DELETE(request: NextRequest) {
  try {
    await dbConnection.connect();
    const { websiteIds } = await request.json();

    if (!websiteIds || !Array.isArray(websiteIds)) {
      return NextResponse.json(
        { success: false, error: "websiteIds array is required" },
        { status: 400 }
      );
    }

    const websitesCol = dbConnection.getTrackedWebsitesCollection();
    const snapshotsCol = dbConnection.getWebsiteSnapshotsCollection();

    const removed: string[] = [];
    const notFound: string[] = [];

    for (const websiteId of websiteIds) {
      try {
        // Remove the website
        const websiteResult = await websitesCol.deleteOne({ _id: websiteId });

        if (websiteResult.deletedCount > 0) {
          // Also remove all snapshots for this website
          await snapshotsCol.deleteMany({ websiteId });
          removed.push(websiteId);
          console.log(`✅ Removed website and snapshots: ${websiteId}`);
        } else {
          notFound.push(websiteId);
          console.warn(`⚠️ Website not found: ${websiteId}`);
        }
      } catch (error) {
        notFound.push(websiteId);
        console.error(`❌ Error removing website ${websiteId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: { removed, notFound },
      message: `Removed ${removed.length} websites. ${notFound.length} not found.`,
    });
  } catch (error) {
    console.error("Error removing websites:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove websites" },
      { status: 500 }
    );
  }
}
