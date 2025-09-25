"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface AnalysisData {
  analysis: string;
}

interface ParsedAnalysis {
  title: string;
  executive_summary: {
    overall_performance_rating: string;
    key_performance_indicators: string;
    interviewer_perspective: string;
    standout_moments: string[];
    concerning_moments: string[];
  };
  detailed_performance_analysis: {
    opening_impression: {
      first_30_seconds: string;
      introduction_quality: string;
      energy_and_enthusiasm: string;
    };
    communication_excellence: {
      clarity_and_articulation: string;
      structure_and_organization: string;
      listening_skills: string;
      questioning_technique: string;
      professional_vocabulary: string;
    };
    content_depth_analysis: {
      technical_competency_demonstration: string;
      experience_articulation: string;
      problem_solving_approach: string;
      industry_awareness: string;
      company_research_evidence: string;
    };
  };
  comprehensive_gap_analysis: {
    critical_technical_gaps: Array<{
      gap_area: string;
      evidence_from_conversation: string;
      industry_importance: string;
      impact_on_candidacy: string;
      urgency_level: string;
    }>;
    soft_skill_development_needs: Array<{
      skill_area: string;
      current_competency_level: string;
      manifestation_in_interview: string;
      career_impact: string;
      development_priority: string;
    }>;
    interview_technique_gaps: Array<{
      technique_area: string;
      observed_deficiency: string;
      best_practice_standard: string;
      improvement_strategy: string;
    }>;
  };
  strategic_improvement_roadmap: {
    immediate_priorities: Array<{
      improvement_area: string;
      current_state: string;
      target_state: string;
      specific_actions: string[];
      success_metrics: string;
      timeline: string;
    }>;
    medium_term_development: Array<{
      development_area: string;
      strategic_importance: string;
      development_pathway: string;
      milestone_markers: string;
    }>;
    long_term_mastery_goals: Array<{
      mastery_area: string;
      expert_level_standards: string;
      continuous_improvement_strategy: string;
    }>;
  };
  comprehensive_learning_resources: {
    technical_skill_development: Array<{
      skill_focus: string;
      current_gap_assessment: string;
      learning_pathway: {
        foundational_resources: Array<{
          type: string;
          title: string;
          url: string;
          description: string;
          time_commitment: string;
          difficulty_level: string;
          why_recommended: string;
        }>;
        intermediate_resources: Array<{
          type: string;
          title: string;
          url: string;
          description: string;
          time_commitment: string;
          prerequisites: string;
          certification_available: string;
        }>;
        practical_application: Array<{
          type: string;
          title: string;
          url: string;
          description: string;
          expected_outcomes: string;
        }>;
        mastery_validation: Array<{
          type: string;
          title: string;
          url: string;
          description: string;
        }>;
      };
    }>;
    soft_skill_enhancement: Array<{
      skill_area: string;
      development_approach: string;
      resources: Array<{
        type: string;
        title: string;
        url: string;
        description: string;
        reading_strategy?: string;
      }>;
    }>;
    interview_mastery_development: Array<{
      interview_aspect: string;
      mastery_components: string[];
      development_resources: Array<{
        type: string;
        title: string;
        url: string;
        description: string;
        development_resources?: Array<{
          type: string;
          title: string;
          url: string;
          description: string;
        }>;
      }>;
    }>;
  };
  actionable_30_day_plan: {
    week_1_focus: {
      primary_objective: string;
      daily_actions: string[];
      skill_building_activities: string[];
      success_indicators: string[];
    };
    week_2_progression: {
      primary_objective: string;
      daily_actions: string[];
      practice_sessions: string[];
      feedback_collection: string[];
    };
    week_3_integration: {
      primary_objective: string;
      mock_interview_focus: string[];
      real_world_application: string[];
    };
    week_4_mastery: {
      primary_objective: string;
      assessment_activities: string[];
      next_phase_preparation: string[];
    };
  };
  final_comprehensive_assessment: {
    readiness_evaluation: string;
    competitive_positioning: string;
    next_interview_predictions: string;
    success_probability: string;
  };
  motivational_conclusion: {
    strengths_reinforcement: string;
    growth_potential_recognition: string;
    encouraging_next_steps: string;
    success_visualization: string;
  };
}

function InterviewAnalysisResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<ParsedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analysisParam = searchParams.get("analysis");
    if (analysisParam) {
      try {
        const rawData = JSON.parse(decodeURIComponent(analysisParam));

        // Handle different response formats from Smyth AI API
        if (typeof rawData === "string") {
          // Simple string response - show error message
          setError(`Analysis API returned: ${rawData}`);
        } else if (rawData.analysis) {
          // Expected format with analysis property
          if (typeof rawData.analysis === "string") {
            try {
              const parsedAnalysis: ParsedAnalysis = JSON.parse(
                rawData.analysis
              );
              setAnalysisData(parsedAnalysis);
            } catch (parseErr) {
              // If analysis is a string but not valid JSON, show it as informational message
              const cleanMessage = rawData.analysis.replace(/\+/g, " ");
              setError(`Analysis Result: ${cleanMessage}`);
            }
          } else {
            // Analysis is already an object
            setAnalysisData(rawData.analysis as ParsedAnalysis);
          }
        } else {
          // Unexpected format
          setError("Unexpected analysis data format");
          console.error("Unexpected analysis format:", rawData);
        }
      } catch (err) {
        setError("Failed to parse analysis data");
        console.error("Analysis parsing error:", err);
      }
    } else {
      setError("No analysis data found");
    }
    setLoading(false);
  }, [searchParams]);

  const downloadPDF = async () => {
    if (!analysisData) return;

    try {
      // Create a comprehensive text version for PDF generation
      const pdfContent = generatePDFContent(analysisData);

      // Create blob and download
      const blob = new Blob([pdfContent], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "interview-analysis-report.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error:", error);
    }
  };

  const generatePDFContent = (data: ParsedAnalysis): string => {
    return `
COMPREHENSIVE INTERVIEW ANALYSIS REPORT
Generated by Hirelens AI

${data.title}

EXECUTIVE SUMMARY
================
Overall Performance Rating: ${data.executive_summary.overall_performance_rating}

Key Performance Indicators:
${data.executive_summary.key_performance_indicators}

Interviewer Perspective:
${data.executive_summary.interviewer_perspective}

Standout Moments:
${data.executive_summary.standout_moments
  .map((moment) => `• ${moment}`)
  .join("\n")}

Concerning Moments:
${data.executive_summary.concerning_moments
  .map((moment) => `• ${moment}`)
  .join("\n")}

DETAILED PERFORMANCE ANALYSIS
=============================

Opening Impression:
- First 30 Seconds: ${
      data.detailed_performance_analysis.opening_impression.first_30_seconds
    }
- Introduction Quality: ${
      data.detailed_performance_analysis.opening_impression.introduction_quality
    }
- Energy and Enthusiasm: ${
      data.detailed_performance_analysis.opening_impression
        .energy_and_enthusiasm
    }

Communication Excellence:
- Clarity and Articulation: ${
      data.detailed_performance_analysis.communication_excellence
        .clarity_and_articulation
    }
- Structure and Organization: ${
      data.detailed_performance_analysis.communication_excellence
        .structure_and_organization
    }
- Listening Skills: ${
      data.detailed_performance_analysis.communication_excellence
        .listening_skills
    }
- Questioning Technique: ${
      data.detailed_performance_analysis.communication_excellence
        .questioning_technique
    }
- Professional Vocabulary: ${
      data.detailed_performance_analysis.communication_excellence
        .professional_vocabulary
    }

Content Depth Analysis:
- Technical Competency: ${
      data.detailed_performance_analysis.content_depth_analysis
        .technical_competency_demonstration
    }
- Experience Articulation: ${
      data.detailed_performance_analysis.content_depth_analysis
        .experience_articulation
    }
- Problem Solving Approach: ${
      data.detailed_performance_analysis.content_depth_analysis
        .problem_solving_approach
    }
- Industry Awareness: ${
      data.detailed_performance_analysis.content_depth_analysis
        .industry_awareness
    }
- Company Research Evidence: ${
      data.detailed_performance_analysis.content_depth_analysis
        .company_research_evidence
    }

GAP ANALYSIS
============

Critical Technical Gaps:
${data.comprehensive_gap_analysis.critical_technical_gaps
  .map(
    (gap) => `
• ${gap.gap_area}
  Evidence: ${gap.evidence_from_conversation}
  Industry Importance: ${gap.industry_importance}
  Impact: ${gap.impact_on_candidacy}
  Urgency: ${gap.urgency_level}
`
  )
  .join("\n")}

Soft Skill Development Needs:
${data.comprehensive_gap_analysis.soft_skill_development_needs
  .map(
    (skill) => `
• ${skill.skill_area}
  Current Level: ${skill.current_competency_level}
  Manifestation: ${skill.manifestation_in_interview}
  Career Impact: ${skill.career_impact}
  Priority: ${skill.development_priority}
`
  )
  .join("\n")}

IMPROVEMENT ROADMAP
===================

Immediate Priorities (Next Month):
${data.strategic_improvement_roadmap.immediate_priorities
  .map(
    (priority) => `
• ${priority.improvement_area}
  Current State: ${priority.current_state}
  Target State: ${priority.target_state}
  Actions: ${priority.specific_actions.join(", ")}
  Success Metrics: ${priority.success_metrics}
  Timeline: ${priority.timeline}
`
  )
  .join("\n")}

30-DAY ACTION PLAN
==================

Week 1: ${data.actionable_30_day_plan.week_1_focus.primary_objective}
Daily Actions: ${data.actionable_30_day_plan.week_1_focus.daily_actions.join(
      ", "
    )}

Week 2: ${data.actionable_30_day_plan.week_2_progression.primary_objective}
Daily Actions: ${data.actionable_30_day_plan.week_2_progression.daily_actions.join(
      ", "
    )}

Week 3: ${data.actionable_30_day_plan.week_3_integration.primary_objective}
Focus Areas: ${data.actionable_30_day_plan.week_3_integration.mock_interview_focus.join(
      ", "
    )}

Week 4: ${data.actionable_30_day_plan.week_4_mastery.primary_objective}
Assessment Activities: ${data.actionable_30_day_plan.week_4_mastery.assessment_activities.join(
      ", "
    )}

FINAL ASSESSMENT
================
Readiness Evaluation: ${
      data.final_comprehensive_assessment.readiness_evaluation
    }
Competitive Positioning: ${
      data.final_comprehensive_assessment.competitive_positioning
    }
Success Probability: ${data.final_comprehensive_assessment.success_probability}

MOTIVATIONAL CONCLUSION
========================
Strengths: ${data.motivational_conclusion.strengths_reinforcement}
Growth Potential: ${data.motivational_conclusion.growth_potential_recognition}
Next Steps: ${data.motivational_conclusion.encouraging_next_steps}
Success Vision: ${data.motivational_conclusion.success_visualization}

Generated on: ${new Date().toLocaleDateString()}
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    const isInsufficientData =
      error?.includes("incomplete") ||
      error?.includes("not contain enough information");

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl text-center bg-white rounded-xl shadow-lg p-8">
          <div
            className={`text-xl mb-4 ${
              isInsufficientData ? "text-orange-600" : "text-red-600"
            }`}
          >
            {isInsufficientData ? "📝 Analysis Notice" : "⚠️ Error"}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {isInsufficientData
                ? "Insufficient Interview Data"
                : "Analysis Error"}
            </h2>

            <div className="bg-gray-50 p-4 rounded-lg text-left mb-4">
              <p className="text-gray-700 text-sm">
                {error || "No analysis data available"}
              </p>
            </div>

            {isInsufficientData && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-left">
                <h3 className="font-semibold text-blue-800 mb-2">
                  💡 Tips for Better Analysis:
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • Ensure the interview session runs for at least 1-2 minutes
                  </li>
                  <li>
                    • Make sure both you and the AI interviewer have spoken
                  </li>
                  <li>• Try answering a few questions during the interview</li>
                  <li>• Check that your microphone is working properly</li>
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/mock-interview")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Another Interview
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Interview Analysis Report
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive AI-powered interview assessment
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
              <button
                onClick={downloadPDF}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Download Report</span>
              </button>
              <button
                onClick={() => router.push("/mock-interview")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                New Interview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Summary */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Executive Summary
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Overall Performance Rating
              </h3>
              <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                {analysisData.executive_summary.overall_performance_rating}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Key Performance Indicators
              </h3>
              <p className="text-gray-700">
                {analysisData.executive_summary.key_performance_indicators}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Interviewer Perspective
              </h3>
              <p className="text-gray-700">
                {analysisData.executive_summary.interviewer_perspective}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-green-700 mb-2">
                  ✅ Standout Moments
                </h3>
                <ul className="space-y-2">
                  {analysisData.executive_summary.standout_moments.map(
                    (moment, index) => (
                      <li
                        key={index}
                        className="text-gray-700 bg-green-50 p-3 rounded-lg"
                      >
                        {moment}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-red-700 mb-2">
                  ⚠️ Concerning Moments
                </h3>
                <ul className="space-y-2">
                  {analysisData.executive_summary.concerning_moments.map(
                    (moment, index) => (
                      <li
                        key={index}
                        className="text-gray-700 bg-red-50 p-3 rounded-lg"
                      >
                        {moment}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Performance Analysis */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Detailed Performance Analysis
            </h2>
          </div>
          <div className="p-6 space-y-8">
            {/* Opening Impression */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Opening Impression
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">
                    First 30 Seconds
                  </h4>
                  <p className="text-sm text-gray-600">
                    {
                      analysisData.detailed_performance_analysis
                        .opening_impression.first_30_seconds
                    }
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Introduction Quality
                  </h4>
                  <p className="text-sm text-gray-600">
                    {
                      analysisData.detailed_performance_analysis
                        .opening_impression.introduction_quality
                    }
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Energy & Enthusiasm
                  </h4>
                  <p className="text-sm text-gray-600">
                    {
                      analysisData.detailed_performance_analysis
                        .opening_impression.energy_and_enthusiasm
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Communication Excellence */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Communication Excellence
              </h3>
              <div className="space-y-4">
                {Object.entries(
                  analysisData.detailed_performance_analysis
                    .communication_excellence
                ).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-800 capitalize">
                      {key.replace(/_/g, " ")}
                    </h4>
                    <p className="text-gray-600 mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Depth Analysis */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Content Depth Analysis
              </h3>
              <div className="space-y-4">
                {Object.entries(
                  analysisData.detailed_performance_analysis
                    .content_depth_analysis
                ).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-gray-800 capitalize">
                      {key.replace(/_/g, " ")}
                    </h4>
                    <p className="text-gray-600 mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Comprehensive Gap Analysis
            </h2>
          </div>
          <div className="p-6 space-y-8">
            {/* Technical Gaps */}
            <div>
              <h3 className="text-lg font-medium text-red-700 mb-4">
                Critical Technical Gaps
              </h3>
              <div className="space-y-4">
                {analysisData.comprehensive_gap_analysis.critical_technical_gaps.map(
                  (gap, index) => (
                    <div
                      key={index}
                      className="bg-red-50 p-4 rounded-lg border border-red-200"
                    >
                      <h4 className="font-medium text-red-800 mb-2">
                        {gap.gap_area}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Evidence:</span>{" "}
                          {gap.evidence_from_conversation}
                        </p>
                        <p>
                          <span className="font-medium">
                            Industry Importance:
                          </span>{" "}
                          {gap.industry_importance}
                        </p>
                        <p>
                          <span className="font-medium">Impact:</span>{" "}
                          {gap.impact_on_candidacy}
                        </p>
                        <p>
                          <span className="font-medium">Urgency:</span>{" "}
                          {gap.urgency_level}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Soft Skill Gaps */}
            <div>
              <h3 className="text-lg font-medium text-orange-700 mb-4">
                Soft Skill Development Needs
              </h3>
              <div className="space-y-4">
                {analysisData.comprehensive_gap_analysis.soft_skill_development_needs.map(
                  (skill, index) => (
                    <div
                      key={index}
                      className="bg-orange-50 p-4 rounded-lg border border-orange-200"
                    >
                      <h4 className="font-medium text-orange-800 mb-2">
                        {skill.skill_area}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Current Level:</span>{" "}
                          {skill.current_competency_level}
                        </p>
                        <p>
                          <span className="font-medium">Manifestation:</span>{" "}
                          {skill.manifestation_in_interview}
                        </p>
                        <p>
                          <span className="font-medium">Career Impact:</span>{" "}
                          {skill.career_impact}
                        </p>
                        <p>
                          <span className="font-medium">Priority:</span>{" "}
                          {skill.development_priority}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 30-Day Action Plan */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              30-Day Action Plan
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-2">Week 1</h3>
                <p className="text-sm text-blue-700 mb-3">
                  {
                    analysisData.actionable_30_day_plan.week_1_focus
                      .primary_objective
                  }
                </p>
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-blue-800">
                    Daily Actions:
                  </h4>
                  <ul className="text-xs text-blue-600 space-y-1">
                    {analysisData.actionable_30_day_plan.week_1_focus.daily_actions.map(
                      (action, index) => (
                        <li key={index}>• {action}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">Week 2</h3>
                <p className="text-sm text-green-700 mb-3">
                  {
                    analysisData.actionable_30_day_plan.week_2_progression
                      .primary_objective
                  }
                </p>
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-green-800">
                    Daily Actions:
                  </h4>
                  <ul className="text-xs text-green-600 space-y-1">
                    {analysisData.actionable_30_day_plan.week_2_progression.daily_actions.map(
                      (action, index) => (
                        <li key={index}>• {action}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-medium text-purple-800 mb-2">Week 3</h3>
                <p className="text-sm text-purple-700 mb-3">
                  {
                    analysisData.actionable_30_day_plan.week_3_integration
                      .primary_objective
                  }
                </p>
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-purple-800">
                    Focus Areas:
                  </h4>
                  <ul className="text-xs text-purple-600 space-y-1">
                    {analysisData.actionable_30_day_plan.week_3_integration.mock_interview_focus.map(
                      (focus, index) => (
                        <li key={index}>• {focus}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h3 className="font-medium text-indigo-800 mb-2">Week 4</h3>
                <p className="text-sm text-indigo-700 mb-3">
                  {
                    analysisData.actionable_30_day_plan.week_4_mastery
                      .primary_objective
                  }
                </p>
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-indigo-800">
                    Assessment:
                  </h4>
                  <ul className="text-xs text-indigo-600 space-y-1">
                    {analysisData.actionable_30_day_plan.week_4_mastery.assessment_activities.map(
                      (activity, index) => (
                        <li key={index}>• {activity}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Assessment */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Final Assessment & Motivation
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Readiness Evaluation
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {
                    analysisData.final_comprehensive_assessment
                      .readiness_evaluation
                  }
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Success Probability
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {
                    analysisData.final_comprehensive_assessment
                      .success_probability
                  }
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-4">
                💪 Motivational Conclusion
              </h3>
              <div className="space-y-3">
                <p>
                  <span className="font-medium text-green-700">Strengths:</span>{" "}
                  {analysisData.motivational_conclusion.strengths_reinforcement}
                </p>
                <p>
                  <span className="font-medium text-green-700">
                    Growth Potential:
                  </span>{" "}
                  {
                    analysisData.motivational_conclusion
                      .growth_potential_recognition
                  }
                </p>
                <p>
                  <span className="font-medium text-green-700">
                    Next Steps:
                  </span>{" "}
                  {analysisData.motivational_conclusion.encouraging_next_steps}
                </p>
                <p>
                  <span className="font-medium text-green-700">
                    Success Vision:
                  </span>{" "}
                  {analysisData.motivational_conclusion.success_visualization}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            Report generated on {new Date().toLocaleDateString()} by Hirelens AI
          </p>
          <p className="text-gray-400 text-sm mt-2">
            This analysis is AI-generated and should be used as guidance
            alongside professional career advice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InterviewAnalysisResults() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analysis results...</p>
          </div>
        </div>
      }
    >
      <InterviewAnalysisResultsContent />
    </Suspense>
  );
}
