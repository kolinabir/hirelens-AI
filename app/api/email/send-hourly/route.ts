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
        })
        .sort({ scrapedAt: -1 })
        .limit(5)
        .toArray();

      if (jobs.length === 0) {
        continue;
      }

      const digestItems = jobs.map((j) => ({
        title: j.jobDetails?.title || j.jobTitle,
        company: j.jobDetails?.company || j.company,
        location: j.jobDetails?.location || j.location,
        url: j.postUrl || j.facebookUrl || j.apifyData?.facebookUrl,
      }));

      await sendJobDigestEmail(sub.email, digestItems);
      totalSent++;

      const newSentIds = [
        ...sentJobIds,
        ...jobs.map((j) =>
          typeof j._id === "string" ? j._id : j._id.toString()
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
