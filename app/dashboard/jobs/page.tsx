"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { JobPost, PaginatedResponse, JobFilters } from "@/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [pagination, setPagination] = useState<
    PaginatedResponse<JobPost>["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 20,
    sortBy: "date",
    sortOrder: "desc",
    structuredOnly: false,
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            queryParams.set(key, value.join(","));
          } else {
            queryParams.set(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/jobs?${queryParams}`);
      const result: PaginatedResponse<JobPost> = await response.json();

      setJobs(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error("Jobs fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (
    key: keyof JobFilters,
    value: string | string[] | boolean | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const deleteJob = async (job: JobPost) => {
    if (!confirm("Are you sure you want to delete this job post?")) {
      return;
    }

    try {
      const qs = job.postUrl ? `postUrl=${encodeURIComponent(job.postUrl)}` : `id=${job.postId}`;
      const response = await fetch(`/api/jobs?${qs}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchJobs(); // Refresh the list
      } else {
        alert("Failed to delete job post");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete job post");
    }
  };

  const clearUnstructured = async () => {
    if (!confirm("This will remove old, unstructured job posts. Continue?")) {
      return;
    }
    try {
      const response = await fetch(`/api/jobs/clear?unstructuredOnly=true`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Deleted ${result?.data?.deletedCount || 0} unstructured jobs`);
        fetchJobs();
      } else {
        alert(result?.error || "Failed to clear unstructured jobs");
      }
    } catch (err) {
      console.error("Clear unstructured error:", err);
      alert("Failed to clear unstructured jobs");
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Helper functions for professional job cards
  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return postDate.toLocaleDateString();
  };

  const getProfileImageUrl = (job: JobPost) => {
    return job.author?.profileImage || 
           `https://ui-avatars.com/api/?name=${encodeURIComponent(job.author?.name || job.user?.name || 'User')}&background=3b82f6&color=fff&size=40`;
  };

  const getProfileUrl = (job: JobPost) => {
    return job.author?.profileUrl || job.apifyData?.facebookUrl || '#';
  };

  const getPostUrl = (job: JobPost) => {
    return job.postUrl || '#';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchJobs}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scraped Jobs</h1>
              <p className="mt-1 text-sm text-gray-500">
                {pagination
                  ? `${pagination.total} total jobs found`
                  : "Loading..."}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={fetchJobs}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={clearUnstructured}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                title="Remove old, unstructured jobs"
              >
                🧹 Clean Unstructured
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.keywords || ""}
                onChange={(e) => handleFilterChange("keywords", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={filters.jobType?.[0] || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "jobType",
                    e.target.value ? [e.target.value] : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="Location..."
                value={filters.location || ""}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  handleFilterChange("sortBy", sortBy);
                  handleFilterChange("sortOrder", sortOrder);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="engagement-desc">Most Engagement</option>
                <option value="engagement-asc">Least Engagement</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center text-sm font-medium text-gray-700 gap-2">
                <input
                  type="checkbox"
                  checked={!!filters.structuredOnly}
                  onChange={(e) =>
                    handleFilterChange("structuredOnly", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                Structured Only
              </label>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="flex space-x-4">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Jobs Found
            </h3>
            <p className="text-gray-500 mb-6">
              No job posts match your current filters. Try adjusting your search
              criteria.
            </p>
            <button
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: 20,
                  sortBy: "date",
                  sortOrder: "desc",
                  structuredOnly: false,
                })
              }
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => {
              // Display variables for better readability
              const jobTitle = job.jobTitle || job.jobDetails?.title || "Job Opportunity";
              const company = job.company || job.jobDetails?.company;
              const location = job.location || job.jobDetails?.location;
              const salary = job.salary || job.jobDetails?.salary;
              const employmentType = job.employmentType || job.jobDetails?.type;
              const authorName = job.author?.name || job.user?.name || "Unknown Author";
              const likesCount = job.likesCount || job.engagementMetrics?.likes || 0;
              const commentsCount = job.commentsCount || job.engagementMetrics?.comments || 0;
              const sharesCount = job.engagementMetrics?.shares || 0;

              return (
                <div
                  key={job.postId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Author Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <a
                          href={getProfileUrl(job)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <img
                            src={getProfileImageUrl(job)}
                            alt={authorName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 hover:border-blue-300 transition-colors"
                          />
                        </a>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <a
                              href={getProfileUrl(job)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {authorName}
                            </a>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(job.postedDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">
                              📍 {job.groupName}
                            </span>
                            <a
                              href={getPostUrl(job)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              View Post →
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {employmentType && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              employmentType === "full-time"
                                ? "bg-green-100 text-green-800"
                                : employmentType === "part-time"
                                ? "bg-blue-100 text-blue-800"
                                : employmentType === "contract"
                                ? "bg-purple-100 text-purple-800"
                                : employmentType === "freelance"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {employmentType}
                          </span>
                        )}
                        <button
                          onClick={() => deleteJob(job)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete job post"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Job Content */}
                  <div className="px-6 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {jobTitle}
                    </h3>
                    
                    {/* Company and Location */}
                    {(company || location) && (
                      <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                        {company && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                            </svg>
                            {company}
                          </span>
                        )}
                        {location && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {location}
                          </span>
                        )}
                        {salary && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            {salary}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Job Description */}
                    <div className="text-gray-700 leading-relaxed mb-4">
                      <p>{truncateText(job.content, 300)}</p>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-6">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span className="text-sm font-medium">{likesCount}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">{commentsCount}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                          <span className="text-sm font-medium">{sharesCount}</span>
                        </button>
                      </div>
                      <div className="text-xs text-gray-400">
                        Scraped: {formatDate(job.scrapedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const page = Math.max(1, pagination.page - 2) + i;
                    if (page > pagination.totalPages) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 border rounded-md text-sm font-medium ${
                          page === pagination.page
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
