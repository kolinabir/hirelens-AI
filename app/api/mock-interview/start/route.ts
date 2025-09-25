import { NextRequest, NextResponse } from "next/server";
import env from "@/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Remove PDF parsing - using plain text input instead
function validateCvText(cvText: string): string {
  if (!cvText || cvText.trim().length < 50) {
    throw new Error("CV text must be at least 50 characters long");
  }
  return cvText.trim();
}

function buildSystemPrompt(cvText: string, jobTitle: string, jobDesc?: string) {
  // Enhanced timing structure with specific phase instructions
  const jdPart = jobDesc ? `Job Description:\n${jobDesc}\n\n` : "";

  return `You are an expert technical interviewer conducting a professional 5-minute mock interview for the ${jobTitle} position.

=== INTERVIEW STRUCTURE (STRICT TIMING) ===

PHASE 1 - INTRODUCTION (0:00-1:00):
• Greet warmly: "Hello! I'm excited to conduct this mock interview with you today."
• Ask: "Could you please introduce yourself and give me a brief 30-second overview of your background?"
• Acknowledge their CV: "I can see from your resume that you have [specific relevant experience/skill from CV]. That's impressive."
• Transition smoothly: "Great! Now let's dive into some technical questions."

PHASE 2 - TECHNICAL ASSESSMENT (1:00-3:00):
• Ask 1-2 specific technical questions relevant to ${jobTitle}
• Focus on: problem-solving approach, technical depth, and practical application
• If candidate talks too long: "That's a great point. Let me ask you about [next topic]..."
• Sample questions by role:
  - Frontend: "Walk me through how you'd optimize a React component that's causing performance issues."
  - Backend: "How would you design a scalable API endpoint for handling high-traffic requests?"
  - DevOps: "Explain your approach to implementing CI/CD for a microservices architecture."
• Transition at 3:00: "Excellent technical insights! Now let's discuss some workplace scenarios."

PHASE 3 - BEHAVIORAL & SCENARIO (3:00-5:00):
• Present realistic workplace scenarios
• Assess: leadership, communication, problem-solving under pressure
• Sample scenarios:
  - "Your team is behind schedule on a critical project. How would you handle this situation?"
  - "You disagree with your manager's technical approach. How do you handle this professionally?"
  - "Tell me about a time when you had to learn a new technology quickly for a project."
• At 4:30, begin wrapping up: "We're running short on time, so let me ask one final question..."

CONCLUSION (5:00):
• Thank them: "Thank you for taking the time to participate in this mock interview."
• Provide 2-3 specific, actionable improvement suggestions
• End positively: "You've shown [positive trait]. Keep developing your skills and you'll be very successful."

=== CANDIDATE INFORMATION ===
• Resume Summary: ${cvText.slice(0, 6000)}
• Target Position: ${jobTitle}
${jdPart}

=== INTERVIEWER GUIDELINES ===
• Professional but conversational tone
• Listen actively and ask thoughtful follow-up questions
• Use STAR method for behavioral questions
• Provide constructive, specific feedback
• Maintain strict timing - quality over quantity
• If candidate is struggling: "That's okay, interviews can be challenging. What would you do differently next time?"

=== QUALITY METRICS ===
• Ask questions that reveal technical depth and problem-solving ability
• Assess communication skills and professional demeanor
• Evaluate role-specific knowledge and experience
• Focus on real-world application rather than theoretical knowledge

Remember: The goal is to simulate a real technical interview while providing valuable learning experience.`;
}

async function createUltravoxCall(systemPrompt: string) {
  const apiKey = env.ultravoxApiKey;
  if (!apiKey) {
    return {
      success: false,
      error:
        "ULTRAVOX_API_KEY is not configured. Please add it to your environment variables.",
      status: 500,
    } as const;
  }

  // Simplified call configuration for mock interviews
  const body = {
    systemPrompt,
    model: "fixie-ai/ultravox",
    voice: "Conversationalist-English",
    temperature: 0.4,
    maxDuration: "300s",
    timeExceededMessage:
      "Thank you for participating in this mock interview. The session has concluded.",
    recordingEnabled: false,
    firstSpeaker: "FIRST_SPEAKER_AGENT",
  } as const;

  try {
    const resp = await fetch("https://api.ultravox.ai/api/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "User-Agent": "JobScrap-MockInterview/1.0",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      let errorMessage = `HTTP ${resp.status}`;
      let errorDetails = "";
      try {
        const errorData = await resp.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = JSON.stringify(errorData);
        console.error("Ultravox API error details:", errorData);
      } catch {
        const textError = await resp.text();
        errorMessage = textError || errorMessage;
        errorDetails = textError;
        console.error("Ultravox API error text:", textError);
      }

      console.error(
        "Request body that caused error:",
        JSON.stringify(body, null, 2)
      );

      return {
        success: false,
        error: `Ultravox API error: ${errorMessage}`,
        status: resp.status,
      } as const;
    }

    const json = await resp.json();

    // Validate response has required fields
    if (!json.callId && !json.id) {
      return {
        success: false,
        error: "Invalid response from Ultravox API: missing call ID",
        status: 500,
      } as const;
    }

    return { success: true, data: json } as const;
  } catch (error) {
    return {
      success: false,
      error: `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      status: 500,
    } as const;
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { cvText, jobTitle, jobDesc } = body;

    // Validate CV text
    if (!cvText || typeof cvText !== "string") {
      return NextResponse.json(
        { success: false, error: "CV text is required" },
        { status: 400 }
      );
    }

    // Validate job title
    if (
      !jobTitle ||
      typeof jobTitle !== "string" ||
      jobTitle.trim().length < 3
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Job title is required (minimum 3 characters)",
        },
        { status: 400 }
      );
    }

    // Validate CV text length
    const validatedCvText = validateCvText(cvText);

    // Build system prompt enforcing timing
    const systemPrompt = buildSystemPrompt(
      validatedCvText,
      jobTitle.trim(),
      jobDesc?.trim() || undefined
    );

    // Create Ultravox call
    const result = await createUltravoxCall(systemPrompt);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    // Extract join URL from Ultravox response
    const responseData = (result as any).data;
    const joinUrl =
      responseData.joinUrl ||
      responseData.webJoinUrl ||
      responseData.call?.joinUrl;

    if (!joinUrl) {
      console.error("No join URL found in Ultravox response:", responseData);
      return NextResponse.json(
        { success: false, error: "No join URL received from Ultravox API" },
        { status: 500 }
      );
    }

    console.log("Mock interview call created successfully:", {
      callId: responseData.callId || responseData.id,
      joinUrl: joinUrl.substring(0, 50) + "...", // Log partial URL for debugging
    });

    return NextResponse.json({
      success: true,
      data: {
        joinUrl,
        callId: responseData.callId || responseData.id,
        duration: "300s",
        phases: [
          { name: "Introduction", duration: "0:00-1:00" },
          { name: "Problem Solving", duration: "1:00-3:00" },
          { name: "Scenario Based", duration: "3:00-5:00" },
        ],
      },
    });
  } catch (error) {
    console.error("Mock interview start error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
