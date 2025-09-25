import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { interview_conversation } = await request.json();

    if (!interview_conversation || typeof interview_conversation !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Interview conversation is required and must be a string",
        },
        { status: 400 }
      );
    }

    // Call Smyth AI analysis API
    const analysisResponse = await fetch(
      "https://cmfz0x1xr949e23qu0d1603en.agent.a.smyth.ai/api/analyze_interview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interview_conversation,
        }),
      }
    );

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Smyth AI API error:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Analysis API error: ${analysisResponse.status} - ${errorText}`,
        },
        { status: analysisResponse.status }
      );
    }

    const analysisData = await analysisResponse.json();

    return NextResponse.json({
      success: true,
      data: analysisData,
    });
  } catch (error) {
    console.error("Interview analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
