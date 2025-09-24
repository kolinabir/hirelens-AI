"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { JobPost, PaginatedResponse, JobFilters } from "@/types";

interface JobDetailsModalProps {
  job: JobPost | null;
  isOpen: boolean;
  onClose: () => void;
}

// Job Details Modal Component
function JobDetailsModal({ job, isOpen, onClose }: JobDetailsModalProps) {
  if (!isOpen || !job) return null;

  const getAttachmentImage = (job: JobPost) => {
    const attachment = job.attachments?.[0];
    if (attachment?.photo_image?.uri) {
      return attachment.photo_image.uri;
    }
    if (attachment?.url) {
      return attachment.url;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {job.jobTitle || job.jobDetails?.title || "Job Details"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Modal Content */}
        <div className="p-6">
          {/* Job Image */}
          {getAttachmentImage(job) && (
            <div className="mb-6">
              <img
                src={getAttachmentImage(job)!}
                alt="Job Post"
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Job Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Job Information
                </h3>
                <div className="space-y-2">
                  {(job.company || job.jobDetails?.company) && (
                    <p>
                      <span className="font-medium">Company:</span>{" "}
                      {job.company || job.jobDetails?.company}
                    </p>
                  )}
                  {(job.location || job.jobDetails?.location) && (
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {job.location || job.jobDetails?.location}
                    </p>
                  )}
                  {(job.salary || job.jobDetails?.salary) && (
                    <p>
                      <span className="font-medium">Salary:</span>{" "}
                      {job.salary || job.jobDetails?.salary}
                    </p>
                  )}
                  {(job.employmentType || job.jobDetails?.type) && (
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {job.employmentType || job.jobDetails?.type}
                    </p>
                  )}
                  {job.experienceLevel && (
                    <p>
                      <span className="font-medium">Experience Level:</span>{" "}
                      {job.experienceLevel}
                    </p>
                  )}
                </div>
              </div>

              {/* Technical Skills */}
              {job.technicalSkills && job.technicalSkills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Technical Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.technicalSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Methods */}
              {job.applicationMethods && job.applicationMethods.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    How to Apply
                  </h4>
                  <div className="space-y-2">
                    {job.applicationMethods.map((method: any, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="capitalize font-medium">
                          {method.type}:
                        </span>
                        <span className="text-blue-600">{method.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Author & Engagement */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Posted By
                </h3>
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      job.author?.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        job.author?.name || job.user?.name || "User"
                      )}&background=3b82f6&color=fff&size=48`
                    }
                    alt={job.author?.name || job.user?.name || "Author"}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {job.author?.name || job.user?.name}
                    </p>
                    <p className="text-sm text-gray-500">{job.groupName}</p>
                  </div>
                </div>
              </div>

              {/* Engagement */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Engagement</h4>
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>
                    👍 {job.likesCount || job.engagementMetrics?.likes || 0}{" "}
                    likes
                  </span>
                  <span>
                    💬{" "}
                    {job.commentsCount || job.engagementMetrics?.comments || 0}{" "}
                    comments
                  </span>
                  <span>📤 {job.engagementMetrics?.shares || 0} shares</span>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Posted: {new Date(job.postedDate).toLocaleDateString()}</p>
                  <p>Scraped: {new Date(job.scrapedAt).toLocaleDateString()}</p>
                  {job.extractedAt && (
                    <p>
                      Processed:{" "}
                      {new Date(job.extractedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Content */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Full Job Post
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {job.originalPost || job.content || "No content available"}
              </p>
            </div>
          </div>

          {/* OCR Text from attachments */}
          {job.attachments &&
            job.attachments.length > 0 &&
            job.attachments[0].ocrText && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Extracted Text from Image
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-700">{job.attachments[0].ocrText}</p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [pagination, setPagination] = useState<
    PaginatedResponse<JobPost>["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 20,
    sortBy: "date",
    sortOrder: "desc",
    structuredOnly: false,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
      const qs = job.postUrl
        ? `postUrl=${encodeURIComponent(job.postUrl)}`
        : `id=${job.postId}`;
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
    return job.author?.profileUrl || job.apifyData?.facebookUrl || "#";
  };

  const getPostUrl = (job: JobPost) => {
    return job.postUrl || "#";
  };

  const getAttachmentImage = (job: JobPost) => {
    const attachment = job.attachments?.[0];
    if (attachment?.photo_image?.uri) {
      return attachment.photo_image.uri;
    }
    if (attachment?.url) {
      return attachment.url;
    }
    return null;
  };

  const openJobModal = (job: JobPost) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeJobModal = () => {
    setSelectedJob(null);
    setIsModalOpen(false);
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
        {/* Advanced Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Filter Header */}
          <div className="bg-blue-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
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
                    handleFilterChange("sortBy", sortBy as any);
                    handleFilterChange("sortOrder", sortOrder as any);
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
                      value={filters.dateRange || ""}
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
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">
                  {pagination ? `${pagination.total} jobs found` : "Loading..."}
                </span>
                {Object.keys(filters).filter(
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
                  onChange={(e) =>
                    handleFilterChange("limit", parseInt(e.target.value))
                  }
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
              const jobTitle =
                job.jobTitle || job.jobDetails?.title || "Job Opportunity";
              const company = job.company || job.jobDetails?.company;
              const location = job.location || job.jobDetails?.location;
              const salary = job.salary || job.jobDetails?.salary;
              const employmentType = job.employmentType || job.jobDetails?.type;
              const authorName =
                job.author?.name || job.user?.name || "Unknown Author";
              const likesCount =
                job.likesCount || job.engagementMetrics?.likes || 0;
              const commentsCount =
                job.commentsCount || job.engagementMetrics?.comments || 0;
              const sharesCount = job.engagementMetrics?.shares || 0;

              return (
                <div
                  key={job.postId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group"
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
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Job Content */}
                  <div className="px-6 pb-4">
                    <div className="flex items-start space-x-4">
                      {/* Job Image */}
                      {getAttachmentImage(job) && (
                        <div className="flex-shrink-0">
                          <img
                            src={getAttachmentImage(job)!}
                            alt="Job Post"
                            className="w-20 h-20 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openJobModal(job)}
                          />
                        </div>
                      )}

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => openJobModal(job)}
                        >
                          {jobTitle}
                        </h3>

                        {/* Company and Location */}
                        {(company || location) && (
                          <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                            {company && (
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {company}
                              </span>
                            )}
                            {location && (
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {location}
                              </span>
                            )}
                            {salary && (
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
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
                                {salary}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Technical Skills */}
                        {job.technicalSkills &&
                          job.technicalSkills.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {job.technicalSkills
                                  .slice(0, 4)
                                  .map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                {job.technicalSkills.length > 4 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                    +{job.technicalSkills.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Job Description */}
                        <div className="text-gray-700 leading-relaxed mb-4">
                          <p>
                            {truncateText(job.originalPost || job.content, 200)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-6">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span className="text-sm font-medium">
                            {likesCount}
                          </span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            {commentsCount}
                          </span>
                        </button>
                        <button
                          onClick={() => openJobModal(job)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span className="text-sm">View Details</span>
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

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={closeJobModal}
      />
    </div>
  );
}
