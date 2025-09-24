import { NextRequest, NextResponse } from "next/server";
import { sendJobDigestEmail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }

    // Send test email with sample job data
    const testJobs = [
      {
        title: "Test Software Engineer Position",
        company: "Test Company Inc",
        location: "Remote",
        url: "https://example.com/job/1",
      },
      {
        title: "Frontend Developer",
        company: "Another Test Co",
        location: "New York, NY",
        url: "https://example.com/job/2",
      },
    ];

    console.log(`🧪 Sending test email to ${email}`);
    await sendJobDigestEmail(email, testJobs);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      data: { jobsSent: testJobs.length },
    });
  } catch (error: unknown) {
    console.error("❌ Test email failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
