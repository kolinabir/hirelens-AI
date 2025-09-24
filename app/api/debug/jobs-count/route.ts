import { NextResponse } from "next/server";
import dbConnection from "@/lib/database";

export async function GET() {
  try {
    await dbConnection.connect();
    const jobsCol = dbConnection.getJobsCollection();

    const totalJobs = await jobsCol.countDocuments({});
    const recentJobs = await jobsCol
      .find({})
      .sort({ scrapedAt: -1 })
      .limit(5)
      .toArray();

    const sampleJobs = recentJobs.map((j) => ({
      _id: j._id?.toString(),
      title: j.jobDetails?.title || j.jobTitle || "No title",
      company: j.jobDetails?.company || j.company || "No company",
      location: j.jobDetails?.location || j.location || "No location",
      postUrl: j.postUrl || "No URL",
      facebookUrl: j.facebookUrl,
      scrapedAt: j.scrapedAt,
      // Debug fields
      rawJobTitle: j.jobTitle,
      rawJobDetailsTitle: j.jobDetails?.title,
      rawCompany: j.company,
      rawJobDetailsCompany: j.jobDetails?.company,
      rawContent: j.content?.substring(0, 200),
      rawOriginalPost: j.originalPost?.substring(0, 200),
      isProcessed: j.isProcessed,
      source: j.source,
      hasApifyData: !!j.apifyData,
      hasJobDetails: !!j.jobDetails,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        sampleJobs,
      },
    });
  } catch (error) {
    console.error("Debug jobs count error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get jobs count" },
      { status: 500 }
    );
  }
}
