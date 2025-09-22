import { NextRequest, NextResponse } from "next/server";
import { enhancedBrowserManager } from "@/lib/anti-detection";
import { facebookAuth } from "@/lib/facebook-auth";
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
    const { scrollLimit = 3 } = body;

    apiLogger.info(`🚀 Starting SIMPLE text extraction session: ${sessionId}`);

    // Connect to database
    await dbConnection.connect();

    // Get first active group
    const groups = await DatabaseUtils.findGroups({ isActive: true });
    const targetGroup = groups[0];

    if (!targetGroup) {
      return NextResponse.json(
        { success: false, error: "No active groups found" },
        { status: 404 }
      );
    }

    apiLogger.info(`📋 Target group: ${targetGroup.url}`);

    // Create browser and page
    browser = await enhancedBrowserManager.launchBrowser();
    page = await enhancedBrowserManager.createPage();

    // Start the scraping flow
    const result = await performTextExtraction(page, targetGroup, scrollLimit);

    return NextResponse.json({
      success: true,
      message: "Text extraction completed",
      data: {
        sessionId,
        groupUrl: targetGroup.url,
        ...result,
      },
    });
  } catch (error) {
    apiLogger.error("❌ Text extraction failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Text extraction failed",
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

async function performTextExtraction(
  page: Page,
  group: FacebookGroup,
  scrollLimit: number
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `facebook-extract-${timestamp}.md`;
  const filepath = path.join(process.cwd(), "logs", filename);

  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  let markdownContent = `# Facebook Text Extraction Report\n`;
  markdownContent += `- **Timestamp**: ${new Date().toISOString()}\n`;
  markdownContent += `- **Target Group**: ${group.url}\n\n`;

  try {
    // Step 1: Try to login
    markdownContent += `## Step 1: Facebook Login Attempt\n`;
    apiLogger.info("🔐 Step 1: Attempting Facebook login...");

    const loginResult = await facebookAuth.login(page);
    const currentUrl = page.url();
    const pageTitle = await page.title();

    markdownContent += `- **Login Success**: ${
      loginResult ? "✅ YES" : "❌ NO"
    }\n`;
    markdownContent += `- **Current URL**: ${currentUrl}\n`;
    markdownContent += `- **Page Title**: ${pageTitle}\n`;

    if (currentUrl.includes("checkpoint")) {
      markdownContent += `- **Status**: ⚠️ Facebook Checkpoint/Security Challenge Detected\n\n`;
      apiLogger.warn("⚠️ Facebook checkpoint detected");
    } else if (loginResult) {
      markdownContent += `- **Status**: ✅ Login Successful\n\n`;
      apiLogger.info("✅ Login successful");
    } else {
      markdownContent += `- **Status**: ❌ Login Failed\n\n`;
      apiLogger.error("❌ Login failed");
    }

    // Step 2: Extract current page content
    markdownContent += `## Step 2: Current Page Content\n`;
    apiLogger.info("📄 Step 2: Extracting current page content...");

    const currentPageText = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.innerText || document.body.textContent || "",
        hasLoginForm: document.querySelector('#email, [name="email"]') !== null,
        hasCheckpoint:
          document.querySelector('[data-testid="checkpoint_subtitle"]') !==
            null || window.location.href.includes("checkpoint"),
        elementCount: document.querySelectorAll("*").length,
      };
    });

    markdownContent += `- **Page Title**: ${currentPageText.title}\n`;
    markdownContent += `- **Current URL**: ${currentPageText.url}\n`;
    markdownContent += `- **Has Login Form**: ${
      currentPageText.hasLoginForm ? "❌ YES" : "✅ NO"
    }\n`;
    markdownContent += `- **Has Checkpoint**: ${
      currentPageText.hasCheckpoint ? "⚠️ YES" : "✅ NO"
    }\n`;
    markdownContent += `- **Element Count**: ${currentPageText.elementCount}\n`;
    markdownContent += `- **Text Length**: ${currentPageText.bodyText.length} characters\n\n`;

    // Step 3: Try to navigate to group (if not checkpoint)
    if (!currentPageText.hasCheckpoint && loginResult) {
      markdownContent += `## Step 3: Navigate to Group\n`;
      apiLogger.info("🔗 Step 3: Navigating to group...");

      try {
        await page.goto(group.url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const groupPageData = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodyText:
              document.body.innerText || document.body.textContent || "",
            hasGroupContent:
              document.body.innerText.toLowerCase().includes("group") ||
              document.body.innerText.toLowerCase().includes("members"),
            elementCount: document.querySelectorAll("*").length,
          };
        });

        markdownContent += `- **Navigation Success**: ✅ YES\n`;
        markdownContent += `- **Group Page Title**: ${groupPageData.title}\n`;
        markdownContent += `- **Group Page URL**: ${groupPageData.url}\n`;
        markdownContent += `- **Has Group Content**: ${
          groupPageData.hasGroupContent ? "✅ YES" : "❌ NO"
        }\n`;
        markdownContent += `- **Text Length**: ${groupPageData.bodyText.length} characters\n\n`;

        // Step 4: Scroll and extract more content
        if (groupPageData.hasGroupContent) {
          markdownContent += `## Step 4: Scroll and Extract Content\n`;
          apiLogger.info("📜 Step 4: Scrolling and extracting content...");

          for (let i = 0; i < scrollLimit; i++) {
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            await new Promise((resolve) => setTimeout(resolve, 3000));
            apiLogger.info(`📜 Scroll ${i + 1}/${scrollLimit} completed`);
          }

          const finalContent = await page.evaluate(() => {
            return {
              fullText:
                document.body.innerText || document.body.textContent || "",
              postCount: document.querySelectorAll(
                '[role="article"], [data-pagelet*="FeedUnit"]'
              ).length,
              linkCount: document.querySelectorAll("a").length,
            };
          });

          markdownContent += `- **Final Text Length**: ${finalContent.fullText.length} characters\n`;
          markdownContent += `- **Post Elements Found**: ${finalContent.postCount}\n`;
          markdownContent += `- **Links Found**: ${finalContent.linkCount}\n\n`;

          // Add the actual content
          markdownContent += `## Full Page Content\n\n`;
          markdownContent += `\`\`\`\n${finalContent.fullText}\n\`\`\`\n`;
        }
      } catch (error) {
        markdownContent += `- **Navigation Error**: ❌ ${error}\n\n`;
        apiLogger.error("❌ Navigation failed:", error);
      }
    } else {
      markdownContent += `## Step 3: Skipped (Checkpoint or Login Failed)\n`;
      markdownContent += `Cannot navigate to group due to checkpoint or login failure.\n\n`;

      // Still extract whatever content we have
      markdownContent += `## Current Page Content (Login/Checkpoint Page)\n\n`;
      markdownContent += `\`\`\`\n${currentPageText.bodyText}\n\`\`\`\n`;
    }

    // Save to file
    fs.writeFileSync(filepath, markdownContent);

    apiLogger.info(`✅ Text extraction completed! Saved to: ${filename}`);

    return {
      savedToFile: filename,
      filepath: filepath,
      loginSuccess: loginResult,
      hasCheckpoint: currentPageText.hasCheckpoint,
      textLength: currentPageText.bodyText.length,
    };
  } catch (error) {
    markdownContent += `\n## ERROR\n${error}\n`;
    fs.writeFileSync(filepath, markdownContent);
    throw error;
  }
}
