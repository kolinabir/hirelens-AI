import { NextRequest, NextResponse } from "next/server";
import { enhancedBrowserManager } from "@/lib/anti-detection";
import { facebookAuth } from "@/lib/facebook-auth";
import { groupNavigator } from "@/lib/group-navigator";
import { dbConnection, DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";
import type { JobPost, FacebookGroup } from "@/types";
import { Page } from "puppeteer";

export async function POST(request: NextRequest) {
  let browser = null;
  let page = null;
  const sessionId = uuidv4();

  try {
    const body = await request.json();
    const { groupId, scrollLimit = 3 } = body;

    apiLogger.info(`🚀 Starting scraping session: ${sessionId}`);

    // Connect to database
    await dbConnection.connect();

    // Get the group to scrape
    let targetGroup: FacebookGroup | null = null;
    if (groupId) {
      const groups = await DatabaseUtils.findGroups({ groupId });
      targetGroup = groups[0] || null;
    } else {
      // Get first active group
      const groups = await DatabaseUtils.findGroups({ isActive: true });
      targetGroup = groups[0] || null;
    }

    if (!targetGroup) {
      return NextResponse.json(
        {
          success: false,
          error: groupId
            ? `Group with ID ${groupId} not found`
            : "No active groups found",
        },
        { status: 404 }
      );
    }

    apiLogger.info(
      `📋 Scraping group: ${targetGroup.name} (${targetGroup.url})`
    );

    // Create browser and page
    browser = await enhancedBrowserManager.launchBrowser();
    page = await enhancedBrowserManager.createPage();

    // Login to Facebook
    const loginSuccess = await facebookAuth.login(page);
    if (!loginSuccess) {
      throw new Error("Facebook login failed");
    }

    // Navigate to the group
    await groupNavigator.navigateToGroup(page, targetGroup.url);

    // Simple scraping - get posts from the page
    const jobs = await scrapeJobPosts(page, targetGroup, scrollLimit);

    // DON'T store jobs in database - just return the data as requested
    apiLogger.info(`✅ Real scraping completed: ${jobs.length} jobs found`);

    return NextResponse.json({
      success: true,
      message: "Real job scraping completed - data not stored in database",
      data: {
        sessionId,
        groupId: targetGroup.groupId,
        groupName: targetGroup.name,
        groupUrl: targetGroup.url,
        jobsFound: jobs.length,
        scrapedJobs: jobs.map((job) => ({
          postId: job.postId,
          author: job.author,
          title: job.jobDetails.title,
          company: job.jobDetails.company,
          location: job.jobDetails.location,
          type: job.jobDetails.type,
          salary: job.jobDetails.salary,
          tags: job.tags,
          content:
            job.content.substring(0, 300) +
            (job.content.length > 300 ? "..." : ""),
          postedDate: job.postedDate,
          scrapedAt: job.scrapedAt,
        })),
      },
    });
  } catch (error) {
    apiLogger.error("❌ Scraping failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Scraping failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // Clean up
    if (page) {
      await enhancedBrowserManager.closePage(page);
    }
    if (browser) {
      await enhancedBrowserManager.closeBrowser();
    }
  }
}

async function scrapeJobPosts(
  page: Page,
  group: FacebookGroup,
  scrollLimit: number
): Promise<Omit<JobPost, "_id">[]> {
  const jobs: Omit<JobPost, "_id">[] = [];

  try {
    apiLogger.info(`🔍 Starting real scraping of: ${group.url}`);

    // Wait for page to load completely
    await page.waitForSelector("body", { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Scroll and collect posts
    apiLogger.info(`📜 Scrolling to load posts (${scrollLimit} times)...`);
    for (let i = 0; i < scrollLimit; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      apiLogger.info(`📜 Scroll ${i + 1}/${scrollLimit} completed`);
    }

    // Extract real job posts from Facebook
    const scrapedPosts = await page.evaluate((groupInfo) => {
      const posts = [];

      // Try multiple selectors for Facebook posts
      const postSelectors = [
        '[data-pagelet*="FeedUnit"]',
        '[role="article"]',
        '[data-testid="story-subtitle"]',
        ".userContentWrapper",
        '[data-ft*="top_level_post_id"]',
      ];

      let postElements = [];
      for (const selector of postSelectors) {
        postElements = Array.from(document.querySelectorAll(selector));
        if (postElements.length > 0) {
          console.log(
            `Found ${postElements.length} posts using selector: ${selector}`
          );
          break;
        }
      }

      console.log(`Total posts found: ${postElements.length}`);

      postElements.forEach((post, index) => {
        try {
          // Extract content with multiple selectors
          const contentSelectors = [
            '[data-testid="post_message"]',
            ".userContent",
            ".text_exposed_root",
            '[data-ad-preview="message"]',
            ".story_body_container",
          ];

          let content = "";
          for (const selector of contentSelectors) {
            const element = post.querySelector(selector);
            if (element && element.textContent) {
              content = element.textContent.trim();
              break;
            }
          }

          // Extract author with multiple selectors
          const authorSelectors = [
            '[data-testid="story-subtitle"] a',
            ".actor a",
            '[data-testid="actor-name"]',
            ".profileLink",
          ];

          let authorName = "Unknown";
          let authorProfileUrl = "";
          for (const selector of authorSelectors) {
            const element = post.querySelector(selector);
            if (element) {
              authorName = element.textContent?.trim() || "Unknown";
              authorProfileUrl = element.href || "";
              break;
            }
          }

          // Extract timestamp
          const timeSelectors = [
            '[data-testid="story-subtitle"] time',
            ".timestamp",
            "abbr[data-utime]",
            '[data-tooltip-content*="at"]',
          ];

          let postedDate = new Date();
          for (const selector of timeSelectors) {
            const element = post.querySelector(selector);
            if (element) {
              const timeValue =
                element.getAttribute("data-utime") ||
                element.getAttribute("datetime") ||
                element.textContent;
              if (timeValue) {
                const timestamp = parseInt(timeValue) * 1000;
                if (!isNaN(timestamp)) {
                  postedDate = new Date(timestamp);
                } else {
                  postedDate = new Date(timeValue);
                }
                break;
              }
            }
          }

          // Check if this looks like a job post
          const jobKeywords = [
            "job",
            "hiring",
            "position",
            "opening",
            "work",
            "remote",
            "developer",
            "engineer",
            "freelance",
            "contract",
            "full-time",
            "part-time",
            "opportunity",
            "role",
            "career",
            "looking for",
            "seeking",
            "need",
            "require",
            "join our team",
            "we are hiring",
            "frontend",
            "backend",
            "fullstack",
            "devops",
            "ui/ux",
            "designer",
            "programmer",
          ];

          const hasJobKeywords = jobKeywords.some((keyword) =>
            content.toLowerCase().includes(keyword.toLowerCase())
          );

          // Only include posts with substantial content that look like job posts
          if (content && hasJobKeywords && content.length > 30) {
            const postId = `${groupInfo.groupId}_real_${Date.now()}_${index}`;

            // Extract job details
            const jobTitle = extractJobTitle(content);
            const jobType = extractJobType(content);
            const location = extractLocation(content);
            const company = extractCompany(content);
            const salary = extractSalary(content);
            const tags = extractTags(content);

            posts.push({
              postId,
              groupId: groupInfo.groupId,
              groupName: groupInfo.name,
              content: content,
              author: {
                name: authorName,
                profileUrl: authorProfileUrl,
              },
              postedDate: postedDate,
              scrapedAt: new Date(),
              engagementMetrics: {
                likes: 0, // Will extract if needed
                comments: 0,
                shares: 0,
              },
              jobDetails: {
                title: jobTitle,
                type: jobType,
                location: location,
                company: company,
                salary: salary,
                description:
                  content.substring(0, 500) +
                  (content.length > 500 ? "..." : ""),
              },
              tags: tags,
              isProcessed: false,
              isDuplicate: false,
            });

            console.log(
              `Extracted job ${index + 1}: ${
                jobTitle || "No title"
              } - ${content.substring(0, 100)}...`
            );
          }
        } catch (error) {
          console.error("Error extracting post:", error);
        }
      });

      // Helper functions for extraction
      function extractJobTitle(content) {
        const titlePatterns = [
          /(?:looking for|hiring|seeking|need)\s+(?:a\s+|an\s+)?([^.\n,]{10,60}?)(?:\s+(?:developer|engineer|position|role|job))/i,
          /(?:position|role|job)(?:\s+(?:for|as))?\s*:?\s*([^.\n,]{5,50})/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:needed|required|wanted|developer|engineer)/i,
          /^([^.\n,]{5,50})\s*(?:position|role|job|opening)/i,
        ];

        for (const pattern of titlePatterns) {
          const match = content.match(pattern);
          if (match) {
            return match[1].trim().replace(/[^\w\s\-\/]/g, "");
          }
        }
        return "Job Opportunity";
      }

      function extractJobType(content) {
        if (/full.?time/i.test(content)) return "full-time";
        if (/part.?time/i.test(content)) return "part-time";
        if (/contract/i.test(content)) return "contract";
        if (/freelance/i.test(content)) return "freelance";
        if (/remote/i.test(content)) return "remote";
        if (/internship/i.test(content)) return "internship";
        return "";
      }

      function extractLocation(content) {
        const locationPatterns = [
          /(?:location|based in|located in|from|in)\s*:?\s*([^.\n,]{3,40}?)(?:\s|$|,|\.|!)/i,
          /(remote|work from home)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,?\s*([A-Z]{2,3}|USA|UK|Canada)/i,
        ];

        for (const pattern of locationPatterns) {
          const match = content.match(pattern);
          if (match) {
            return match[1].trim();
          }
        }
        return "";
      }

      function extractCompany(content) {
        const companyPatterns = [
          /(?:company|at|for|with)\s+([A-Z][a-zA-Z\s&.,]{2,40}?)(?:\s|$|,|\.|!)/i,
          /([A-Z][a-zA-Z\s&.,]{2,40})\s+(?:is\s+)?(?:looking|seeking|hiring)/i,
        ];

        for (const pattern of companyPatterns) {
          const match = content.match(pattern);
          if (match) {
            const company = match[1].trim().replace(/[^\w\s&.,]/g, "");
            if (company.length > 2 && company.length < 50) {
              return company;
            }
          }
        }
        return "";
      }

      function extractSalary(content) {
        const salaryPatterns = [
          /[\$€£¥₹][\d,]+(?:[.\d]+)?(?:\s*[-–to]\s*[\$€£¥₹]?[\d,]+(?:[.\d]+)?)?(?:\s*(?:per|\/|annually|yearly|monthly|hourly|hr|yr|month|year))?/gi,
          /\d{2,6}\s*(?:k|thousand)?\s*(?:per|\/|annually|yearly|monthly|hourly|hr|yr|month|year)/gi,
        ];

        for (const pattern of salaryPatterns) {
          const match = content.match(pattern);
          if (match) {
            return match[0].trim();
          }
        }
        return "";
      }

      function extractTags(content) {
        const tags = [];
        const techKeywords = [
          "javascript",
          "typescript",
          "python",
          "java",
          "react",
          "vue",
          "angular",
          "node",
          "express",
          "django",
          "flask",
          "laravel",
          "php",
          "ruby",
          "rails",
          "go",
          "rust",
          "c++",
          "c#",
          "swift",
          "kotlin",
          "flutter",
          "react native",
          "ios",
          "android",
          "html",
          "css",
          "sass",
          "scss",
          "bootstrap",
          "tailwind",
          "mysql",
          "postgresql",
          "mongodb",
          "redis",
          "aws",
          "azure",
          "gcp",
          "docker",
          "kubernetes",
          "git",
        ];

        techKeywords.forEach((keyword) => {
          if (content.toLowerCase().includes(keyword.toLowerCase())) {
            tags.push(keyword);
          }
        });

        // Add job type tags
        if (/remote/i.test(content)) tags.push("remote");
        if (/urgent/i.test(content)) tags.push("urgent");
        if (/senior/i.test(content)) tags.push("senior");
        if (/junior/i.test(content)) tags.push("junior");
        if (/lead/i.test(content)) tags.push("lead");
        if (/freelance/i.test(content)) tags.push("freelance");
        if (/contract/i.test(content)) tags.push("contract");

        return [...new Set(tags)]; // Remove duplicates
      }

      return posts;
    }, group);

    jobs.push(...scrapedPosts);

    // Log the results in a readable format
    apiLogger.info(`\n🎯 REAL SCRAPING RESULTS:`);
    apiLogger.info(`📊 Found ${jobs.length} job posts from ${group.url}\n`);

    jobs.forEach((job, index) => {
      apiLogger.info(`\n--- JOB ${index + 1} ---`);
      apiLogger.info(`� Author: ${job.author.name}`);
      apiLogger.info(
        `💼 Title: ${job.jobDetails.title || "No specific title"}`
      );
      apiLogger.info(
        `🏢 Company: ${job.jobDetails.company || "Not specified"}`
      );
      apiLogger.info(
        `📍 Location: ${job.jobDetails.location || "Not specified"}`
      );
      apiLogger.info(`💰 Salary: ${job.jobDetails.salary || "Not specified"}`);
      apiLogger.info(`🔧 Type: ${job.jobDetails.type || "Not specified"}`);
      apiLogger.info(`🏷️ Tags: ${job.tags.join(", ") || "None"}`);
      apiLogger.info(`📝 Content Preview: ${job.content.substring(0, 200)}...`);
      apiLogger.info(
        `🔗 Author Profile: ${job.author.profileUrl || "Not available"}`
      );
    });
  } catch (error) {
    apiLogger.error("❌ Error during real scraping:", error);
  }

  return jobs;
}
