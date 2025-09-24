import { NextRequest, NextResponse } from "next/server";

// POST - Trigger daily scraping (can be called by cron job or manual)
export async function POST(request: NextRequest) {
  try {
    console.log("🕐 Starting daily website scraping job");

    // Call the scrape endpoint to scrape all active websites
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const scrapeResponse = await fetch(`${baseUrl}/api/websites/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scrapeAll: true }),
    });

    const scrapeResult = await scrapeResponse.json();

    if (scrapeResult.success) {
      console.log(
        `✅ Daily scraping completed: ${scrapeResult.data.totalNewJobs} new jobs found`
      );

      return NextResponse.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          websitesScraped: scrapeResult.data.websitesScraped,
          totalNewJobs: scrapeResult.data.totalNewJobs,
          results: scrapeResult.data.results,
        },
        message: `Daily scraping completed: ${scrapeResult.data.totalNewJobs} new jobs found across ${scrapeResult.data.websitesScraped} websites`,
      });
    } else {
      console.error("❌ Daily scraping failed:", scrapeResult.error);
      return NextResponse.json(
        {
          success: false,
          error: "Daily scraping failed",
          details: scrapeResult.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error in daily scraping job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Daily scraping job failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
