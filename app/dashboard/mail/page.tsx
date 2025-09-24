"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { JobPost } from "@/types";

interface Subscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  lastSentAt?: string;
  sentJobIds?: string[];
}

interface EmailResult {
  email: string;
  sent: number;
  message: string;
}

export default function ManualEmailPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, subsRes] = await Promise.all([
        fetch("/api/jobs?limit=50&sortBy=date&sortOrder=desc"),
        fetch("/api/subscribers"),
      ]);

      const jobsData = await jobsRes.json();
      const subsData = await subsRes.json();

      // Handle jobs data - API returns { data: [...], pagination: {...} }
      if (jobsData.data && Array.isArray(jobsData.data)) {
        setJobs(jobsData.data);
      } else if (jobsData.success && jobsData.data) {
        setJobs(jobsData.data);
      }

      // Handle subscribers data - API returns { success: true, data: [...] }
      if (subsData.success && subsData.data) {
        setSubscribers(subsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleJobToggle = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map((job) => job._id || ""));
    }
  };

  const sendToSubscriber = async (subscriberEmail: string) => {
    if (selectedJobs.length === 0) {
      setMessage("Please select at least one job");
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/email/send-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberEmail,
          jobIds: selectedJobs,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(
          `✅ ${data.message} (${data.sent} sent, ${data.alreadySent} already sent)`
        );
        // Update subscriber data
        fetchData();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to send email: ${error}`);
    } finally {
      setSending(false);
    }
  };

  const sendToAllSubscribers = async () => {
    if (selectedJobs.length === 0) {
      setMessage("Please select at least one job");
      return;
    }

    setSending(true);
    setMessage(null);
    setResults([]);

    try {
      const response = await fetch("/api/email/send-manual", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: selectedJobs,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(
          `✅ ${data.message} - Total sent: ${data.totalSent}, Skipped: ${data.totalSkipped}`
        );
        setResults(data.results || []);
        // Update subscriber data
        fetchData();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to send bulk email: ${error}`);
    } finally {
      setSending(false);
    }
  };

  const getJobTitle = (job: JobPost) => {
    return job.jobTitle || job.jobDetails?.title || "Job Opportunity";
  };

  const getJobCompany = (job: JobPost) => {
    return job.company || job.jobDetails?.company || "";
  };

  const getJobLocation = (job: JobPost) => {
    return job.location || job.jobDetails?.location || "";
  };

  const getUnsentJobsCount = (subscriber: Subscriber) => {
    const sentJobIds = subscriber.sentJobIds || [];
    return selectedJobs.filter((jobId) => !sentJobIds.includes(jobId)).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
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
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-blue-600">
                  Manual Email Sending
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Send job alerts to subscribers manually
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
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("✅")
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Jobs Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Select Jobs to Send ({selectedJobs.length} selected)
                  </h2>
                  <button
                    onClick={handleSelectAll}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedJobs.length === jobs.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {jobs.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No jobs found
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {jobs.map((job, index) => {
                      return (
                        <div
                          key={job._id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            selectedJobs.includes(job._id || "")
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleJobToggle(job._id || "")}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedJobs.includes(job._id || "")}
                              onChange={() => handleJobToggle(job._id || "")}
                              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900">
                                {getJobTitle(job)}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                {getJobCompany(job) && (
                                  <span>🏢 {getJobCompany(job)}</span>
                                )}
                                {getJobLocation(job) && (
                                  <span>📍 {getJobLocation(job)}</span>
                                )}
                                <span>
                                  📅{" "}
                                  {new Date(job.scrapedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscribers */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Subscribers ({subscribers.length})
                </h2>
              </div>
              <div className="p-4">
                {/* Send to All Button */}
                <button
                  onClick={sendToAllSubscribers}
                  disabled={sending || selectedJobs.length === 0}
                  className="w-full mb-4 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <div className="flex items-center justify-center">
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
                      Sending...
                    </div>
                  ) : (
                    `📧 Send to All Subscribers`
                  )}
                </button>

                {subscribers.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No subscribers found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscribers.map((subscriber) => {
                      const unsentCount = getUnsentJobsCount(subscriber);
                      return (
                        <div
                          key={subscriber._id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900 text-sm">
                              {subscriber.email}
                            </div>
                            <button
                              onClick={() => sendToSubscriber(subscriber.email)}
                              disabled={sending || unsentCount === 0}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Send ({unsentCount})
                            </button>
                          </div>
                          <div className="text-xs text-gray-600">
                            <div>
                              Subscribed:{" "}
                              {new Date(
                                subscriber.subscribedAt
                              ).toLocaleDateString()}
                            </div>
                            {subscriber.lastSentAt && (
                              <div>
                                Last sent:{" "}
                                {new Date(
                                  subscriber.lastSentAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                            <div>
                              Total sent: {subscriber.sentJobIds?.length || 0}{" "}
                              jobs
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    Bulk Send Results
                  </h3>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg text-sm ${
                          result.message === "Success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : result.message === "All jobs already sent"
                            ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        <div className="font-medium">{result.email}</div>
                        <div>
                          {result.message} ({result.sent} jobs sent)
                        </div>
                      </div>
                    ))}
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
