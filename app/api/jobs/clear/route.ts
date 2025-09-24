import { NextRequest, NextResponse } from "next/server";
import { dbConnection, DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";

/**
 * DELETE /api/jobs/clear
 * Clear all job posts from the database (for testing purposes)
 */
export async function DELETE(request: NextRequest) {
  try {
    await dbConnection.connect();
    
    const deletedCount = await DatabaseUtils.clearAllJobPosts();
    
    apiLogger.info("Cleared all job posts from database", { deletedCount });
    
    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        message: `Successfully deleted ${deletedCount} job posts`
      }
    });
  } catch (error) {
    apiLogger.error("Failed to clear job posts", { error });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear job posts"
      },
      { status: 500 }
    );
  }
}