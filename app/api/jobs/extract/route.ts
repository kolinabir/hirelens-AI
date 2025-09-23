import { NextRequest, NextResponse } from "next/server";
import { JobPostExtractor } from "@/lib/job-extractor";

/**
 * POST /api/jobs/extract
 * Extracts structured job information from Facebook posts
 *
 * Body: { "posts": "string containing JSON array of posts" }
 * Returns: Array of extracted job posts
 */
export async function POST(request: NextRequest) {
  try {
    const { posts } = await request.json();

    if (!posts || typeof posts !== "string") {
      return NextResponse.json(
        {
          error:
            'Invalid input. Expected "posts" field with string containing JSON array.',
        },
        { status: 400 }
      );
    }

    const extractedJobs = JobPostExtractor.extractJobPosts(posts);

    return NextResponse.json({
      success: true,
      count: extractedJobs.length,
      jobs: extractedJobs,
    });
  } catch (error) {
    console.error("Error extracting job posts:", error);
    return NextResponse.json(
      { error: "Failed to extract job posts" },
      { status: 500 }
    );
  }
}
