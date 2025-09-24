import { NextRequest, NextResponse } from "next/server";
import { SmythAIScraper } from "@/lib/smyth-ai-scraper";

// POST - Test scraping a website (for debugging)
export async function POST(request: NextRequest) {
  try {
    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json(
        { success: false, error: "websiteUrl is required" },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing scrape for: ${websiteUrl}`);

    const result = await SmythAIScraper.scrapeWebsite(websiteUrl);

    return NextResponse.json({
      success: result.success,
      data: {
        websiteUrl,
        jobsFound: result.jobs.length,
        jobs: result.jobs,
        rawResponse: result.rawResponse,
      },
      error: result.error,
      message: result.success
        ? `Successfully scraped ${result.jobs.length} jobs from ${websiteUrl}`
        : `Failed to scrape ${websiteUrl}: ${result.error}`,
    });
  } catch (error) {
    console.error("❌ Test scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test scrape failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
