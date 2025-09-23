import { apiLogger } from "./logger";

// Apify data structures based on the example you provided
export interface ApifyUser {
  id: string;
  name: string;
}

export interface ApifyAttachment {
  thumbnail?: string;
  __typename: string;
  photo_image?: {
    uri: string;
    height: number;
    width: number;
  };
  __isMedia?: string;
  accent_color?: string;
  photo_product_tags?: unknown[];
  url?: string;
  id?: string;
  ocrText?: string;
  mediaset_token?: string;
  comet_product_tag_feed_overlay_renderer?: unknown;
  is_playable?: boolean;
  image?: {
    uri: string;
    height: number;
    width: number;
  };
  photo_cix_screen?: unknown;
  copyright_banner_info?: unknown;
  owner?: {
    __typename: string;
    id: string;
  };
}

export interface ApifyPost {
  facebookUrl: string;
  text: string;
  user: ApifyUser;
  likesCount: number;
  commentsCount: number;
  attachments?: ApifyAttachment[];
}

export interface ApifyScrapingConfig {
  groupUrls: string[];
  maxPosts?: number;
  maxComments?: number;
  scrapeComments?: boolean;
  scrapePhotos?: boolean;
  maxPhotos?: number;
}

export class ApifyService {
  private readonly baseUrl = "https://api.apify.com/v2";
  private readonly actorId = "apify~facebook-groups-scraper";
  private readonly token: string;

  constructor() {
    this.token = process.env.APIFY_API_TOKEN || "";
    if (!this.token) {
      throw new Error("APIFY_API_TOKEN is required");
    }
  }

  /**
   * Run the Facebook Groups Scraper actor synchronously and get dataset items
   */
  async scrapeFacebookGroups(
    config: ApifyScrapingConfig
  ): Promise<ApifyPost[]> {
    try {
      const inputData = {
        startUrls: config.groupUrls.map((url) => ({ url })), // Convert to objects
        maxPosts: config.maxPosts || 50,
        maxComments: config.maxComments || 0,
        scrapeComments: config.scrapeComments || false,
        scrapePhotos: config.scrapePhotos || true,
        maxPhotos: config.maxPhotos || 5,
      };

      apiLogger.info("Starting Apify Facebook Groups scraping", {
        config: inputData,
      });

      const response = await fetch(
        `${this.baseUrl}/acts/${this.actorId}/run-sync-get-dataset-items?token=${this.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(inputData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      apiLogger.info("Apify scraping completed", {
        postsFound: Array.isArray(data) ? data.length : 0,
        groups: config.groupUrls.length,
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      apiLogger.error("Error scraping Facebook groups with Apify", { error });
      throw error;
    }
  }

  /**
   * Start an actor run asynchronously (for background processing)
   */
  async startScraping(config: ApifyScrapingConfig): Promise<{ runId: string }> {
    try {
      const inputData = {
        startUrls: config.groupUrls.map((url) => ({ url })), // Convert to objects
        maxPosts: config.maxPosts || 50,
        maxComments: config.maxComments || 0,
        scrapeComments: config.scrapeComments || false,
        scrapePhotos: config.scrapePhotos || true,
        maxPhotos: config.maxPhotos || 5,
      };

      apiLogger.info("Starting async Apify Facebook Groups scraping", {
        config: inputData,
      });

      const response = await fetch(
        `${this.baseUrl}/acts/${this.actorId}/runs?token=${this.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(inputData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
      }

      const runData = await response.json();
      apiLogger.info("Apify async scraping started", {
        runId: runData.data.id,
      });

      return { runId: runData.data.id };
    } catch (error) {
      apiLogger.error("Error starting Apify scraping", { error });
      throw error;
    }
  }

  /**
   * Get the results from a completed run
   */
  async getRunResults(runId: string): Promise<ApifyPost[]> {
    try {
      apiLogger.info("Fetching Apify run results", { runId });

      const response = await fetch(
        `${this.baseUrl}/acts/${this.actorId}/runs/${runId}/dataset/items?token=${this.token}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      apiLogger.info("Apify run results fetched", {
        postsFound: Array.isArray(data) ? data.length : 0,
        runId,
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      apiLogger.error("Error fetching Apify run results", { error, runId });
      throw error;
    }
  }

  /**
   * Check the status of a running actor
   */
  async getRunStatus(
    runId: string
  ): Promise<{ status: string; statusMessage?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/acts/${this.actorId}/runs/${runId}?token=${this.token}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
      }

      const runData = await response.json();
      return {
        status: runData.data.status,
        statusMessage: runData.data.statusMessage,
      };
    } catch (error) {
      apiLogger.error("Error fetching Apify run status", { error, runId });
      throw error;
    }
  }

  /**
   * Get the last successful run results for quick access
   */
  async getLastRunResults(): Promise<ApifyPost[]> {
    try {
      apiLogger.info("Fetching last successful Apify run results");

      const response = await fetch(
        `${this.baseUrl}/acts/${this.actorId}/runs/last/dataset/items?token=${this.token}&status=SUCCEEDED`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      apiLogger.info("Last Apify run results fetched", {
        postsFound: Array.isArray(data) ? data.length : 0,
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      apiLogger.error("Error fetching last Apify run results", { error });
      throw error;
    }
  }

  /**
   * Abort a running actor
   */
  async abortRun(runId: string): Promise<{ success: boolean }> {
    try {
      apiLogger.info("Aborting Apify run", { runId });

      const response = await fetch(
        `${this.baseUrl}/acts/${this.actorId}/runs/${runId}/abort?token=${this.token}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
      }

      apiLogger.info("Apify run aborted successfully", { runId });
      return { success: true };
    } catch (error) {
      apiLogger.error("Error aborting Apify run", { error, runId });
      throw error;
    }
  }

  /**
   * Get results from a specific dataset ID
   */
  async getDatasetItems(datasetId: string): Promise<ApifyPost[]> {
    try {
      apiLogger.info("Fetching Apify dataset items", { datasetId });

      const response = await fetch(
        `${this.baseUrl}/datasets/${datasetId}/items?token=${this.token}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      apiLogger.info("Apify dataset items fetched", {
        postsFound: Array.isArray(data) ? data.length : 0,
        datasetId,
      });

      return Array.isArray(data) ? data : [];
    } catch (error) {
      apiLogger.error("Error fetching Apify dataset items", {
        error,
        datasetId,
      });
      throw error;
    }
  }
}

export const apifyService = new ApifyService();
