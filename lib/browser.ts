import puppeteer, { Browser, Page, LaunchOptions } from "puppeteer";
import { env } from "../config/env";
import { BROWSER_CONFIG } from "../config/constants";
import { scraperLogger } from "./logger";

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private activePagesCount = 0;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public async launchBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    try {
      scraperLogger.info("🚀 Launching browser...");

      const launchOptions: LaunchOptions = {
        headless: env.puppeteerHeadless,
        args: [...BROWSER_CONFIG.args],
        defaultViewport: BROWSER_CONFIG.viewport,
        timeout: env.browserTimeout,
      };

      // Add proxy configuration if provided
      if (env.proxyHost && env.proxyPort) {
        launchOptions.args?.push(
          `--proxy-server=${env.proxyHost}:${env.proxyPort}`
        );
        scraperLogger.info(`🔗 Using proxy: ${env.proxyHost}:${env.proxyPort}`);
      }

      this.browser = await puppeteer.launch(launchOptions);

      // Handle browser disconnect
      this.browser.on("disconnected", () => {
        scraperLogger.warn("⚠️ Browser disconnected");
        this.browser = null;
        this.activePagesCount = 0;
      });

      scraperLogger.info("✅ Browser launched successfully");
      return this.browser;
    } catch (error) {
      scraperLogger.error("❌ Failed to launch browser:", error);
      throw error;
    }
  }

  public async createPage(): Promise<Page> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();

    this.activePagesCount++;
    scraperLogger.info(
      `📄 New page created. Active pages: ${this.activePagesCount}`
    );

    // Configure page settings
    await this.configurePage(page);

    // Handle page close
    page.on("close", () => {
      this.activePagesCount--;
      scraperLogger.info(
        `📄 Page closed. Active pages: ${this.activePagesCount}`
      );
    });

    return page;
  }

  private async configurePage(page: Page): Promise<void> {
    try {
      // Set user agent
      await page.setUserAgent(BROWSER_CONFIG.userAgent);

      // Set viewport
      await page.setViewport(BROWSER_CONFIG.viewport);

      // Set extra HTTP headers
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
      });

      // Block unnecessary resources to speed up loading
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const resourceType = request.resourceType();
        const url = request.url();

        // Block ads, analytics, and other unnecessary resources
        if (
          (resourceType === "image" && !url.includes("profile")) ||
          resourceType === "stylesheet" ||
          resourceType === "font" ||
          url.includes("google-analytics") ||
          url.includes("googletagmanager") ||
          url.includes("facebook.com/tr") ||
          url.includes("doubleclick") ||
          url.includes("ads")
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Handle authentication if proxy requires it
      if (env.proxyUsername && env.proxyPassword) {
        await page.authenticate({
          username: env.proxyUsername,
          password: env.proxyPassword,
        });
      }

      // Set JavaScript enabled
      await page.setJavaScriptEnabled(true);

      // Configure timeouts
      page.setDefaultTimeout(env.browserTimeout);
      page.setDefaultNavigationTimeout(env.browserTimeout);

      scraperLogger.info("⚙️ Page configured successfully");
    } catch (error) {
      scraperLogger.error("❌ Failed to configure page:", error);
      throw error;
    }
  }

  public async closePage(page: Page): Promise<void> {
    try {
      if (!page.isClosed()) {
        await page.close();
        scraperLogger.info("📄 Page closed successfully");
      }
    } catch (error) {
      scraperLogger.error("❌ Failed to close page:", error);
    }
  }

  public async closeBrowser(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.activePagesCount = 0;
        scraperLogger.info("✅ Browser closed successfully");
      }
    } catch (error) {
      scraperLogger.error("❌ Failed to close browser:", error);
    }
  }

  public getActivePagesCount(): number {
    return this.activePagesCount;
  }

  public async getBrowserInfo(): Promise<{
    version: string;
    userAgent: string;
    pagesCount: number;
    activePagesCount: number;
    isConnected: boolean;
  } | null> {
    if (!this.browser) {
      return null;
    }

    try {
      const version = await this.browser.version();
      const userAgent = await this.browser.userAgent();
      const pages = await this.browser.pages();

      return {
        version,
        userAgent,
        pagesCount: pages.length,
        activePagesCount: this.activePagesCount,
        isConnected: this.browser.isConnected(),
      };
    } catch (error) {
      scraperLogger.error("❌ Failed to get browser info:", error);
      return null;
    }
  }

  // Utility method to wait with random delay
  public static async randomDelay(min = 1000, max = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    scraperLogger.debug(`⏳ Waiting ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Utility method to scroll page naturally
  public static async naturalScroll(
    page: Page,
    scrollDistance = 500
  ): Promise<void> {
    await page.evaluate((distance) => {
      return new Promise<void>((resolve) => {
        let totalHeight = 0;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    }, scrollDistance);
  }
}

// Export singleton instance
export const browserManager = BrowserManager.getInstance();
