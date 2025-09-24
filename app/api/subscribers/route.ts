import { NextRequest, NextResponse } from "next/server";
import dbConnection from "@/lib/database";
import { sendJobDigestEmail } from "@/lib/mailer";

export async function GET() {
  try {
    await dbConnection.connect();
    const col = dbConnection.getSubscribersCollection();
    const subs = await col
      .find({}, { projection: { email: 1, createdAt: 1, lastSentAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: subs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to list subscribers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }

    const col = dbConnection.getSubscribersCollection();
    const existing = await col.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({
        success: true,
        data: { ...existing, welcomeSent: false },
      });
    }
    const doc = {
      email: email.toLowerCase(),
      createdAt: new Date(),
      isVerified: true,
      lastSentAt: undefined,
      sentJobIds: [],
    };
    const res = await col.insertOne(doc);

    // Build and send welcome email with up to 5 latest jobs
    let welcomeSent = false;
    let sentCount = 0;
    let welcomeError = null;

    try {
      console.log(
        `🔍 Looking for jobs to send welcome email to ${email.toLowerCase()}`
      );
      const jobsCol = dbConnection.getJobsCollection();
      const jobs = await jobsCol
        .find({})
        .sort({ scrapedAt: -1 })
        .limit(5)
        .toArray();

      console.log(`📊 Found ${jobs.length} jobs in database for welcome email`);

      if (jobs.length > 0) {
        const digestItems = jobs.map((j) => ({
          title: j.jobDetails?.title || j.jobTitle,
          company: j.jobDetails?.company || j.company,
          location: j.jobDetails?.location || j.location,
          deadline: (j.jobDetails as { applicationDeadline?: string })
            ?.applicationDeadline,
          url: j.postUrl || j.facebookUrl || j.apifyData?.facebookUrl,
        }));

        console.log("📧 Digest items prepared:", digestItems);

        await sendJobDigestEmail(email.toLowerCase(), digestItems);
        welcomeSent = true;
        sentCount = jobs.length;

        // Track sent job ids on the subscriber
        const sentJobIds = jobs.map((j) =>
          typeof j._id === "string"
            ? j._id
            : (j._id as { toString(): string }).toString()
        );

        await col.updateOne(
          { _id: res.insertedId },
          {
            $set: {
              lastSentAt: new Date(),
              sentJobIds,
            },
          }
        );

        console.log(
          `✅ Welcome email sent to ${email.toLowerCase()} with ${sentCount} jobs, tracked ${
            sentJobIds.length
          } job IDs`
        );
      } else {
        console.log(
          `⚠️ No jobs found in database to send welcome email to ${email.toLowerCase()}`
        );
      }
    } catch (welcomeErr) {
      // Do not fail subscription if email sending fails
      welcomeError = welcomeErr;
      console.error("❌ Welcome email failed:", welcomeErr);
    }

    return NextResponse.json({
      success: true,
      data: { _id: res.insertedId, ...doc, welcomeSent, sentCount },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to add subscriber" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnection.connect();
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }
    const col = dbConnection.getSubscribersCollection();
    const res = await col.deleteOne({ email: email.toLowerCase() });
    return NextResponse.json({
      success: true,
      data: { deleted: res.deletedCount },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}
