"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UltravoxSession,
  UltravoxSessionStatus,
  Transcript,
} from "ultravox-client";

// Interview state type (currently not used)
// type InterviewState = "setup" | "connecting" | "active" | "completed" | "error";

const StatusLabel: Record<UltravoxSessionStatus, string> = {
  [UltravoxSessionStatus.DISCONNECTED]: "Disconnected",
  [UltravoxSessionStatus.DISCONNECTING]: "Disconnecting",
  [UltravoxSessionStatus.CONNECTING]: "Connecting",
  [UltravoxSessionStatus.IDLE]: "Ready",
  [UltravoxSessionStatus.LISTENING]: "Listening",
  [UltravoxSessionStatus.THINKING]: "Processing",
  [UltravoxSessionStatus.SPEAKING]: "Speaking",
};

// Interview phases (currently not used in UI but kept for reference)
// interface InterviewPhase {
//   name: string;
//   duration: string;
//   description: string;
//   color: string;
// }

// const INTERVIEW_PHASES: InterviewPhase[] = [
//   {
//     name: "Introduction",
//     duration: "0:00-1:00",
//     description: "Warm greeting and brief background discussion",
//     color: "bg-blue-600",
//   },
//   {
//     name: "Problem Solving",
//     duration: "1:00-3:00",
//     description: "Technical questions and thought process evaluation",
//     color: "bg-gray-700",
//   },
//   {
//     name: "Scenario Based",
//     duration: "3:00-5:00",
//     description: "Workplace scenarios and judgment assessment",
//     color: "bg-green-600",
//   },
// ];

export default function MockInterviewPage() {
  const router = useRouter();
  const [cvText, setCvText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(true);

  // Real-time session
  const sessionRef = useRef<UltravoxSession | null>(null);
  const [status, setStatus] = useState<UltravoxSessionStatus>(
    UltravoxSessionStatus.DISCONNECTED
  );
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);

  // Interview timing and phases
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [conversationHistory, setConversationHistory] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Interview data (currently not used in UI)
  // const [interviewData, setInterviewData] = useState<{
  //   joinUrl: string;
  //   callId: string;
  //   duration: string;
  //   phases: Array<{ name: string; duration: string }>;
  // } | null>(null);

  const isAgentSpeaking = status === UltravoxSessionStatus.SPEAKING;
  const isUserTalking = status === UltravoxSessionStatus.LISTENING;
  const isInterviewActive =
    status !== UltravoxSessionStatus.DISCONNECTED &&
    interviewStartTime !== null;

  // Calculate current phase based on elapsed time (currently not used)
  // const elapsedSeconds = currentTime;
  // Current phase calculation (currently not used in UI)
  // const currentPhaseIndex = useMemo(() => {
  //   if (elapsedSeconds < 60) return 0; // Introduction
  //   if (elapsedSeconds < 180) return 1; // Problem Solving
  //   if (elapsedSeconds < 300) return 2; // Scenario Based
  //   return 3; // Completed
  // }, [elapsedSeconds]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (interviewStartTime && isInterviewActive) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - interviewStartTime) / 1000);
        setCurrentTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStartTime, isInterviewActive]);

  // End call function
  const endCall = useCallback(async () => {
    // First, trigger analysis if we have conversation history
    if (conversationHistory.trim()) {
      setIsAnalyzing(true);
      try {
        const response = await fetch("/api/mock-interview/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interview_conversation: conversationHistory,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Navigate to results page with analysis data
          const analysisParam = encodeURIComponent(JSON.stringify(data.data));
          router.push(`/mock-interview/results?analysis=${analysisParam}`);
          return; // Don't reset the form, user is navigating away
        } else {
          console.error("Analysis failed:", data.error);
        }
      } catch (error) {
        console.error("Analysis error:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }

    // Then clean up the session
    if (sessionRef.current) {
      sessionRef.current.leaveCall().catch(() => {});
      sessionRef.current = null;
    }
    setJoinUrl(null);
    setInterviewStartTime(null);
    setCurrentTime(0);
    setTranscripts([]);
    setStatus(UltravoxSessionStatus.DISCONNECTED);
  }, [conversationHistory, router]);

  const startSession = useCallback(
    (url: string) => {
      // Clean up old session if any
      if (sessionRef.current) {
        sessionRef.current.leaveCall().catch(() => {});
        sessionRef.current = null;
      }

      const session = new UltravoxSession();
      sessionRef.current = session;

      // Status events drive UI animations and timing
      session.addEventListener("status", () => {
        const newStatus = session.status;
        setStatus(newStatus);

        // Start timing when the session becomes active
        if (newStatus === UltravoxSessionStatus.IDLE && !interviewStartTime) {
          setInterviewStartTime(Date.now());
        }
      });

      // Transcripts events update live transcript list
      session.addEventListener("transcripts", () => {
        const newTranscripts = [...session.transcripts];
        setTranscripts(newTranscripts);

        // Build conversation history for analysis
        const conversation = newTranscripts
          .map((t) => {
            const speaker =
              t.speaker === "user" ? "Interviewee" : "Interviewer";
            return `${speaker}: ${t.text}`;
          })
          .join("\n\n");
        setConversationHistory(conversation);
      });

      // Handle session end
      session.addEventListener("disconnected", () => {
        setInterviewStartTime(null);
        setCurrentTime(0);
      });

      // Join the call
      session.joinCall(url);
    },
    [interviewStartTime]
  );

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.leaveCall().catch(() => {});
        sessionRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cvText.trim()) {
      setError("Please enter your CV/resume text");
      return;
    }
    if (cvText.trim().length < 50) {
      setError("CV text must be at least 50 characters long");
      return;
    }
    if (!jobTitle.trim()) {
      setError("Please enter a job title to practice");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/mock-interview/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText: cvText.trim(),
          jobTitle: jobTitle.trim(),
          jobDesc: jobDesc.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start mock interview");
      }

      const url = data.data.joinUrl as string | undefined;
      if (!url) {
        throw new Error("No join URL returned from server");
      }

      // Store interview data for display
      setJoinUrl(url);
      setShowSetupForm(false); // Hide the setup form

      // Reset timing state
      setInterviewStartTime(null);
      setCurrentTime(0);

      // Immediately join and show live transcripts + animations
      startSession(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (): number => {
    return Math.min((currentTime / 300) * 100, 100);
  };

  // Enhanced animations and components
  const TalkingDots = ({ color }: { color: string }) => (
    <div className="flex space-x-1 items-end h-5">
      <span
        className={`w-1.5 h-1.5 rounded-full ${color} animate-bounce [animation-delay:-0.3s]`}
      ></span>
      <span
        className={`w-1.5 h-2 rounded-full ${color} animate-bounce [animation-delay:-0.15s]`}
      ></span>
      <span className={`w-1.5 h-3 rounded-full ${color} animate-bounce`}></span>
    </div>
  );

  const StatusIndicator = ({
    status,
    label,
  }: {
    status: UltravoxSessionStatus;
    label: string;
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case UltravoxSessionStatus.CONNECTING:
          return "bg-yellow-500";
        case UltravoxSessionStatus.IDLE:
          return "bg-green-500";
        case UltravoxSessionStatus.LISTENING:
          return "bg-blue-500";
        case UltravoxSessionStatus.THINKING:
          return "bg-purple-500";
        case UltravoxSessionStatus.SPEAKING:
          return "bg-emerald-500";
        default:
          return "bg-gray-500";
      }
    };

    return (
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor()} ${
            status !== UltravoxSessionStatus.DISCONNECTED ? "animate-pulse" : ""
          }`}
        ></div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  };

  // PhaseIndicator component removed as it's not being used

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl">
        {/* Professional Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
            AI Mock Interview Platform
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Practice professional interviews with our advanced AI interviewer.
            Get real-time feedback and improve your performance in a structured
            5-minute session.
          </p>
        </div>

        <div
          className={`max-w-7xl mx-auto ${
            showSetupForm
              ? "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12"
              : ""
          }`}
        >
          {/* Left Column - Setup Form (Hidden during interview) */}
          {showSetupForm && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Interview Setup
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">
                    Configure your mock interview session
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Resume/CV Text
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <textarea
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        placeholder="Paste your resume/CV text here... Include your experience, skills, education, and any relevant information for the interview."
                        className="block w-full pl-10 sm:pl-12 pr-4 py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm resize-none"
                        rows={6}
                        required
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                      <span
                        className={`${
                          cvText.length < 50 ? "text-red-500" : "text-green-600"
                        } font-medium`}
                      >
                        {cvText.length} characters (minimum 50 required)
                      </span>
                      <span className="text-gray-400">
                        Tip: Copy and paste from your existing resume
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Target Position
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m0 0v2a2 2 0 002 2h4a2 2 0 002-2V6"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g., Senior Frontend Engineer"
                        className="block w-full pl-10 sm:pl-12 pr-4 py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Job Description{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <textarea
                        value={jobDesc}
                        onChange={(e) => setJobDesc(e.target.value)}
                        placeholder="Paste the job description here for more targeted interview questions..."
                        className="block w-full pl-10 sm:pl-12 pr-4 py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm resize-none"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="pt-5 sm:pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !cvText.trim() ||
                        cvText.trim().length < 50 ||
                        !jobTitle.trim()
                      }
                      className="w-full bg-blue-600 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Initializing Interview...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 5a9 9 0 1118 0H3z"
                            />
                          </svg>
                          <span>Start Mock Interview</span>
                        </>
                      )}
                    </button>

                    {error && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-red-500 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-semibold text-red-800">
                              Error
                            </h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Interview Phases Overview */}
              {/* <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 mt-6 sm:mt-8">
                 <div className="mb-6 sm:mb-8">
                   <div className="flex items-center mb-3">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                       <svg
                         className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                         fill="none"
                         stroke="currentColor"
                         viewBox="0 0 24 24"
                       >
                         <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                         />
                       </svg>
                     </div>
                     <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                       Interview Structure
                     </h3>
                   </div>
                   <p className="text-sm sm:text-base text-gray-600">
                     Your 5-minute interview will follow this structured approach
                   </p>
                 </div>
                <div className="space-y-4">
                  {INTERVIEW_PHASES.map((phase, index) => (
                    <PhaseIndicator
                      key={index}
                      phase={phase}
                      index={index}
                      isActive={
                        currentPhaseIndex === index && isInterviewActive
                      }
                      isCompleted={
                        currentPhaseIndex > index && isInterviewActive
                      }
                    />
                  ))}
                </div>
              </div> */}
            </div>
          )}

          {/* Right Column - Interview Status & Controls */}
          <div
            className={
              showSetupForm ? "lg:col-span-2" : "w-full max-w-6xl mx-auto"
            }
          >
            {joinUrl ? (
              <div className="space-y-6 sm:space-y-8">
                {/* Timer and Progress */}
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                          Live Interview Session
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600">
                          Real-time interview in progress
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:space-x-6">
                      <div className="text-center sm:text-right">
                        <div className="text-2xl sm:text-3xl font-bold font-mono text-gray-900 mb-1">
                          {formatTime(currentTime)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          of 5:00 minutes
                        </div>
                      </div>
                      <button
                        onClick={endCall}
                        disabled={isAnalyzing}
                        className={`${
                          isAnalyzing
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        } text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base`}
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                            <span>Analyzing Interview...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M4.5 4.5l15 15"
                              />
                            </svg>
                            <span>End Call</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-6 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>

                  {/* Status Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-bold text-gray-900">
                            AI Interviewer
                          </h3>
                        </div>
                        {isAgentSpeaking && (
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div
                              className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-green-300 rounded-full animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <StatusIndicator
                        status={status}
                        label={StatusLabel[status]}
                      />
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-bold text-gray-900">You</h3>
                        </div>
                        {isUserTalking && (
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <div
                              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        <span
                          className={`font-semibold ${
                            isUserTalking ? "text-blue-700" : "text-gray-600"
                          }`}
                        >
                          {isUserTalking ? "Speaking..." : "Ready to respond"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* External Link */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900">
                            Enhanced Audio Experience
                          </h4>
                          <p className="text-sm text-blue-700">
                            Open in separate window for better audio quality
                          </p>
                        </div>
                      </div>
                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <span>Open Call</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Live Transcript */}
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                          Live Transcript
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600">
                          Real-time conversation transcript
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-auto">
                      {transcripts.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="flex justify-center space-x-8 sm:space-x-12 mb-6 sm:mb-8">
                            {/* AI Avatar */}
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 relative">
                                <svg
                                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                {status !==
                                  UltravoxSessionStatus.DISCONNECTED && (
                                  <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-blue-700">
                                AI Interviewer
                              </span>
                              <span className="text-xs text-gray-500">
                                Ready to interview
                              </span>
                            </div>

                            {/* User Avatar */}
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-green-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 relative">
                                <svg
                                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                {status !==
                                  UltravoxSessionStatus.DISCONNECTED && (
                                  <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-green-700">
                                You
                              </span>
                              <span className="text-xs text-gray-500">
                                Interview candidate
                              </span>
                            </div>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-3">
                            {status !== UltravoxSessionStatus.DISCONNECTED
                              ? "Interview Starting..."
                              : "Connecting to Interview Session"}
                          </h4>
                          <p className="text-gray-600 max-w-md mx-auto mb-6">
                            {status !== UltravoxSessionStatus.DISCONNECTED
                              ? "The AI interviewer will begin shortly. Your conversation will appear here in real-time."
                              : "Please wait while we establish the connection to your interview session."}
                          </p>
                          <TalkingDots color="bg-blue-500" />
                        </div>
                      ) : (
                        transcripts.map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-3 sm:space-x-4 group"
                          >
                            <div
                              className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 relative ${
                                t.speaker === "agent"
                                  ? "bg-blue-100"
                                  : "bg-green-100"
                              }`}
                            >
                              {t.speaker === "agent" ? (
                                <>
                                  <svg
                                    className="w-7 h-7 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full animate-pulse">
                                    <div className="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-7 h-7 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse">
                                    <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex-1">
                              <div
                                className={`p-5 rounded-2xl shadow-lg transition-all duration-200 ${
                                  t.speaker === "agent"
                                    ? "bg-white border-l-4 border-blue-400"
                                    : "bg-green-50 border-l-4 border-green-400"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={`font-bold text-sm ${
                                      t.speaker === "agent"
                                        ? "text-blue-700"
                                        : "text-green-700"
                                    }`}
                                  >
                                    {t.speaker === "agent"
                                      ? "AI Interviewer"
                                      : "You"}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {new Date().toLocaleTimeString()}
                                  </span>
                                </div>
                                <p
                                  className={`leading-relaxed ${
                                    t.isFinal
                                      ? "text-gray-900"
                                      : "text-gray-600 italic"
                                  }`}
                                >
                                  {t.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Welcome Screen */
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 backdrop-blur-sm p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Ready to Practice?
                </h2>
                <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                  Enter your resume text and specify the role you&apos;re
                  targeting. Our advanced AI interviewer will conduct a
                  structured 5-minute mock interview with real-time feedback and
                  professional analysis.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                      1
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Introduction
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Personal background and experience overview
                    </p>
                  </div>

                  <div className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                      2
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Problem Solving
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Technical challenges and thought process evaluation
                    </p>
                  </div>

                  <div className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                      3
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Scenario-Based
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Workplace situations and behavioral assessment
                    </p>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">
                        AI-Powered Interviewer
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">
                        Real-Time Feedback
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">
                        Professional Analysis
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
