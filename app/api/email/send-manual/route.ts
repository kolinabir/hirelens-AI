import { NextRequest, NextResponse } from "next/server";
import dbConnection from "@/lib/database";
import { sendJobDigestEmail } from "@/lib/mailer";
import { ObjectId } from "mongodb";
import { apiLogger } from "@/lib/logger";

/**
 * @swagger
 * /api/email/send-manual:
 *   post:
 *     summary: Send manual job digest email
 *     description: Send a job digest email to a specific subscriber with selected job posts. This allows for targeted email campaigns with curated job selections.
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriberEmail
 *               - jobIds
 *             properties:
 *               subscriberEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address of the subscriber
 *                 example: "user@example.com"
 *               jobIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of job MongoDB ObjectIds to include in the email
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Email sent successfully
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
 *                     emailSent:
 *                       type: boolean
 *                       example: true
 *                     jobsSent:
 *                       type: number
 *                       description: Number of jobs included in the email
 *                       example: 5
 *                     subscriberEmail:
 *                       type: string
 *                       format: email
 *                       example: "user@example.com"
 *                 message:
 *                   type: string
 *                   example: "Manual job digest sent successfully to user@example.com"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Subscriber not found
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriberEmail, jobIds } = body;

    if (!subscriberEmail || !jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    await dbConnection.connect();
    const subsCol = dbConnection.getSubscribersCollection();
    const jobsCol = dbConnection.getJobsCollection();

    // Get subscriber
    const subscriber = await subsCol.findOne({ email: subscriberEmail });
    if (!subscriber) {
      return NextResponse.json(
        { success: false, error: "Subscriber not found" },
        { status: 404 }
      );
    }

    // Get the requested jobs
    const jobs = await jobsCol
      .find({
        _id: { $in: jobIds.map((id: string) => new ObjectId(id)) },
      } as Record<string, unknown>)
      .toArray();

    if (jobs.length === 0) {
      return NextResponse.json(
        { success: false, error: "No jobs found" },
        { status: 404 }
      );
    }

    // Filter out jobs that have already been sent to this subscriber
    const sentJobIds = Array.isArray(subscriber.sentJobIds)
      ? subscriber.sentJobIds
      : [];
    const newJobs = jobs.filter(
      (job) => !sentJobIds.includes(job._id?.toString())
    );

    if (newJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All selected jobs have already been sent to this subscriber",
        sent: 0,
        alreadySent: jobs.length,
      });
    }

    // Prepare digest items with content extraction
    const digestItems = newJobs.map((j) => {
      // Extract title from content if not processed
      let extractedTitle = j.jobTitle || j.jobDetails?.title;
      if (!extractedTitle && j.content) {
        const lines = j.content.split("\n").filter((line) => line.trim());
        for (const line of lines) {
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

    // Send email
    await sendJobDigestEmail(subscriberEmail, digestItems);

    // Update subscriber's sent job IDs
    const newSentIds = [
      ...sentJobIds,
      ...newJobs
        .map((j) => {
          const id = j._id;
          if (typeof id === "string") {
            return id;
          }
          // Handle ObjectId case
          if (id && typeof id === "object") {
            return (id as { toString(): string }).toString();
          }
          return "";
        })
        .filter((id) => id !== ""),
    ];

    await subsCol.updateOne(
      { _id: subscriber._id },
      { $set: { lastSentAt: new Date(), sentJobIds: newSentIds } }
    );

    apiLogger.info(
      `Manual email sent to ${subscriberEmail} with ${newJobs.length} jobs`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${newJobs.length} jobs to ${subscriberEmail}`,
      sent: newJobs.length,
      alreadySent: jobs.length - newJobs.length,
    });
  } catch (error) {
    apiLogger.error("Manual email sending failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send manual email" },
      { status: 500 }
    );
  }
}

// Send jobs to all subscribers (only unsent jobs to each)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobIds } = body;

    if (!jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    await dbConnection.connect();
    const subsCol = dbConnection.getSubscribersCollection();
    const jobsCol = dbConnection.getJobsCollection();

    // Get all subscribers
    const subscribers = await subsCol.find({}).toArray();
    if (subscribers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No subscribers found" },
        { status: 404 }
      );
    }

    // Get the requested jobs
    const jobs = await jobsCol
      .find({
        _id: { $in: jobIds.map((id: string) => new ObjectId(id)) },
      } as Record<string, unknown>)
      .toArray();

    if (jobs.length === 0) {
      return NextResponse.json(
        { success: false, error: "No jobs found" },
        { status: 404 }
      );
    }

    let totalSent = 0;
    let totalSkipped = 0;
    const results = [];

    for (const subscriber of subscribers) {
      const sentJobIds = Array.isArray(subscriber.sentJobIds)
        ? subscriber.sentJobIds
        : [];

      // Filter out jobs that have already been sent to this subscriber
      const newJobs = jobs.filter(
        (job) => !sentJobIds.includes(job._id?.toString())
      );

      if (newJobs.length === 0) {
        totalSkipped++;
        results.push({
          email: subscriber.email,
          sent: 0,
          message: "All jobs already sent",
        });
        continue;
      }

      // Prepare digest items with content extraction (same logic as above)
      const digestItems = newJobs.map((j) => {
        let extractedTitle = j.jobTitle || j.jobDetails?.title;
        if (!extractedTitle && j.content) {
          const lines = j.content.split("\n").filter((line) => line.trim());
          for (const line of lines) {
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
          if (!extractedTitle && lines.length > 0) {
            extractedTitle = lines[0]
              .replace(/[🚀📍🖥️📌✉️]/g, "")
              .replace(/^\*\*|\*\*$/g, "")
              .trim();
          }
        }

        let extractedCompany = j.company || j.jobDetails?.company;
        if (!extractedCompany && j.content) {
          const companyMatch = j.content.match(/Company:\s*([^\n]+)/i);
          if (companyMatch) {
            extractedCompany = companyMatch[1].trim();
          }
        }

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

      try {
        // Send email
        await sendJobDigestEmail(subscriber.email, digestItems);

        // Update subscriber's sent job IDs
        const newSentIds = [
          ...sentJobIds,
          ...newJobs
            .map((j) => {
              const id = j._id;
              if (typeof id === "string") {
                return id;
              }
              // Handle ObjectId case
              if (id && typeof id === "object") {
                return (id as { toString(): string }).toString();
              }
              return "";
            })
            .filter((id) => id !== ""),
        ];

        await subsCol.updateOne(
          { _id: subscriber._id },
          { $set: { lastSentAt: new Date(), sentJobIds: newSentIds } }
        );

        totalSent++;
        results.push({
          email: subscriber.email,
          sent: newJobs.length,
          message: "Success",
        });
      } catch (emailError) {
        results.push({
          email: subscriber.email,
          sent: 0,
          message: `Failed: ${emailError}`,
        });
      }
    }

    apiLogger.info(
      `Manual bulk email sent to ${totalSent} subscribers with ${jobIds.length} jobs`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully sent to ${totalSent} subscribers, skipped ${totalSkipped}`,
      totalSent,
      totalSkipped,
      results,
    });
  } catch (error) {
    apiLogger.error("Manual bulk email sending failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send manual bulk email" },
      { status: 500 }
    );
  }
}
