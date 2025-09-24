// Daily website scraper script
// Usage: npm run scrape-websites-daily
// Or setup as a cron job: 0 9 * * * node ./scripts/daily-website-scraper.js

const url =
  process.env.WEBSITE_SCRAPER_URL ||
  "http://localhost:3000/api/websites/schedule-daily";

async function main() {
  try {
    console.log("🕐 Starting daily website scraping...");

    const res = await fetch(url, { method: "POST" });
    const json = await res.json();

    if (json.success) {
      console.log("✅ Daily website scraping completed successfully");
      console.log(
        `📊 Results: ${json.data.totalNewJobs} new jobs found across ${json.data.websitesScraped} websites`
      );

      if (json.data.totalNewJobs > 0) {
        console.log("📧 Email notifications sent to subscribers");
      }
    } else {
      console.error("❌ Daily website scraping failed:", json.error);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Daily website scraping error:", err);
    process.exit(1);
  }
}

main();
