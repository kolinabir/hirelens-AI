"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { JobPost } from "@/types";

interface ProcessedData {
  jobTitle?: string;
  company?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  technicalSkills?: string[];
  responsibilities?: string[];
  benefits?: string[];
  applicationDeadline?: string;
  applicationMethods?: any[];
  [key: string]: any;
}

export default function ManualProcessingPage() {
  const [currentJob, setCurrentJob] = useState<JobPost | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [remainingCount, setRemainingCount] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  useEffect(() => {
    fetchNextJob();
  }, []);

  const fetchNextJob = async () => {
    setLoading(true);
    setMessage(null);
    setProcessedData(null);

    try {
      const response = await fetch("/api/jobs/process-manual");
      const data = await response.json();

      if (data.success) {
        if (data.job) {
          setCurrentJob(data.job);
          setRemainingCount(data.remainingCount);
        } else {
          setCurrentJob(null);
          setMessage("🎉 All jobs have been processed!");
        }
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to fetch job: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const processCurrentJob = async () => {
    if (!currentJob) return;

    setProcessing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/jobs/process-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: currentJob._id }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyProcessed) {
          setMessage("ℹ️ This job was already processed");
        } else {
          setMessage("✅ Job processed successfully!");
          setProcessedData(data.processedData);
          setProcessedCount((prev) => prev + 1);
        }

        // Auto-load next job after 2 seconds
        setTimeout(() => {
          fetchNextJob();
        }, 2000);
      } else {
        setMessage(`❌ Processing failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Processing failed: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const deleteCurrentJob = async () => {
    if (!currentJob) return;

    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/jobs?id=${currentJob._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✅ Job deleted successfully!");
        setDeletedCount((prev) => prev + 1);
        
        // Auto-load next job after 1 second
        setTimeout(() => {
          fetchNextJob();
        }, 1000);
      } else {
        setMessage(`❌ Failed to delete job: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to delete job: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const resetAndStart = () => {
    setDeletedCount(0);
    setProcessedCount(0);
    fetchNextJob();
  };

  const getJobTitle = (job: JobPost) => {
    return job.jobTitle || job.jobDetails?.title || "Untitled Job";
  };

  const getJobCompany = (job: JobPost) => {
    return job.company || job.jobDetails?.company || "Unknown Company";
  };

  const getJobLocation = (job: JobPost) => {
    return job.location || job.jobDetails?.location || "Location not specified";
  };

  const getJobContent = (job: JobPost) => {
    return job.content || job.originalPost || "No content available";
  };

  if (loading && !currentJob) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job for processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-purple-600">
                  Manual Job Processing
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Process jobs one by one using AI extraction
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Remaining Jobs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {remainingCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Processed This Session
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {processedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deleted</p>
                <p className="text-2xl font-bold text-gray-900">{deletedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actions</p>
                <button
                  onClick={resetAndStart}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Reset & Start Over
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("✅") || message.includes("🎉")
                ? "bg-green-50 text-green-800 border border-green-200"
                : message.includes("❌")
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            {message}
          </div>
        )}

        {currentJob ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Current Job */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Current Job to Process
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Review the job content and process it using AI extraction
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <p className="text-gray-900 font-semibold">
                      {getJobTitle(currentJob)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <p className="text-gray-900">
                        {getJobCompany(currentJob)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <p className="text-gray-900">
                        {getJobLocation(currentJob)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Status
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        currentJob.isProcessed
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {currentJob.isProcessed
                        ? "✅ Processed"
                        : "❌ Unprocessed"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posted Date
                    </label>
                    <p className="text-gray-900">
                      {new Date(currentJob.scrapedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Content
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {getJobContent(currentJob)}
                      </p>
                    </div>
                  </div>

                  {currentJob.facebookUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Original Post
                      </label>
                      <a
                        href={currentJob.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View on Facebook →
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={deleteCurrentJob}
                    disabled={loading}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700"
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
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete Job
                      </>
                    )}
                  </button>
                  <button
                    onClick={processCurrentJob}
                    disabled={processing || loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {processing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        Processing...
                      </>
                    ) : (
                      "🤖 Process with AI"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Processed Data Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  AI Processing Results
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Extracted data will appear here after processing
                </p>
              </div>
              <div className="p-6">
                {processedData ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Extracted Job Title
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {processedData.jobTitle || "Not extracted"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <p className="text-gray-900">
                          {processedData.company || "Not extracted"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <p className="text-gray-900">
                          {processedData.location || "Not extracted"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Salary
                        </label>
                        <p className="text-gray-900">
                          {processedData.salary || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employment Type
                        </label>
                        <p className="text-gray-900">
                          {processedData.employmentType || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {processedData.technicalSkills &&
                      processedData.technicalSkills.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Technical Skills
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {processedData.technicalSkills.map(
                              (skill, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {processedData.benefits &&
                      processedData.benefits.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Benefits
                          </label>
                          <ul className="list-disc list-inside text-sm text-gray-700">
                            {processedData.benefits.map((benefit, index) => (
                              <li key={index}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {processedData.applicationDeadline && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Application Deadline
                        </label>
                        <p className="text-gray-900">
                          {processedData.applicationDeadline}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      Process the job to see AI-extracted data
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              All Jobs Processed!
            </h3>
            <p className="mt-2 text-gray-600">
              Congratulations! There are no more unprocessed jobs to handle.
            </p>
            <button
              onClick={resetAndStart}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
