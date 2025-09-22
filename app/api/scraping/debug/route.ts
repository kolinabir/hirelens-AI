import { NextRequest, NextResponse } from "next/server";
import { enhancedBrowserManager } from "@/lib/anti-detection";
import { facebookAuth } from "@/lib/facebook-auth";
import { groupNavigator } from "@/lib/group-navigator";
import { dbConnection, DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";
import type { FacebookGroup } from "@/types";
import { Page } from "puppeteer";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  let browser = null;
  let page = null;
  const sessionId = uuidv4();

  try {
    const body = await request.json();
    const { groupId, scrollLimit = 3 } = body;

    apiLogger.info(`🚀 Starting DEBUG scraping session: ${sessionId}`);

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
      `📋 DEBUG scraping group: ${targetGroup.name} (${targetGroup.url})`
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

    // Extract ALL text content from the page
    const scrapedData = await debugScrapeAllContent(
      page,
      targetGroup,
      scrollLimit
    );

    // Save to markdown file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `facebook-scrape-debug-${timestamp}.md`;
    const filepath = path.join(process.cwd(), "logs", filename);

    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Write to markdown file
    fs.writeFileSync(filepath, scrapedData.markdownContent);

    apiLogger.info(`✅ DEBUG scraping completed! Data saved to: ${filename}`);

    return NextResponse.json({
      success: true,
      message: "DEBUG scraping completed - all text content extracted",
      data: {
        sessionId,
        groupId: targetGroup.groupId,
        groupName: targetGroup.name,
        groupUrl: targetGroup.url,
        savedToFile: filename,
        filepath: filepath,
        stats: scrapedData.stats,
        preview: scrapedData.preview,
      },
    });
  } catch (error) {
    apiLogger.error("❌ DEBUG scraping failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "DEBUG scraping failed",
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

async function debugScrapeAllContent(
  page: Page,
  group: FacebookGroup,
  scrollLimit: number
) {
  try {
    apiLogger.info(`🔍 DEBUG: Starting content extraction from ${group.url}`);

    // Wait for page to load completely
    await page.waitForSelector("body", { timeout: 10000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Get initial page info
    const initialUrl = page.url();
    const pageTitle = await page.title();

    apiLogger.info(
      `📜 DEBUG: Scrolling to load more content (${scrollLimit} times)...`
    );

    // Scroll to load more content
    for (let i = 0; i < scrollLimit; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise((resolve) => setTimeout(resolve, 4000));
      apiLogger.info(`📜 DEBUG: Scroll ${i + 1}/${scrollLimit} completed`);
    }

    // Extract ALL text content from the page
    const allContent = await page.evaluate(() => {
      const result = {
        pageTitle: document.title,
        currentUrl: window.location.href,
        allText: "",
        postElements: [],
        allLinks: [],
        allImages: [],
        metadata: {},
      };

      // Get all text content
      result.allText =
        document.body.innerText || document.body.textContent || "";

      // Try to find post-like elements
      const postSelectors = [
        '[data-pagelet*="FeedUnit"]',
        '[role="article"]',
        '[data-testid="story-subtitle"]',
        ".userContentWrapper",
        '[data-ft*="top_level_post_id"]',
        '[data-testid="post_message"]',
        ".userContent",
      ];

      postSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
          if (element.textContent && element.textContent.trim().length > 20) {
            result.postElements.push({
              selector: selector,
              index: index,
              content: element.textContent.trim().substring(0, 500),
              html: element.innerHTML.substring(0, 200),
            });
          }
        });
      });

      // Get all links
      const links = document.querySelectorAll("a[href]");
      links.forEach((link) => {
        if (link.href && link.textContent) {
          result.allLinks.push({
            href: link.href,
            text: link.textContent.trim().substring(0, 100),
          });
        }
      });

      // Get some metadata
      result.metadata = {
        totalElements: document.querySelectorAll("*").length,
        totalLinks: result.allLinks.length,
        totalPostElements: result.postElements.length,
        textLength: result.allText.length,
        hasGroupName:
          result.allText.includes("devforhire") ||
          result.allText.includes("DevForHire"),
        containsJobKeywords: [
          "job",
          "hiring",
          "position",
          "work",
          "developer",
        ].some((keyword) => result.allText.toLowerCase().includes(keyword)),
      };

      return result;
    });

    // Create markdown content
    const markdownContent = `# Facebook Group Scraping Debug Report

## Session Information
- **Group URL**: ${group.url}
- **Group Name**: ${group.name}
- **Scraping Time**: ${new Date().toISOString()}
- **Final URL**: ${allContent.currentUrl}
- **Page Title**: ${allContent.pageTitle}

## Page Statistics
- **Total DOM Elements**: ${allContent.metadata.totalElements}
- **Total Text Length**: ${allContent.metadata.textLength} characters
- **Total Links Found**: ${allContent.metadata.totalLinks}
- **Post-like Elements Found**: ${allContent.metadata.totalPostElements}
- **Contains Group Name**: ${
      allContent.metadata.hasGroupName ? "✅ YES" : "❌ NO"
    }
- **Contains Job Keywords**: ${
      allContent.metadata.containsJobKeywords ? "✅ YES" : "❌ NO"
    }

## Detected Post Elements
${
  allContent.postElements.length > 0
    ? allContent.postElements
        .map(
          (post, index) => `
### Post Element ${index + 1}
- **Selector**: \`${post.selector}\`
- **Content Preview**: ${post.content}
- **HTML Preview**: \`${post.html.replace(/`/g, "'")}\`
`
        )
        .join("\n")
    : "❌ No post elements detected with current selectors"
}

## All Links Found (First 20)
${allContent.allLinks
  .slice(0, 20)
  .map(
    (link, index) => `
${index + 1}. [${link.text}](${link.href})
`
  )
  .join("")}

## Full Page Text Content (First 5000 characters)
\`\`\`
${allContent.allText.substring(0, 5000)}
${allContent.allText.length > 5000 ? "\n... (truncated)" : ""}
\`\`\`

## Raw Data Summary
- **Is this the Facebook login page?**: ${
      allContent.allText.includes("Log in to Facebook")
        ? "❌ YES - Still on login page!"
        : "✅ NO - Successfully navigated"
    }
- **Is this a Facebook group page?**: ${
      allContent.allText.includes("members") &&
      allContent.allText.includes("group")
        ? "✅ YES"
        : "❌ NO"
    }
- **Can we see posts?**: ${
      allContent.postElements.length > 0 ? "✅ YES" : "❌ NO"
    }
- **Authentication Status**: ${
      allContent.allText.includes("Log in")
        ? "❌ Not logged in"
        : "✅ Appears logged in"
    }

---
*Generated by Facebook Job Scraper Debug Tool*
`;

    const stats = {
      textLength: allContent.metadata.textLength,
      postElements: allContent.metadata.totalPostElements,
      links: allContent.metadata.totalLinks,
      hasGroupContent: allContent.metadata.hasGroupName,
      hasJobKeywords: allContent.metadata.containsJobKeywords,
      isLoggedIn: !allContent.allText.includes("Log in to Facebook"),
      isGroupPage:
        allContent.allText.includes("members") &&
        allContent.allText.includes("group"),
    };

    const preview =
      allContent.allText.substring(0, 500) +
      (allContent.allText.length > 500 ? "..." : "");

    apiLogger.info(
      `📊 DEBUG: Extracted ${allContent.metadata.textLength} characters of text`
    );
    apiLogger.info(
      `📊 DEBUG: Found ${allContent.metadata.totalPostElements} post-like elements`
    );
    apiLogger.info(
      `📊 DEBUG: Authentication check: ${
        stats.isLoggedIn ? "LOGGED IN" : "NOT LOGGED IN"
      }`
    );
    apiLogger.info(
      `📊 DEBUG: Group page check: ${
        stats.isGroupPage ? "ON GROUP PAGE" : "NOT ON GROUP PAGE"
      }`
    );

    return {
      markdownContent,
      stats,
      preview,
    };
  } catch (error) {
    apiLogger.error("❌ DEBUG: Error during content extraction:", error);
    throw error;
  }
}
