import { NextRequest, NextResponse } from "next/server";
import { dbConnection, DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";

/**
 * DELETE /api/jobs/clear
 * Clear job posts from the database
 * Optional: ?unstructuredOnly=true to only remove jobs without structured data
 */
export async function DELETE(request: NextRequest) {
  try {
    await dbConnection.connect();

    const { searchParams } = new URL(request.url);
    const unstructuredOnly = searchParams.get("unstructuredOnly") === "true";

    const deletedCount = unstructuredOnly
      ? await DatabaseUtils.clearUnstructuredJobPosts()
      : await DatabaseUtils.clearAllJobPosts();

    apiLogger.info(
      unstructuredOnly
        ? "🧹 Cleared unstructured job posts"
        : "🗑️ Cleared ALL job posts",
      { deletedCount }
    );

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        message: `Successfully deleted ${deletedCount} job posts`,
      },
    });
  } catch (error) {
    apiLogger.error("Failed to clear job posts", { error });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to clear job posts",
      },
      { status: 500 }
    );
  }
}