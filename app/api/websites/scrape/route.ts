import { NextRequest, NextResponse } from "next/server";
import dbConnection from "@/lib/database";
import { SmythAIScraper } from "@/lib/smyth-ai-scraper";
import { sendJobDigestEmail } from "@/lib/mailer";
import type { WebsiteSnapshot, WebsiteJobData } from "@/types";
import { ObjectId } from "mongodb";

// POST - Scrape a specific website or all active websites
export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();
    const body = await request.json();
    const { websiteId, scrapeAll = false } = body;

    const websitesCol = dbConnection.getTrackedWebsitesCollection();
    const snapshotsCol = dbConnection.getWebsiteSnapshotsCollection();

    let websitesToScrape;

    if (scrapeAll) {
      // Scrape all active websites
      websitesToScrape = await websitesCol.find({ isActive: true }).toArray();
    } else if (websiteId) {
      // Scrape specific website
      const website = await websitesCol.findOne({
        _id: new ObjectId(websiteId),
      });
      if (!website) {
        return NextResponse.json(
          { success: false, error: "Website not found" },
          { status: 404 }
        );
      }
      websitesToScrape = [website];
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Either websiteId or scrapeAll=true is required",
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting to scrape ${websitesToScrape.length} website(s)`);

    const results = [];
    let totalNewJobs = 0;
    const allNewJobs: Array<{ website: string; jobs: WebsiteJobData[] }> = [];

    for (const website of websitesToScrape) {
      console.log(`🔍 Scraping: ${website.name} (${website.url})`);

      try {
        // Scrape the website using Smyth AI
        const scrapeResult = await SmythAIScraper.scrapeWebsite(website.url);

        if (!scrapeResult.success) {
          results.push({
            websiteId: website._id?.toString(),
            websiteName: website.name,
            success: false,
            error: scrapeResult.error,
          });
          continue;
        }

        // Get the last snapshot to compare for new jobs
        const lastSnapshot = await snapshotsCol.findOne(
          { websiteId: website._id?.toString() },
          { sort: { scrapedAt: -1 } }
        );

        const previousJobs = lastSnapshot?.jobs || [];
        const newJobs = SmythAIScraper.findNewJobs(
          scrapeResult.jobs,
          previousJobs
        );

        console.log(
          `📊 ${website.name}: ${scrapeResult.jobs.length} total jobs, ${newJobs.length} new jobs`
        );

        // Only create snapshot if there are new jobs or job count changed
        const shouldCreateSnapshot =
          newJobs.length > 0 ||
          !lastSnapshot ||
          lastSnapshot.jobCount !== scrapeResult.jobs.length;

        if (shouldCreateSnapshot) {
          console.log(
            `📸 Creating new snapshot for ${website.name} (${
              newJobs.length
            } new jobs, count changed: ${
              !lastSnapshot ||
              lastSnapshot.jobCount !== scrapeResult.jobs.length
            })`
          );

          const snapshot: Omit<WebsiteSnapshot, "_id"> = {
            websiteId: website._id?.toString() || "",
            websiteUrl: website.url,
            scrapedAt: new Date(),
            jobCount: scrapeResult.jobs.length,
            jobs: scrapeResult.jobs,
            newJobsFound: newJobs.length,
            newJobs: newJobs,
            rawApiResponse: scrapeResult.rawResponse,
          };

          await snapshotsCol.insertOne(snapshot);
        } else {
          console.log(
            `⏭️ Skipping snapshot for ${website.name} - no changes detected`
          );

          // Update the lastScraped timestamp on the most recent snapshot
          if (lastSnapshot) {
            await snapshotsCol.updateOne(
              { _id: lastSnapshot._id },
              {
                $set: {
                  lastChecked: new Date(),
                  rawApiResponse: scrapeResult.rawResponse,
                },
              }
            );
          }
        }

        // Update website stats
        await websitesCol.updateOne(
          { _id: website._id },
          {
            $set: {
              lastScraped: new Date(),
              lastJobCount: scrapeResult.jobs.length,
              updatedAt: new Date(),
            },
          }
        );

        if (newJobs.length > 0) {
          totalNewJobs += newJobs.length;
          allNewJobs.push({
            website: website.name,
            jobs: newJobs,
          });
        }

        results.push({
          websiteId: website._id?.toString(),
          websiteName: website.name,
          success: true,
          totalJobs: scrapeResult.jobs.length,
          newJobs: newJobs.length,
          lastScraped: new Date(),
        });
      } catch (error) {
        console.error(`❌ Error scraping ${website.name}:`, error);
        results.push({
          websiteId: website._id?.toString(),
          websiteName: website.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Send email notifications if new jobs found
    if (totalNewJobs > 0) {
      console.log(
        `📧 Sending email notifications for ${totalNewJobs} new jobs`
      );
      await sendNewJobNotifications(allNewJobs);
    }

    console.log(
      `✅ Scraping completed: ${totalNewJobs} new jobs found across ${websitesToScrape.length} websites`
    );

    return NextResponse.json({
      success: true,
      data: {
        websitesScraped: websitesToScrape.length,
        totalNewJobs,
        results,
        newJobsByWebsite: allNewJobs,
      },
      message: `Scraped ${websitesToScrape.length} websites, found ${totalNewJobs} new jobs`,
    });
  } catch (error) {
    console.error("❌ Error in website scraping:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to scrape websites",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to send email notifications
async function sendNewJobNotifications(
  newJobsByWebsite: Array<{ website: string; jobs: WebsiteJobData[] }>
) {
  try {
    // Get all subscribers
    const subscribersCol = dbConnection.getSubscribersCollection();
    const subscribers = await subscribersCol.find({}).toArray();

    if (subscribers.length === 0) {
      console.log("📧 No subscribers to notify");
      return;
    }

    // Prepare email content
    const emailJobs = newJobsByWebsite.flatMap(({ website, jobs }) =>
      jobs.map((job) => ({
        title: job.jobTitle,
        company: `${job.companyName} (via ${website})`,
        location: job.location,
        url: undefined, // Website jobs don't have direct URLs
        deadline: job.applicationDeadline,
      }))
    );

    // Send to each subscriber
    for (const subscriber of subscribers) {
      try {
        await sendJobDigestEmail(subscriber.email, emailJobs);
        console.log(`📧 Sent new job alert to ${subscriber.email}`);
      } catch (emailError) {
        console.error(
          `❌ Failed to send email to ${subscriber.email}:`,
          emailError
        );
      }
    }

    console.log(
      `✅ Sent new job notifications to ${subscribers.length} subscribers`
    );
  } catch (error) {
    console.error("❌ Error sending new job notifications:", error);
  }
}
