import { NextRequest, NextResponse } from "next/server";
import dbConnection from "@/lib/database";
import { sendJobDigestEmail } from "@/lib/mailer";
import { ObjectId } from "mongodb";

// Send up to 5 unseen jobs per subscriber, one by one, and track sent job _ids
export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();
    const subsCol = dbConnection.getSubscribersCollection();
    const jobsCol = dbConnection.getJobsCollection();

    const subscribers = await subsCol.find({}).toArray();
    let totalSent = 0;

    for (const sub of subscribers) {
      const sentJobIds = Array.isArray(sub.sentJobIds) ? sub.sentJobIds : [];

      // find next 5 jobs that have not been sent to this subscriber
      const jobs = await jobsCol
        .find({
          _id: { $nin: sentJobIds.map((id: string) => new ObjectId(id)) },
        } as Record<string, unknown>)
        .sort({ scrapedAt: -1 })
        .limit(5)
        .toArray();

      if (jobs.length === 0) {
        continue;
      }

      console.log(
        `🔍 Found ${jobs.length} jobs for ${sub.email}, sample job:`,
        JSON.stringify(jobs[0], null, 2)
      );

      const digestItems = jobs.map((j, index) => {
        console.log(`🔍 Processing job ${index + 1} for ${sub.email}:`, {
          jobTitle: j.jobTitle,
          jobDetailsTitle: j.jobDetails?.title,
          originalPost: j.originalPost?.substring(0, 100),
          content: j.content?.substring(0, 100),
          company: j.company,
          jobDetailsCompany: j.jobDetails?.company,
          location: j.location,
          jobDetailsLocation: j.jobDetails?.location,
        });

        // Extract title from content if not processed
        let extractedTitle = j.jobTitle || j.jobDetails?.title;
        if (!extractedTitle && j.content) {
          // Try to extract job title from content
          const lines = j.content.split("\n").filter((line) => line.trim());
          for (const line of lines) {
            // Look for patterns that indicate a job title
            if (
              line.includes("Job Title:") ||
              line.includes("Position:") ||
              line.includes("**Job Title:")
            ) {
              extractedTitle = line
                .replace(/.*?(?:Job Title:|Position:|\*\*Job Title:)\s*/i, "")
                .replace(/\*\*/g, "")
                .trim();
              break;
            }
            // If first line looks like a job title (contains common job keywords)
            if (
              line.match(
                /\b(developer|engineer|manager|executive|intern|analyst|specialist|coordinator|assistant|lead|senior|junior)\b/i
              )
            ) {
              extractedTitle = line
                .replace(/[🚀📍🖥️📌✉️]/g, "")
                .replace(/^\*\*|\*\*$/g, "")
                .trim();
              break;
            }
          }
          // Fallback to first meaningful line
          if (!extractedTitle && lines.length > 0) {
            extractedTitle = lines[0]
              .replace(/[🚀📍🖥️📌✉️]/g, "")
              .replace(/^\*\*|\*\*$/g, "")
              .trim();
          }
        }

        // Extract company from content if not processed
        let extractedCompany = j.company || j.jobDetails?.company;
        if (!extractedCompany && j.content) {
          const companyMatch = j.content.match(/Company:\s*([^\n]+)/i);
          if (companyMatch) {
            extractedCompany = companyMatch[1].trim();
          }
        }

        // Extract location from content if not processed
        let extractedLocation = j.location || j.jobDetails?.location;
        if (!extractedLocation && j.content) {
          const locationMatch = j.content.match(
            /Location:\s*([^\n]+)|📍\s*Location:\s*([^\n]+)/i
          );
          if (locationMatch) {
            extractedLocation = (locationMatch[1] || locationMatch[2]).trim();
          }
        }

        return {
          title: extractedTitle || "Job Opportunity",
          company: extractedCompany || "Company not specified",
          location: extractedLocation || "Location not specified",
          deadline:
            j.applicationDeadline ||
            (j.jobDetails as { applicationDeadline?: string })
              ?.applicationDeadline ||
            undefined,
          url:
            j.postUrl || j.facebookUrl || j.apifyData?.facebookUrl || undefined,
        };
      });

      await sendJobDigestEmail(sub.email, digestItems);
      totalSent++;

      const newSentIds = [
        ...sentJobIds,
        ...jobs.map((j) =>
          typeof j._id === "string"
            ? j._id
            : (j._id as { toString(): string }).toString()
        ),
      ];

      await subsCol.updateOne(
        { _id: sub._id },
        { $set: { lastSentAt: new Date(), sentJobIds: newSentIds } }
      );
    }

    return NextResponse.json({ success: true, data: { totalSent } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to send hourly emails" },
      { status: 500 }
    );
  }
}
