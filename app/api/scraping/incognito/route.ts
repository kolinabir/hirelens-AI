import { NextRequest, NextResponse } from "next/server";
import { enhancedBrowserManager } from "@/lib/anti-detection";
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
    const { scrollLimit = 3, groupUrl } = body;

    apiLogger.info(
      `🚀 Starting INCOGNITO text extraction session: ${sessionId}`
    );

    // Connect to database to get group URL if not provided
    await dbConnection.connect();

    let targetUrl = groupUrl;
    if (!targetUrl) {
      const groups = await DatabaseUtils.findGroups({ isActive: true });
      const targetGroup = groups[0];
      if (!targetGroup) {
        return NextResponse.json(
          {
            success: false,
            error: "No active groups found and no URL provided",
          },
          { status: 404 }
        );
      }
      targetUrl = targetGroup.url;
    }

    apiLogger.info(`📋 Target URL: ${targetUrl}`);

    // Create browser in incognito mode
    browser = await enhancedBrowserManager.launchBrowser();
    page = await enhancedBrowserManager.createPage();

    // Start the incognito scraping
    const result = await performIncognitoExtraction(
      page,
      targetUrl,
      scrollLimit
    );

    return NextResponse.json({
      success: true,
      message: "Incognito text extraction completed",
      data: {
        sessionId,
        targetUrl,
        ...result,
      },
    });
  } catch (error) {
    apiLogger.error("❌ Incognito extraction failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Incognito extraction failed",
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

async function performIncognitoExtraction(
  page: Page,
  groupUrl: string,
  scrollLimit: number
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `facebook-incognito-${timestamp}.md`;
  const filepath = path.join(process.cwd(), "logs", filename);

  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  let markdownContent = `# Facebook Incognito Text Extraction Report\n`;
  markdownContent += `- **Timestamp**: ${new Date().toISOString()}\n`;
  markdownContent += `- **Target URL**: ${groupUrl}\n`;
  markdownContent += `- **Mode**: Incognito (No Login)\n\n`;

  try {
    // Step 1: Direct navigation to group
    markdownContent += `## Step 1: Direct Navigation to Group\n`;
    apiLogger.info("🔗 Step 1: Navigating directly to group (incognito)...");

    await page.goto(groupUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for page to load
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const initialPageData = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.innerText || document.body.textContent || "",
        hasLoginPrompt:
          document.body.innerText.toLowerCase().includes("log in") ||
          document.body.innerText.toLowerCase().includes("sign up"),
        hasGroupContent:
          document.body.innerText.toLowerCase().includes("group") ||
          document.body.innerText.toLowerCase().includes("members") ||
          document.body.innerText.toLowerCase().includes("posts"),
        elementCount: document.querySelectorAll("*").length,
        hasJoinButton:
          document.body.innerText.toLowerCase().includes("join") ||
          document.body.innerText.toLowerCase().includes("request"),
        bodyHTML: document.body.innerHTML.substring(0, 1000), // First 1000 chars of HTML
      };
    });

    markdownContent += `- **Page Title**: ${initialPageData.title}\n`;
    markdownContent += `- **Final URL**: ${initialPageData.url}\n`;
    markdownContent += `- **Has Login Prompt**: ${
      initialPageData.hasLoginPrompt ? "⚠️ YES" : "✅ NO"
    }\n`;
    markdownContent += `- **Has Group Content**: ${
      initialPageData.hasGroupContent ? "✅ YES" : "❌ NO"
    }\n`;
    markdownContent += `- **Has Join Button**: ${
      initialPageData.hasJoinButton ? "✅ YES" : "❌ NO"
    }\n`;
    markdownContent += `- **Element Count**: ${initialPageData.elementCount}\n`;
    markdownContent += `- **Text Length**: ${initialPageData.bodyText.length} characters\n\n`;

    // Step 2: Try to scroll and get more content
    markdownContent += `## Step 2: Scrolling for More Content\n`;
    apiLogger.info("📜 Step 2: Scrolling to load more content...");

    let allExtractedText = initialPageData.bodyText;

    for (let i = 0; i < scrollLimit; i++) {
      try {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const scrollData = await page.evaluate(() => {
          return {
            bodyText:
              document.body.innerText || document.body.textContent || "",
            elementCount: document.querySelectorAll("*").length,
          };
        });

        allExtractedText = scrollData.bodyText;
        markdownContent += `- **Scroll ${i + 1}**: Text length now ${
          scrollData.bodyText.length
        } chars, ${scrollData.elementCount} elements\n`;
        apiLogger.info(
          `📜 Scroll ${i + 1}/${scrollLimit}: ${
            scrollData.bodyText.length
          } chars`
        );
      } catch (error) {
        markdownContent += `- **Scroll ${i + 1}**: ❌ Error - ${error}\n`;
      }
    }

    // Step 3: Extract specific elements
    markdownContent += `\n## Step 3: Element Analysis\n`;
    apiLogger.info("🔍 Step 3: Analyzing page elements...");

    const elementAnalysis = await page.evaluate(() => {
      const result = {
        links: [],
        headings: [],
        buttons: [],
        forms: [],
        images: [],
        posts: [],
        specialElements: [],
      };

      // Get all links
      document.querySelectorAll("a[href]").forEach((link, index) => {
        if (index < 20 && link.textContent && link.textContent.trim()) {
          result.links.push({
            text: link.textContent.trim().substring(0, 100),
            href: (link as HTMLAnchorElement).href,
          });
        }
      });

      // Get headings
      document
        .querySelectorAll("h1, h2, h3, h4, h5, h6")
        .forEach((heading, index) => {
          if (index < 10 && heading.textContent) {
            result.headings.push(heading.textContent.trim());
          }
        });

      // Get buttons
      document
        .querySelectorAll('button, [role="button"]')
        .forEach((button, index) => {
          if (index < 10 && button.textContent) {
            result.buttons.push(button.textContent.trim());
          }
        });

      // Look for post-like elements
      const postSelectors = [
        '[role="article"]',
        '[data-pagelet*="FeedUnit"]',
        '[data-testid="story-subtitle"]',
        ".userContent",
        '[data-ft*="top_level_post_id"]',
      ];

      postSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element, index) => {
          if (
            index < 5 &&
            element.textContent &&
            element.textContent.trim().length > 50
          ) {
            result.posts.push({
              selector: selector,
              content: element.textContent.trim().substring(0, 300),
            });
          }
        });
      });

      return result;
    });

    markdownContent += `- **Links Found**: ${elementAnalysis.links.length}\n`;
    markdownContent += `- **Headings Found**: ${elementAnalysis.headings.length}\n`;
    markdownContent += `- **Buttons Found**: ${elementAnalysis.buttons.length}\n`;
    markdownContent += `- **Post Elements Found**: ${elementAnalysis.posts.length}\n\n`;

    // Add the detailed analysis
    if (elementAnalysis.headings.length > 0) {
      markdownContent += `### Headings Found\n`;
      elementAnalysis.headings.forEach((heading, index) => {
        markdownContent += `${index + 1}. ${heading}\n`;
      });
      markdownContent += `\n`;
    }

    if (elementAnalysis.buttons.length > 0) {
      markdownContent += `### Buttons Found\n`;
      elementAnalysis.buttons.forEach((button, index) => {
        markdownContent += `${index + 1}. "${button}"\n`;
      });
      markdownContent += `\n`;
    }

    if (elementAnalysis.posts.length > 0) {
      markdownContent += `### Post-like Elements Found\n`;
      elementAnalysis.posts.forEach((post, index) => {
        markdownContent += `#### Post ${index + 1} (${post.selector})\n`;
        markdownContent += `${post.content}\n\n`;
      });
    }

    if (elementAnalysis.links.length > 0) {
      markdownContent += `### Links Found (First 10)\n`;
      elementAnalysis.links.slice(0, 10).forEach((link, index) => {
        markdownContent += `${index + 1}. [${link.text}](${link.href})\n`;
      });
      markdownContent += `\n`;
    }

    // Step 4: Full page content
    markdownContent += `## Step 4: Full Page Text Content\n\n`;
    markdownContent += `**Total Characters**: ${allExtractedText.length}\n\n`;
    markdownContent += `\`\`\`\n${allExtractedText}\n\`\`\`\n`;

    // Save to file
    fs.writeFileSync(filepath, markdownContent);

    apiLogger.info(`✅ Incognito extraction completed! Saved to: ${filename}`);

    return {
      savedToFile: filename,
      filepath: filepath,
      hasGroupContent: initialPageData.hasGroupContent,
      hasLoginPrompt: initialPageData.hasLoginPrompt,
      textLength: allExtractedText.length,
      elementsFound: {
        links: elementAnalysis.links.length,
        headings: elementAnalysis.headings.length,
        buttons: elementAnalysis.buttons.length,
        posts: elementAnalysis.posts.length,
      },
    };
  } catch (error) {
    markdownContent += `\n## ERROR\n${error}\n`;
    fs.writeFileSync(filepath, markdownContent);
    throw error;
  }
}
