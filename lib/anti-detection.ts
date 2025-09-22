import puppeteer from "puppeteer";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page, LaunchOptions } from "puppeteer";
import { env } from "../config/env";
import { scraperLogger } from "./logger";

// Add stealth plugin to puppeteer
// puppeteer.use(StealthPlugin());

// Enhanced Anti-Detection Configuration
export const ANTI_DETECTION_CONFIG = {
  // Realistic User Agents Pool (rotate to avoid detection)
  userAgents: [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  ],

  // Viewport sizes that match real devices
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1680, height: 1050 },
  ],

  // Realistic screen properties
  screens: [
    { width: 1920, height: 1080, deviceScaleFactor: 1 },
    { width: 2560, height: 1440, deviceScaleFactor: 1 },
    { width: 3840, height: 2160, deviceScaleFactor: 1 },
    { width: 1366, height: 768, deviceScaleFactor: 1 },
  ],

  // Hardware concurrency values
  hardwareConcurrency: [4, 8, 12, 16],

  // Memory values (in GB)
  deviceMemory: [4, 8, 16, 32],

  // Timezone pools
  timezones: [
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Australia/Sydney",
  ],

  // Language configurations
  languages: [
    ["en-US", "en"] as string[],
    ["en-GB", "en"] as string[],
    ["en-CA", "en"] as string[],
    ["en-AU", "en"] as string[],
  ],
} as const;

export class EnhancedBrowserManager {
  private static instance: EnhancedBrowserManager;
  private browser: Browser | null = null;
  private activePagesCount = 0;
  private currentFingerprint: BrowserFingerprint | null = null;

  private constructor() {}

  public static getInstance(): EnhancedBrowserManager {
    if (!EnhancedBrowserManager.instance) {
      EnhancedBrowserManager.instance = new EnhancedBrowserManager();
    }
    return EnhancedBrowserManager.instance;
  }

  private generateRandomFingerprint(): BrowserFingerprint {
    const userAgent = this.getRandomElement(ANTI_DETECTION_CONFIG.userAgents);
    const viewport = this.getRandomElement(ANTI_DETECTION_CONFIG.viewports);
    const screen = this.getRandomElement(ANTI_DETECTION_CONFIG.screens);
    const hardwareConcurrency = this.getRandomElement(
      ANTI_DETECTION_CONFIG.hardwareConcurrency
    );
    const deviceMemory = this.getRandomElement(
      ANTI_DETECTION_CONFIG.deviceMemory
    );
    const timezone = this.getRandomElement(ANTI_DETECTION_CONFIG.timezones);
    const languages = this.getRandomElement(ANTI_DETECTION_CONFIG.languages);

    return {
      userAgent,
      viewport,
      screen,
      hardwareConcurrency,
      deviceMemory,
      timezone,
      languages,
      webglVendor: this.generateWebGLVendor(),
      webglRenderer: this.generateWebGLRenderer(),
      canvasFingerprint: this.generateCanvasFingerprint(),
      audioFingerprint: this.generateAudioFingerprint(),
    };
  }

  private getRandomElement<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generateWebGLVendor(): string {
    const vendors = [
      "Google Inc. (NVIDIA)",
      "Google Inc. (Intel)",
      "Google Inc. (AMD)",
      "Google Inc. (Apple)",
    ];
    return this.getRandomElement(vendors);
  }

  private generateWebGLRenderer(): string {
    const renderers = [
      "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      "ANGLE (Intel, Intel(R) Iris(TM) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)",
      "ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
      "Apple M1 Pro",
      "Apple M2",
    ];
    return this.getRandomElement(renderers);
  }

  private generateCanvasFingerprint(): string {
    // Generate a unique but consistent canvas fingerprint
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateAudioFingerprint(): number {
    // Generate realistic audio fingerprint value
    return Math.random() * 0.00001 + 0.00001;
  }

  public async launchBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    try {
      scraperLogger.info("🚀 Launching enhanced stealth browser...");

      // Generate new fingerprint for this session
      this.currentFingerprint = this.generateRandomFingerprint();

      const launchOptions: LaunchOptions = {
        headless: env.puppeteerHeadless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-features=TranslateUI,VizDisplayCompositor",
          "--disable-ipc-flooding-protection",
          "--disable-web-security",
          "--disable-features=site-per-process",
          "--disable-hang-monitor",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-extensions-http-throttling",
          "--disable-plugins-discovery",
          "--allow-running-insecure-content",
          "--disable-popup-blocking",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-background-networking",
          "--disable-software-rasterizer",
          "--disable-default-apps",
          "--disable-prompt-on-repost",
          "--disable-domain-reliability",
          "--disable-component-extensions-with-background-pages",
        ],
        defaultViewport: this.currentFingerprint.viewport,
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
        this.currentFingerprint = null;
      });

      scraperLogger.info("✅ Enhanced stealth browser launched successfully");
      scraperLogger.info(
        `🔒 Using fingerprint: ${JSON.stringify({
          userAgent: this.currentFingerprint.userAgent.substring(0, 50) + "...",
          viewport: this.currentFingerprint.viewport,
          timezone: this.currentFingerprint.timezone,
          hardwareConcurrency: this.currentFingerprint.hardwareConcurrency,
        })}`
      );

      return this.browser;
    } catch (error) {
      scraperLogger.error("❌ Failed to launch enhanced browser:", error);
      throw error;
    }
  }

  public async createPage(): Promise<Page> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();

    this.activePagesCount++;
    scraperLogger.info(
      `📄 New stealth page created. Active pages: ${this.activePagesCount}`
    );

    // Configure page with anti-detection measures
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
    if (!this.currentFingerprint) {
      throw new Error("No fingerprint available for page configuration");
    }

    try {
      const fingerprint = this.currentFingerprint;

      // Set user agent
      await page.setUserAgent(fingerprint.userAgent);

      // Set viewport
      await page.setViewport(fingerprint.viewport);

      // Set timezone
      await page.emulateTimezone(fingerprint.timezone);

      // Set language preferences
      await page.setExtraHTTPHeaders({
        "Accept-Language": fingerprint.languages.join(","),
        "Accept-Encoding": "gzip, deflate, br",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document",
      });

      // Enhanced request interception with randomization
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const resourceType = request.resourceType();
        const url = request.url();

        // Block unnecessary resources with some randomness
        const shouldBlock = this.shouldBlockResource(resourceType, url);

        if (shouldBlock) {
          request.abort();
        } else {
          // Add random delays to requests
          const delay = Math.random() * 100;
          setTimeout(() => {
            request.continue();
          }, delay);
        }
      });

      // Override navigator properties
      await page.evaluateOnNewDocument((fp) => {
        // Hardware concurrency
        Object.defineProperty(navigator, "hardwareConcurrency", {
          get: () => fp.hardwareConcurrency,
        });

        // Device memory
        Object.defineProperty(navigator, "deviceMemory", {
          get: () => fp.deviceMemory,
        });

        // WebGL spoofing
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
          if (parameter === 37445) {
            // UNMASKED_VENDOR_WEBGL
            return fp.webglVendor;
          }
          if (parameter === 37446) {
            // UNMASKED_RENDERER_WEBGL
            return fp.webglRenderer;
          }
          return getParameter.call(this, parameter);
        };

        // Canvas fingerprint spoofing
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function (...args) {
          const result = originalToDataURL.apply(this, args);
          // Add slight noise to canvas fingerprint
          return result + fp.canvasFingerprint;
        };

        // Audio context fingerprint spoofing
        const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
        AudioContext.prototype.createAnalyser = function () {
          const analyser = originalCreateAnalyser.call(this);
          const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
          analyser.getFloatFrequencyData = function (array) {
            originalGetFloatFrequencyData.call(this, array);
            // Add slight noise to audio fingerprint
            for (let i = 0; i < array.length; i++) {
              array[i] += (Math.random() - 0.5) * fp.audioFingerprint;
            }
          };
          return analyser;
        };

        // Screen properties spoofing
        Object.defineProperty(screen, "width", {
          get: () => fp.screen.width,
        });
        Object.defineProperty(screen, "height", {
          get: () => fp.screen.height,
        });
        Object.defineProperty(screen, "availWidth", {
          get: () => fp.screen.width,
        });
        Object.defineProperty(screen, "availHeight", {
          get: () => fp.screen.height - 40, // Account for taskbar
        });

        // Remove webdriver property (using try/catch for safety)
        try {
          Object.defineProperty(navigator, "webdriver", {
            get: () => undefined,
            configurable: true,
          });
        } catch {
          // Ignore if property is not configurable
        }

        // Override plugin detection
        Object.defineProperty(navigator, "plugins", {
          get: () => [
            {
              name: "Chrome PDF Plugin",
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
            },
            {
              name: "Chrome PDF Viewer",
              description: "",
              filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            },
            {
              name: "Native Client",
              description: "",
              filename: "internal-nacl-plugin",
            },
          ],
        });

        // Override permissions with proper typing
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = function (parameters) {
          return originalQuery.call(this, parameters).then((result) => {
            if (parameters.name === "notifications") {
              // Create a new object with modified state
              return { ...result, state: "default" as PermissionState };
            }
            return result;
          });
        };

        // Battery API spoofing (simplified to avoid TypeScript issues)
        // Note: Battery API is deprecated in most browsers anyway
      }, fingerprint);

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

      scraperLogger.info("⚙️ Enhanced stealth page configured successfully");
    } catch (error) {
      scraperLogger.error("❌ Failed to configure stealth page:", error);
      throw error;
    }
  }

  private shouldBlockResource(resourceType: string, url: string): boolean {
    // Block with some randomness to appear more human
    const blockProbability = {
      image: 0.7, // Block 70% of images
      stylesheet: 0.8, // Block 80% of CSS
      font: 0.9, // Block 90% of fonts
      media: 0.6, // Block 60% of media
    };

    // Always block tracking and ads
    const alwaysBlock = [
      "google-analytics",
      "googletagmanager",
      "facebook.com/tr",
      "doubleclick",
      "googlesyndication",
      "adsystem",
      "amazon-adsystem",
      "googletag",
    ];

    // Check if URL should always be blocked
    if (alwaysBlock.some((blocked) => url.includes(blocked))) {
      return true;
    }

    // Probabilistic blocking for other resources
    const probability =
      blockProbability[resourceType as keyof typeof blockProbability];
    if (probability) {
      return Math.random() < probability;
    }

    return false;
  }

  // Simulate human-like mouse movements
  public static async humanMouseMove(
    page: Page,
    x: number,
    y: number
  ): Promise<void> {
    const steps = Math.floor(Math.random() * 10) + 5; // 5-15 steps

    // Get current mouse position (start from 0,0 if unknown)
    const startX = 0;
    const startY = 0;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentX = startX + (x - startX) * progress;
      const currentY = startY + (y - startY) * progress;

      await page.mouse.move(currentX, currentY);
      await this.randomDelay(5, 15); // Small delay between movements
    }
  }

  // Enhanced random delays with more realistic patterns
  public static async randomDelay(min = 1000, max = 3000): Promise<void> {
    // Use exponential distribution for more realistic timing
    const lambda = 1 / ((min + max) / 2);
    const randomValue = -Math.log(Math.random()) / lambda;
    const delay = Math.min(Math.max(randomValue, min), max);

    scraperLogger.debug(`⏳ Human-like delay: ${Math.round(delay)}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Human-like typing simulation
  public static async humanType(
    page: Page,
    selector: string,
    text: string
  ): Promise<void> {
    await page.click(selector);
    await this.randomDelay(100, 300);

    for (const char of text) {
      await page.keyboard.type(char);
      await this.randomDelay(50, 150); // Realistic typing speed
    }
  }

  // Enhanced natural scrolling with acceleration/deceleration
  public static async naturalScroll(
    page: Page,
    scrollDistance = 500
  ): Promise<void> {
    const steps = Math.floor(Math.random() * 20) + 10; // 10-30 steps
    const stepSize = scrollDistance / steps;

    for (let i = 0; i < steps; i++) {
      // Simulate acceleration/deceleration
      const progress = i / steps;
      const easing =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentStepSize = stepSize * (0.5 + easing);

      await page.evaluate((distance) => {
        window.scrollBy(0, distance);
      }, currentStepSize);

      await this.randomDelay(50, 150);
    }

    // Random pause after scrolling
    await this.randomDelay(500, 1500);
  }

  // Simulate random human interactions
  public static async randomHumanBehavior(page: Page): Promise<void> {
    const behaviors = [
      // Random mouse movements
      async () => {
        const x = Math.random() * 1920;
        const y = Math.random() * 1080;
        await this.humanMouseMove(page, x, y);
      },
      // Random small scrolls
      async () => {
        const scrollAmount = (Math.random() - 0.5) * 200;
        await page.evaluate(
          (amount) => window.scrollBy(0, amount),
          scrollAmount
        );
      },
      // Random pauses (like reading)
      async () => {
        await this.randomDelay(2000, 5000);
      },
      // Random clicks on safe elements
      async () => {
        try {
          const elements = await page.$$("div, span, p");
          if (elements.length > 0) {
            const randomElement =
              elements[Math.floor(Math.random() * elements.length)];
            const box = await randomElement.boundingBox();
            if (box) {
              await this.humanMouseMove(
                page,
                box.x + box.width / 2,
                box.y + box.height / 2
              );
            }
          }
        } catch {
          // Ignore errors for random interactions
        }
      },
    ];

    // Randomly execute one of the behaviors
    const randomBehavior =
      behaviors[Math.floor(Math.random() * behaviors.length)];
    await randomBehavior();
  }

  public async closePage(page: Page): Promise<void> {
    try {
      if (!page.isClosed()) {
        await page.close();
        scraperLogger.info("📄 Stealth page closed successfully");
      }
    } catch (error) {
      scraperLogger.error("❌ Failed to close stealth page:", error);
    }
  }

  public async closeBrowser(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.activePagesCount = 0;
        this.currentFingerprint = null;
        scraperLogger.info("✅ Enhanced stealth browser closed successfully");
      }
    } catch (error) {
      scraperLogger.error("❌ Failed to close stealth browser:", error);
    }
  }

  public getActivePagesCount(): number {
    return this.activePagesCount;
  }

  public getCurrentFingerprint(): BrowserFingerprint | null {
    return this.currentFingerprint;
  }
}

// Type definitions
interface BrowserFingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  screen: { width: number; height: number; deviceScaleFactor: number };
  hardwareConcurrency: number;
  deviceMemory: number;
  timezone: string;
  languages: string[];
  webglVendor: string;
  webglRenderer: string;
  canvasFingerprint: string;
  audioFingerprint: number;
}

// Export singleton instance
export const enhancedBrowserManager = EnhancedBrowserManager.getInstance();
