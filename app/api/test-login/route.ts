import { NextResponse } from "next/server";
import { enhancedBrowserManager } from "@/lib/anti-detection";
import { facebookAuth } from "@/lib/facebook-auth";
import { apiLogger } from "@/lib/logger";

export async function POST() {
  let browser = null;
  let page = null;

  try {
    apiLogger.info("🧪 Starting Facebook login test...");

    // Create browser instance
    browser = await enhancedBrowserManager.launchBrowser();
    page = await enhancedBrowserManager.createPage();

    // Set up page with basic anti-detection
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1920, height: 1080 });

    // Attempt login
    const loginSuccess = await facebookAuth.login(page);

    if (loginSuccess) {
      apiLogger.info("✅ Facebook login test successful!");
      
      // Take a screenshot to verify we're logged in
      const currentUrl = page.url();
      
      return NextResponse.json({
        success: true,
        message: "Facebook login successful",
        data: {
          loggedIn: true,
          currentUrl: currentUrl,
        },
      });
    } else {
      apiLogger.error("❌ Facebook login test failed");
      
      return NextResponse.json({
        success: false,
        message: "Facebook login failed",
        data: {
          loggedIn: false,
          currentUrl: page.url(),
        },
      });
    }
  } catch (error) {
    apiLogger.error("❌ Error during Facebook login test:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Login test failed",
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