import type { WebsiteJobData } from "../types";

export interface SmythAIResponse {
  id: string;
  name: string;
  result: {
    Output: {
      job_data: Array<{
        "Job Title": string;
        "Position/Role": string;
        "Company Name": string;
        Location: string;
        "Job Type": string | null;
        "Experience Level": string | null;
        Department: string | null;
        "Salary/Compensation": string | null;
        "Job Description/Summary": string | null;
        Requirements: string | null;
        "Application Deadline": string | null;
        "Posted Date": string | null;
      }>;
    };
  };
}

export class SmythAIScraper {
  private static readonly API_URL =
    "https://cmfy80tej5wtlo3wtz0o1ki8i.agent.pa.smyth.ai/api/extract_jobs";

  static async scrapeWebsite(websiteUrl: string): Promise<{
    success: boolean;
    jobs: WebsiteJobData[];
    rawResponse?: SmythAIResponse;
    error?: string;
  }> {
    try {
      console.log(`🔍 Scraping website: ${websiteUrl}`);

      const requestBody = {
        website_url: websiteUrl,
      };

      console.log("📤 Smyth AI Request:", JSON.stringify(requestBody, null, 2));

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      };

      console.log("📤 Request headers:", headers);

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawResponse: SmythAIResponse = await response.json();
      console.log(
        "📥 Smyth AI Response:",
        JSON.stringify(rawResponse, null, 2)
      );

      // Transform the response to our format
      const jobs: WebsiteJobData[] = rawResponse.result.Output.job_data.map(
        (job) => ({
          jobTitle: job["Job Title"] || "",
          positionRole: job["Position/Role"] || job["Job Title"] || "",
          companyName: job["Company Name"] || "",
          location: job["Location"] || "",
          jobType: job["Job Type"] || undefined,
          experienceLevel: job["Experience Level"] || undefined,
          department: job["Department"] || undefined,
          salaryCompensation: job["Salary/Compensation"] || undefined,
          jobDescriptionSummary: job["Job Description/Summary"] || undefined,
          requirements: job["Requirements"] || undefined,
          applicationDeadline: job["Application Deadline"] || undefined,
          postedDate: job["Posted Date"] || undefined,
        })
      );

      console.log(
        `✅ Successfully scraped ${jobs.length} jobs from ${websiteUrl}`
      );

      return {
        success: true,
        jobs,
        rawResponse,
      };
    } catch (error) {
      console.error(`❌ Error scraping website ${websiteUrl}:`, error);
      return {
        success: false,
        jobs: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Helper method to compare jobs and find new ones
  static findNewJobs(
    currentJobs: WebsiteJobData[],
    previousJobs: WebsiteJobData[]
  ): WebsiteJobData[] {
    if (previousJobs.length === 0) {
      return currentJobs; // All jobs are new if no previous data
    }

    // Create a set of previous job identifiers for fast lookup
    const previousJobIds = new Set(
      previousJobs.map(
        (job) =>
          `${job.jobTitle}-${job.companyName}-${
            job.applicationDeadline || "no-deadline"
          }`
      )
    );

    // Find jobs that don't exist in previous snapshot
    return currentJobs.filter((job) => {
      const jobId = `${job.jobTitle}-${job.companyName}-${
        job.applicationDeadline || "no-deadline"
      }`;
      return !previousJobIds.has(jobId);
    });
  }
}
