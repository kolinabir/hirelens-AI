import { NextRequest, NextResponse } from "next/server";
import dbConnection from "@/lib/database";
import { sendJobDigestEmail } from "@/lib/mailer";

/**
 * @swagger
 * /api/subscribers:
 *   get:
 *     summary: Get all email subscribers
 *     description: Retrieve a list of all email subscribers with their basic information including email, creation date, and last email sent date.
 *     tags: [Email]
 *     responses:
 *       200:
 *         description: Successfully retrieved subscribers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmailSubscriber'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   post:
 *     summary: Add new email subscriber
 *     description: Subscribe a new email address to receive job digest emails. Optionally sends a welcome email with recent job opportunities.
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to subscribe
 *                 example: "newuser@example.com"
 *     responses:
 *       200:
 *         description: Successfully subscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "newuser@example.com"
 *                     welcomeSent:
 *                       type: boolean
 *                       description: Whether welcome email was sent
 *                       example: true
 *                     sentCount:
 *                       type: number
 *                       description: Number of jobs included in welcome email
 *                       example: 10
 *                 message:
 *                   type: string
 *                   example: "Successfully subscribed to job alerts"
 *       400:
 *         description: Invalid email or already subscribed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
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
        // Debug: Log the actual job data structure
        console.log(
          "🔍 Raw job data sample:",
          JSON.stringify(jobs[0], null, 2)
        );

        const digestItems = jobs.map((j, index) => {
          console.log(`🔍 Processing job ${index + 1}:`, {
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
              j.postUrl ||
              j.facebookUrl ||
              j.apifyData?.facebookUrl ||
              undefined,
          };
        });

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
