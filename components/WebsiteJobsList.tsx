"use client";

import { useState, useEffect } from "react";
import type { WebsiteJobData, WebsiteSnapshot } from "../types";

interface WebsiteJobsListProps {
  websiteId?: string;
  showAll?: boolean;
  limit?: number;
}

interface WebsiteJobWithSource extends WebsiteJobData {
  websiteName: string;
  scrapedAt: string;
}

export default function WebsiteJobsList({
  websiteId,
  showAll = false,
  limit = 20,
}: WebsiteJobsListProps) {
  const [jobs, setJobs] = useState<WebsiteJobWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWebsiteJobs();
  }, [websiteId, showAll, limit]);

  const fetchWebsiteJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch snapshots based on parameters
      let url = `/api/websites/snapshots?limit=${limit}`;
      if (websiteId) {
        url += `&websiteId=${websiteId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch website jobs");
      }

      // Transform snapshots into jobs with source info
      const allJobs: WebsiteJobWithSource[] = [];

      for (const snapshot of data.data) {
        for (const job of snapshot.jobs) {
          allJobs.push({
            ...job,
            websiteName: snapshot.websiteName,
            scrapedAt: snapshot.scrapedAt,
          });
        }
      }

      // Sort by scraped date (newest first)
      allJobs.sort(
        (a, b) =>
          new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime()
      );

      setJobs(showAll ? allJobs : allJobs.slice(0, limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading website jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading website jobs
            </h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No website jobs found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {websiteId
            ? "This website hasn't been scraped yet."
            : "No websites have been scraped yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Website Jobs ({jobs.length})
        </h3>
        <button
          onClick={fetchWebsiteJobs}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="-ml-0.5 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {jobs.map((job, index) => (
          <div
            key={`${job.websiteName}-${index}`}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {job.jobTitle}
                </h4>

                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1m4 4h1m-1-4h1"
                      />
                    </svg>
                    <span className="font-medium">{job.companyName}</span>
                    {job.positionRole && job.positionRole !== job.jobTitle && (
                      <span className="text-gray-500 ml-2">
                        • {job.positionRole}
                      </span>
                    )}
                  </div>

                  {job.location && (
                    <div className="flex items-center">
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{job.location}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                      />
                    </svg>
                    <span className="text-blue-600 font-medium">
                      {job.websiteName}
                    </span>
                    <span className="text-gray-400 ml-2">
                      • {new Date(job.scrapedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {job.jobType && (
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-2 text-gray-600">{job.jobType}</span>
                    </div>
                  )}

                  {job.experienceLevel && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Experience:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {job.experienceLevel}
                      </span>
                    </div>
                  )}

                  {job.department && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Department:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {job.department}
                      </span>
                    </div>
                  )}

                  {job.salaryCompensation && (
                    <div>
                      <span className="font-medium text-gray-700">Salary:</span>
                      <span className="ml-2 text-gray-600">
                        {job.salaryCompensation}
                      </span>
                    </div>
                  )}
                </div>

                {/* Application Deadline */}
                {job.applicationDeadline && (
                  <div className="mt-4 flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-red-600">
                      Deadline: {job.applicationDeadline}
                    </span>
                  </div>
                )}

                {/* Job Description */}
                {job.jobDescriptionSummary && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">
                      Description:
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {job.jobDescriptionSummary}
                    </p>
                  </div>
                )}

                {/* Requirements */}
                {job.requirements && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">
                      Requirements:
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {job.requirements}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>
                  Scraped on {new Date(job.scrapedAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const searchQuery = encodeURIComponent(job.jobTitle);
                    window.open(
                      `/dashboard/jobs?search=${searchQuery}`,
                      "_blank"
                    );
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="-ml-0.5 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Preview
                </button>

                <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800">
                  <svg
                    className="-ml-0.5 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                  Website Job
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
