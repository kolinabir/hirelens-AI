"use client";

import { useState, useEffect, useCallback } from "react";
import type { JobPost, PaginatedResponse, JobFilters } from "@/types";

interface JobsTabProps {
  initialJobs: JobPost[];
  onUpdate: () => void;
}

export default function JobsTab({ initialJobs, onUpdate }: JobsTabProps) {
  const [jobs, setJobs] = useState<JobPost[]>(initialJobs);
  const [pagination, setPagination] = useState<
    PaginatedResponse<JobPost>["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  const handleFilterChange = (
    key: keyof JobFilters,
    value: string | string[] | boolean | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
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

  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor(
      (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return postDate.toLocaleDateString();
  };

  const getProfileImageUrl = (job: JobPost) => {
    return (
      job.author?.profileImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        job.author?.name || job.user?.name || "User"
      )}&background=3b82f6&color=fff&size=40`
    );
  };

  const getProfileUrl = (job: JobPost) => {
    return job.author?.profileUrl || "#";
  };

  const getPostUrl = (job: JobPost) => {
    return job.postUrl || "#";
  };

  const getAttachmentImage = (job: JobPost) => {
    const attachment = job.attachments?.[0];
    let imageUrl = null;

    if (attachment?.photo_image?.uri) {
      imageUrl = attachment.photo_image.uri;
    } else if (attachment?.url) {
      imageUrl = attachment.url;
    }

    if (!imageUrl) return null;

    // If it's a Facebook URL, proxy it through our server to bypass CORS
    if (imageUrl.includes("facebook.com")) {
      return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }

    return imageUrl;
  };

  const openJobModal = (job: JobPost) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeJobModal = () => {
    setSelectedJob(null);
    setIsModalOpen(false);
  };

  const clearUnstructured = async () => {
    if (!confirm("Delete all unstructured jobs? This cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch("/api/jobs/clear?unstructuredOnly=true", {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Deleted ${result?.data?.deletedCount || 0} unstructured jobs`);
        fetchJobs();
        onUpdate();
      } else {
        alert(result?.error || "Failed to clear unstructured jobs");
      }
    } catch (err) {
      console.error("Clear unstructured error:", err);
      alert("Failed to clear unstructured jobs");
    }
  };

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter Header */}
        <div className="bg-blue-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Smart Filters
                </h2>
                <p className="text-sm text-gray-600">
                  Find your perfect job opportunity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showAdvancedFilters ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                {showAdvancedFilters ? "Hide" : "Show"} Advanced
              </button>
              <button
                onClick={() => setFilters({ page: 1, limit: 20 })}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Basic Filters - Always Visible */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Search Keywords */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Search Keywords
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title, company, skills..."
                  value={filters.keywords || ""}
                  onChange={(e) =>
                    handleFilterChange("keywords", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <svg
                  className="absolute left-3 top-3.5 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Quick Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📊 Sort By
              </label>
              <select
                value={`${filters.sortBy || "date"}_${
                  filters.sortOrder || "desc"
                }`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("_");
                  handleFilterChange("sortBy", sortBy as string);
                  handleFilterChange("sortOrder", sortOrder as string);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="date_desc">🕒 Newest First</option>
                <option value="date_asc">🕐 Oldest First</option>
                <option value="engagement_desc">❤️ Most Popular</option>
                <option value="engagement_asc">📊 Least Popular</option>
              </select>
            </div>

            {/* Job Quality */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⭐ Job Quality
              </label>
              <select
                value={filters.structuredOnly ? "structured" : "all"}
                onChange={(e) =>
                  handleFilterChange(
                    "structuredOnly",
                    e.target.value === "structured"
                  )
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Jobs</option>
                <option value="structured">✨ AI Processed Only</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-100 pt-6 space-y-6">
              {/* Row 1: Employment & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💼 Employment Type
                  </label>
                  <select
                    value={filters.jobType?.[0] || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "jobType",
                        e.target.value ? [e.target.value] : undefined
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">All Employment Types</option>
                    <option value="Full-Time">👔 Full Time</option>
                    <option value="Part-Time">⏰ Part Time</option>
                    <option value="Contract">📋 Contract</option>
                    <option value="Freelance">🌟 Freelance</option>
                    <option value="Internship">🎓 Internship</option>
                    <option value="Remote">🏠 Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, Country or Remote"
                    value={filters.location || ""}
                    onChange={(e) =>
                      handleFilterChange("location", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🏢 Company
                  </label>
                  <input
                    type="text"
                    placeholder="Company name..."
                    value={filters.company || ""}
                    onChange={(e) =>
                      handleFilterChange("company", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Experience & Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🎯 Experience Level
                  </label>
                  <select
                    value={filters.experienceLevel || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "experienceLevel",
                        e.target.value || undefined
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Any Experience</option>
                    <option value="Entry">🌱 Entry Level</option>
                    <option value="Junior">👶 Junior (1-2 years)</option>
                    <option value="Mid">🚀 Mid Level (3-5 years)</option>
                    <option value="Senior">⭐ Senior (5+ years)</option>
                    <option value="Lead">👑 Lead/Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💰 Salary Range
                  </label>
                  <select
                    value={filters.salaryRange || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "salaryRange",
                        e.target.value || undefined
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Any Salary</option>
                    <option value="0-30000">💵 Under 30K BDT</option>
                    <option value="30000-50000">💸 30K - 50K BDT</option>
                    <option value="50000-80000">💎 50K - 80K BDT</option>
                    <option value="80000-120000">🏆 80K - 120K BDT</option>
                    <option value="120000+">🌟 120K+ BDT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🌍 Work Type
                  </label>
                  <select
                    value={filters.workType || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "workType",
                        e.target.value || undefined
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Any Work Type</option>
                    <option value="remote">🏠 Remote</option>
                    <option value="onsite">🏢 On-site</option>
                    <option value="hybrid">🔄 Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Skills & Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🛠️ Required Skills
                  </label>
                  <input
                    type="text"
                    placeholder="React, Python, Node.js, etc."
                    value={filters.skills || ""}
                    onChange={(e) =>
                      handleFilterChange("skills", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate skills with commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Posted Date
                  </label>
                  <select
                    value={
                      typeof filters.dateRange === "string"
                        ? filters.dateRange
                        : ""
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "dateRange",
                        e.target.value || undefined
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Any Time</option>
                    <option value="today">📅 Today</option>
                    <option value="week">📆 This Week</option>
                    <option value="month">🗓️ This Month</option>
                    <option value="3months">📊 Last 3 Months</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Advanced Options */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  🎛️ Advanced Options
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasAttachments || false}
                      onChange={(e) =>
                        handleFilterChange("hasAttachments", e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      📎 Has Images
                    </span>
                  </label>

                  <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-green-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasDeadline || false}
                      onChange={(e) =>
                        handleFilterChange("hasDeadline", e.target.checked)
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      ⏰ Has Deadline
                    </span>
                  </label>

                  <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-purple-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasContact || false}
                      onChange={(e) =>
                        handleFilterChange("hasContact", e.target.checked)
                      }
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      📧 Has Contact
                    </span>
                  </label>

                  <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-orange-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.highEngagement || false}
                      onChange={(e) =>
                        handleFilterChange("highEngagement", e.target.checked)
                      }
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      🔥 Popular (10+ likes)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Filter Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 px-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                {pagination?.total
                  ? `${pagination.total} jobs found`
                  : "No jobs found"}
              </span>
              {filters &&
                Object.keys(filters).filter(
                  (key) =>
                    key !== "page" &&
                    key !== "limit" &&
                    key !== "sortBy" &&
                    key !== "sortOrder" &&
                    filters[key as keyof JobFilters] !== undefined &&
                    filters[key as keyof JobFilters] !== null &&
                    filters[key as keyof JobFilters] !== "" &&
                    filters[key as keyof JobFilters] !== false
                ).length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {
                      Object.keys(filters).filter(
                        (key) =>
                          key !== "page" &&
                          key !== "limit" &&
                          key !== "sortBy" &&
                          key !== "sortOrder" &&
                          filters[key as keyof JobFilters] !== undefined &&
                          filters[key as keyof JobFilters] !== null &&
                          filters[key as keyof JobFilters] !== "" &&
                          filters[key as keyof JobFilters] !== false
                      ).length
                    }{" "}
                    filters active
                  </span>
                )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filters.limit || 20}
                onChange={(e) => handleFilterChange("limit", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>Show 10</option>
                <option value={20}>Show 20</option>
                <option value={50}>Show 50</option>
                <option value={100}>Show 100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.294a7.943 7.943 0 01-2-.294M16 6H8m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6v10a2 2 0 002 2h4a2 2 0 002-2V6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or start scraping for jobs
          </p>
          <button
            onClick={fetchJobs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs?.map((job) => {
            if (!job) return null;

            const authorName = job.user?.name || job.author?.name || "Unknown";
            const jobTitle =
              job.jobTitle || job.jobDetails?.title || "Job Opportunity";
            const company = job.company || job.jobDetails?.company || "";
            const location = job.location || job.jobDetails?.location || "";
            const salary = job.salary || job.jobDetails?.salary || "";
            const employmentType = job.employmentType || job.jobDetails?.type;
            const likesCount =
              job.likesCount ?? job.engagementMetrics?.likes ?? 0;
            const commentsCount =
              job.commentsCount ?? job.engagementMetrics?.comments ?? 0;

            return (
              <div
                key={job.postId}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden group"
              >
                {/* Header with Author Info and Job Type */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <a
                        href={getProfileUrl(job)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 group/avatar"
                      >
                        <img
                          src={getProfileImageUrl(job)}
                          alt={authorName}
                          className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md group-hover/avatar:shadow-lg transition-all"
                        />
                      </a>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <a
                            href={getProfileUrl(job)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-gray-900 hover:text-blue-700 transition-colors text-lg"
                          >
                            {authorName}
                          </a>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600 font-medium">
                            {formatRelativeTime(job.postedDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 bg-white/70 px-2 py-1 rounded-md">
                            📍 {"Facebook Group"}
                          </span>
                          <a
                            href={getPostUrl(job)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-sm text-blue-700 hover:text-blue-900 font-semibold bg-blue-100/50 hover:bg-blue-200/70 px-3 py-1 rounded-lg transition-all"
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
                            <span>View Post</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {employmentType && (
                        <span
                          className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                            employmentType.toLowerCase() === "full-time"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : employmentType.toLowerCase() === "part-time"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : employmentType.toLowerCase() === "contract"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : employmentType.toLowerCase() === "freelance"
                              ? "bg-orange-100 text-orange-800 border border-orange-200"
                              : employmentType.toLowerCase() === "internship"
                              ? "bg-pink-100 text-pink-800 border border-pink-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {employmentType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Job Content */}
                <div className="p-6">
                  {/* Job Title */}
                  <div className="mb-4">
                    <h3
                      className="text-2xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-700 transition-colors leading-tight"
                      onClick={() => openJobModal(job)}
                    >
                      {jobTitle}
                    </h3>

                    {/* Company, Location, Salary Row */}
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      {company && (
                        <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                          <svg
                            className="w-5 h-5 mr-2 text-gray-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-semibold text-gray-800">
                            {company}
                          </span>
                        </div>
                      )}
                      {location && (
                        <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                          <svg
                            className="w-5 h-5 mr-2 text-gray-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-semibold text-gray-800">
                            {location}
                          </span>
                        </div>
                      )}
                      {salary && (
                        <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                          <svg
                            className="w-5 h-5 mr-2 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-bold text-green-800">
                            {salary}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-6">
                    {/* Job Image */}
                    {getAttachmentImage(job) && (
                      <div className="flex-shrink-0">
                        <img
                          src={getAttachmentImage(job)!}
                          alt="Job Post"
                          className="w-28 h-28 rounded-xl object-cover border-2 border-gray-200 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all"
                          onClick={() => openJobModal(job)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      {/* Technical Skills */}
                      {job.technicalSkills &&
                        job.technicalSkills.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Required Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {job.technicalSkills
                                .slice(0, 6)
                                .map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {job.technicalSkills.length > 6 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                  +{job.technicalSkills.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Application Methods */}
                      {job.applicationMethods &&
                        job.applicationMethods.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              How to Apply
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {job.applicationMethods.map((method, index) => {
                                // Handle both object and string formats
                                const methodObj =
                                  typeof method === "string"
                                    ? { type: "info", value: method }
                                    : method;
                                return (
                                  <div
                                    key={index}
                                    className="flex items-center bg-green-50 border border-green-200 px-3 py-2 rounded-lg"
                                  >
                                    {methodObj.type === "email" && (
                                      <svg
                                        className="w-4 h-4 mr-2 text-green-600"
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
                                    )}
                                    {methodObj.type === "phone" && (
                                      <svg
                                        className="w-4 h-4 mr-2 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                      </svg>
                                    )}
                                    {methodObj.type === "link" && (
                                      <svg
                                        className="w-4 h-4 mr-2 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                        />
                                      </svg>
                                    )}
                                    {methodObj.type === "whatsapp" && (
                                      <svg
                                        className="w-4 h-4 mr-2 text-green-600"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                      </svg>
                                    )}
                                    <span className="text-sm font-medium text-green-800">
                                      {methodObj.type === "email"
                                        ? methodObj.value
                                        : methodObj.type === "phone"
                                        ? methodObj.value
                                        : methodObj.type === "whatsapp"
                                        ? methodObj.value
                                        : methodObj.type === "link"
                                        ? "Apply Here"
                                        : methodObj.value}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Job Description */}
                      <div className="text-gray-700 leading-relaxed">
                        <p className="text-sm">
                          {truncateText(job.originalPost || job.content, 300)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        <span className="text-sm font-semibold">
                          {likesCount}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-semibold">
                          {commentsCount}
                        </span>
                      </div>
                      {job.applicationDeadline && (
                        <div className="flex items-center space-x-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs font-semibold">
                            Deadline: {job.applicationDeadline}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openJobModal(job)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span>View Details</span>
                      </button>
                      <div className="text-xs text-gray-500">
                        {formatRelativeTime(job.scrapedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h2 className="text-3xl font-bold mb-2">
                    {selectedJob.jobTitle ||
                      selectedJob.jobDetails?.title ||
                      "Job Details"}
                  </h2>
                  <div className="flex items-center space-x-4 text-blue-100">
                    {selectedJob.company && (
                      <span className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {selectedJob.company}
                      </span>
                    )}
                    {selectedJob.location && (
                      <span className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {selectedJob.location}
                      </span>
                    )}
                    {selectedJob.salary && (
                      <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {selectedJob.salary}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <a
                    href={getPostUrl(selectedJob)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all font-semibold"
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span>View Post</span>
                  </a>
                  <button
                    onClick={closeJobModal}
                    className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
              <div className="p-8">
                {/* Job Image */}
                {getAttachmentImage(selectedJob) && (
                  <div className="mb-8 text-center">
                    <img
                      src={getAttachmentImage(selectedJob)!}
                      alt="Job Post"
                      className="w-full max-w-2xl mx-auto rounded-xl shadow-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Quick Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {selectedJob.employmentType && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-500 rounded-lg mr-3">
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
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.294a7.943 7.943 0 01-2-.294M16 6H8m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6v10a2 2 0 002 2h4a2 2 0 002-2V6"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Job Type
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {selectedJob.employmentType}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedJob.experienceRequired && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-500 rounded-lg mr-3">
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
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Experience
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {selectedJob.experienceRequired}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedJob.applicationDeadline && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-500 rounded-lg mr-3">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Deadline
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {selectedJob.applicationDeadline}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Methods */}
                {selectedJob.applicationMethods &&
                  selectedJob.applicationMethods.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-green-600"
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
                        How to Apply
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedJob.applicationMethods.map((method, index) => {
                          // Handle both object and string formats
                          const methodObj =
                            typeof method === "string"
                              ? { type: "info", value: method, notes: "" }
                              : method;
                          return (
                            <div
                              key={index}
                              className="bg-green-50 border border-green-200 rounded-xl p-4"
                            >
                              <div className="flex items-start space-x-3">
                                {methodObj.type === "email" && (
                                  <div className="p-2 bg-green-500 rounded-lg">
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
                                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                                {methodObj.type === "phone" && (
                                  <div className="p-2 bg-green-500 rounded-lg">
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
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                      />
                                    </svg>
                                  </div>
                                )}
                                {methodObj.type === "link" && (
                                  <div className="p-2 bg-green-500 rounded-lg">
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
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                      />
                                    </svg>
                                  </div>
                                )}
                                {methodObj.type === "whatsapp" && (
                                  <div className="p-2 bg-green-500 rounded-lg">
                                    <svg
                                      className="w-5 h-5 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 capitalize">
                                    {methodObj.type}
                                  </p>
                                  <p className="text-gray-700 break-all">
                                    {methodObj.value}
                                  </p>
                                  {methodObj.notes && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {methodObj.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Author Information */}
                <div className="mb-8 bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-blue-600"
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
                    Posted By
                  </h3>
                  <div className="flex items-center space-x-4">
                    <a
                      href={getProfileUrl(selectedJob)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <img
                        src={getProfileImageUrl(selectedJob)}
                        alt={
                          selectedJob.user?.name ||
                          selectedJob.author?.name ||
                          "Author"
                        }
                        className="w-16 h-16 rounded-full border-4 border-white shadow-lg group-hover:shadow-xl transition-all"
                      />
                    </a>
                    <div className="flex-1">
                      <a
                        href={getProfileUrl(selectedJob)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {selectedJob.user?.name ||
                          selectedJob.author?.name ||
                          "Unknown"}
                      </a>
                      <p className="text-gray-600 mb-2">
                        {formatDate(selectedJob.postedDate)}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                          📍 {selectedJob.groupName}
                        </span>
                        <span className="flex items-center text-gray-600">
                          <svg
                            className="w-4 h-4 mr-1 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                          {selectedJob.likesCount ||
                            selectedJob.engagementMetrics?.likes ||
                            0}
                        </span>
                        <span className="flex items-center text-gray-600">
                          <svg
                            className="w-4 h-4 mr-1 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {selectedJob.commentsCount ||
                            selectedJob.engagementMetrics?.comments ||
                            0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {selectedJob.technicalSkills &&
                  selectedJob.technicalSkills.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-purple-600"
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
                        Required Skills
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {selectedJob.technicalSkills.map((skill, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 px-4 py-3 rounded-xl text-center"
                          >
                            <span className="font-semibold text-purple-800">
                              {skill}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Benefits */}
                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Benefits & Perks
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedJob.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-green-50 border border-green-200 px-4 py-3 rounded-xl"
                        >
                          <svg
                            className="w-5 h-5 mr-3 text-green-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-800">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Responsibilities */}
                {selectedJob.responsibilities &&
                  selectedJob.responsibilities.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-indigo-600"
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
                        Key Responsibilities
                      </h3>
                      <div className="space-y-3">
                        {selectedJob.responsibilities.map(
                          (responsibility, index) => (
                            <div
                              key={index}
                              className="flex items-start bg-indigo-50 border border-indigo-200 px-4 py-3 rounded-xl"
                            >
                              <span className="bg-indigo-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-gray-800">
                                {responsibility}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Full Content */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-gray-600"
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
                    Full Job Description
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedJob.originalPost ||
                          selectedJob.content ||
                          "No content available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* OCR Text from attachments */}
                {selectedJob.attachments &&
                  selectedJob.attachments.length > 0 &&
                  selectedJob.attachments[0].ocrText && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Extracted Text from Image
                      </h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <p className="text-gray-700 leading-relaxed">
                          {selectedJob.attachments[0].ocrText}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>
              Showing{" "}
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total
              )}{" "}
              to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>

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
    </div>
  );
}
