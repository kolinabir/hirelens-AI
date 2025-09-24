/**
 * External Job Post Filtering Service
 * Integrates with Smyth AI job extraction API for advanced job post filtering and structuring
 */

interface ExternalJobExtractionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface StructuredJobPost {
  [key: string]: unknown;
}

export class ExternalJobFilterService {
  private static readonly API_BASE_URL =
    process.env.EXTERNAL_JOB_FILTER_API_URL || 
    "https://cmfwyhx1d1rtsjxgteybbbnme.agent.a.smyth.ai";
  private static readonly EXTRACT_ENDPOINT = 
    process.env.EXTERNAL_JOB_FILTER_ENDPOINT || 
    "/api/extract_job_posts";

  /**
   * Sends job posts to external API for filtering and structuring
   * @param jobPostsJson - String containing JSON array of scraped posts
   * @returns Structured job posts from external API
   */
  static async filterAndStructureJobs(
    jobPostsJson: string
  ): Promise<ExternalJobExtractionResponse> {
    try {
      console.log("🔄 Sending job posts to external API for filtering...");

      const response = await fetch(
        `${this.API_BASE_URL}${this.EXTRACT_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/plain",
          },
          body: JSON.stringify({
            postsText: jobPostsJson,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `External API responded with status ${response.status}: ${response.statusText}`
        );
      }

      // The API returns text/plain according to the OpenAPI spec
      const responseText = await response.text();

      // Try to parse as JSON first, if that fails return as string
      let structuredData: unknown;
      try {
        structuredData = JSON.parse(responseText);
      } catch {
        // If it's not valid JSON, return the raw text
        structuredData = responseText;
      }

      console.log(
        "✅ Successfully received structured job posts from external API"
      );

      return {
        success: true,
        data: structuredData,
      };
    } catch (error) {
      console.error("❌ External job filtering failed:", error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Validates and parses the external API response
   * @param apiResponse - Response from external API
   * @returns Array of structured job posts or empty array
   */
  static parseExternalResponse(apiResponse: unknown): StructuredJobPost[] {
    try {
      // Helper: strip code fences if present
      const stripCodeFences = (text: string) => {
        const fenceMatch = text.match(/^```(?:json)?\n([\s\S]*?)\n```$/i);
        return fenceMatch ? fenceMatch[1] : text;
      };

      // If the response is already an array
      if (Array.isArray(apiResponse)) {
        return apiResponse as StructuredJobPost[];
      }

      // If it's a string, try to parse as JSON
      if (typeof apiResponse === "string") {
        const parsed = JSON.parse(stripCodeFences(apiResponse));
        return Array.isArray(parsed) ? parsed : [parsed];
      }

      // If it's an object with a data property
      if (apiResponse && typeof apiResponse === "object") {
        const obj = apiResponse as Record<string, unknown>;
        // Smyth AI often returns { id, name, result: { Output: { jobData: [...] } } }
        const result = obj.result as Record<string, unknown> | undefined;
        const output = result?.Output as Record<string, unknown> | undefined;
        const jobData = output?.jobData as unknown;
        if (Array.isArray(jobData)) {
          return jobData as StructuredJobPost[];
        }
        if (typeof jobData === "string") {
          try {
            const parsedJobData = JSON.parse(stripCodeFences(jobData));
            return Array.isArray(parsedJobData)
              ? (parsedJobData as StructuredJobPost[])
              : [parsedJobData as StructuredJobPost];
          } catch {}
        }
        if (Array.isArray(obj.data)) {
          return obj.data as StructuredJobPost[];
        }
        if (Array.isArray(obj.jobs)) {
          return obj.jobs as StructuredJobPost[];
        }
        if (Array.isArray(obj.result)) {
          return obj.result as StructuredJobPost[];
        }
        // Return the object itself as a single item array
        return [obj as StructuredJobPost];
      }

      console.warn("⚠️ Unexpected response format from external API");
      return [];
    } catch (error) {
      console.error("❌ Error parsing external API response:", error);
      return [];
    }
  }

  /**
   * Processes a batch of job posts through the external API
   * @param posts - Array of scraped posts
   * @param batchSize - Number of posts to process at once
   * @returns Array of structured job posts
   */
  static async processBatch(
    posts: unknown[],
    batchSize: number = 10
  ): Promise<StructuredJobPost[]> {
    const allStructuredJobs: StructuredJobPost[] = [];

    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const batchJson = JSON.stringify(batch);

      console.log(
        `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          posts.length / batchSize
        )} (${batch.length} posts)`
      );

      const result = await this.filterAndStructureJobs(batchJson);

      if (result.success && result.data) {
        const structuredJobs = this.parseExternalResponse(result.data);
        allStructuredJobs.push(...structuredJobs);

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < posts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        }
      } else {
        console.error(`❌ Batch processing failed: ${result.error}`);
      }
    }

    return allStructuredJobs;
  }
}

export default ExternalJobFilterService;
