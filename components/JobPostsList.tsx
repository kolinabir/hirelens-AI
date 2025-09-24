"use client";

import { useState } from "react";
import Image from "next/image";
import type { JobPost } from "@/types";

interface JobPostsListProps {
  jobs: JobPost[];
}

export default function JobPostsList({ jobs }: JobPostsListProps) {
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "engagement">("date");

  const filteredJobs = jobs
    .filter((job) => {
      if (!filter) return true;
      const searchText = filter.toLowerCase();
      
      // Support both old and new job structures
      const authorName = job.user?.name || job.author?.name || '';
      const jobTitle = job.jobTitle || job.jobDetails?.title || '';
      const company = job.company || job.jobDetails?.company || '';
      const content = job.originalPost || job.content || '';
      
      return (
        content.toLowerCase().includes(searchText) ||
        authorName.toLowerCase().includes(searchText) ||
        job.groupName?.toLowerCase().includes(searchText) ||
        jobTitle.toLowerCase().includes(searchText) ||
        company.toLowerCase().includes(searchText)
      );
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const aDate = a.extractedAt || a.postedDate;
        const bDate = b.extractedAt || b.postedDate;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      } else {
        const aEngagement = (a.likesCount || a.engagementMetrics?.likes || 0) + 
                           (a.commentsCount || a.engagementMetrics?.comments || 0);
        const bEngagement = (b.likesCount || b.engagementMetrics?.likes || 0) + 
                           (b.commentsCount || b.engagementMetrics?.comments || 0);
        return bEngagement - aEngagement;
      }
    });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(date);
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getProfileImageUrl = (job: JobPost) => {
    // Try to get profile image from various sources
    return job.author?.profileImage || 
           (job.apifyData?.user?.id ? `https://graph.facebook.com/${job.apifyData.user.id}/picture?type=large` : null);
  };

  const getProfileUrl = (job: JobPost) => {
    return job.author?.profileUrl || 
           (job.apifyData?.user?.id ? `https://facebook.com/${job.apifyData.user.id}` : null);
  };

  const getPostUrl = (job: JobPost) => {
    return job.postUrl || 
           job.facebookUrl || 
           job.apifyData?.facebookUrl ||
           null;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search jobs by content, author, company, or title..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "date" | "engagement")
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="engagement">Sort by Engagement</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredJobs.length} of {jobs.length} job posts
        </div>
      </div>

      {/* Job Posts */}
      <div className="space-y-6">
        {filteredJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
            {jobs.length === 0
              ? "No job posts found. Run the scraper to get job posts."
              : "No job posts match your search criteria."}
          </div>
        ) : (
          filteredJobs.map((job) => {
            // Determine if this is a structured job
            const isStructured = !!job.postUrl && !!job.extractedAt;
            
            // Get display values for both old and new structures
            const displayName = job.user?.name || job.author?.name || 'Unknown User';
            const displayTitle = job.jobTitle || job.jobDetails?.title || 'Job Post';
            const displayCompany = job.company || job.jobDetails?.company;
            const displayLocation = job.location || job.jobDetails?.location;
            const displayContent = job.originalPost || job.content || '';
            const displayDate = job.extractedAt || job.postedDate;
            const displayLikes = job.likesCount || job.engagementMetrics?.likes || 0;
            const displayComments = job.commentsCount || job.engagementMetrics?.comments || 0;
            const displayShares = job.engagementMetrics?.shares || 0;
            const displaySalary = job.salary || job.jobDetails?.salary;
            const displayType = job.employmentType || job.jobDetails?.type;
            
            const profileImageUrl = getProfileImageUrl(job);
            const profileUrl = getProfileUrl(job);
            const postUrl = getPostUrl(job);

            return (
              <div
                key={job._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 overflow-hidden"
              >
                {/* Header Section */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Author Profile */}
                      <div className="flex-shrink-0">
                        {profileImageUrl ? (
                          <div className="relative">
                            <Image
                              src={profileImageUrl}
                              alt={displayName}
                              width={56}
                              height={56}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg hidden">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Author Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {profileUrl ? (
                            <a
                              href={profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {displayName}
                            </a>
                          ) : (
                            <h4 className="font-semibold text-gray-900">{displayName}</h4>
                          )}
                          {isStructured && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              ✨ AI Enhanced
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{job.groupName}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(displayDate)}</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            job.source === "apify"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-50 text-gray-700"
                          }`}>
                            {job.source}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {postUrl && (
                        <a
                          href={postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View original post"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                    {displayTitle}
                  </h3>

                  {/* Job Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {displayCompany && (
                      <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-medium text-gray-900 truncate">{displayCompany}</span>
                      </div>
                    )}
                    {displayLocation && (
                      <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium text-gray-900 truncate">{displayLocation}</span>
                      </div>
                    )}
                    {displayType && (
                      <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                        </svg>
                        <span className="font-medium text-gray-900 capitalize truncate">{displayType}</span>
                      </div>
                    )}
                    {displaySalary && (
                      <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="font-medium text-gray-900 truncate">{displaySalary}</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Job Info */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.experienceLevel && (
                      <span className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                        {job.experienceLevel}
                      </span>
                    )}
                    {job.remoteOption && (
                      <span className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full border border-green-200">
                        Remote Available
                      </span>
                    )}
                    {job.genderEligibility && (
                      <span className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                        {job.genderEligibility}
                      </span>
                    )}
                  </div>

                  {/* Technical Skills */}
                  {job.technicalSkills && job.technicalSkills.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</h5>
                      <div className="flex flex-wrap gap-1">
                        {job.technicalSkills.slice(0, 8).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.technicalSkills.length > 8 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                            +{job.technicalSkills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="text-gray-700 mb-4 leading-relaxed">
                    {job.jobSummary ? (
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Job Summary:</p>
                        <p className="text-sm">{truncateText(job.jobSummary, 200)}</p>
                      </div>
                    ) : (
                      <p className="text-sm">{truncateText(displayContent, 250)}</p>
                    )}
                    {(displayContent.length > 250 || job.jobSummary) && (
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Read full description →
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    {/* Engagement Metrics */}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 9V5a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H14zM12 17v2H8v-2h4zm2-8V5a1 1 0 0 0-2 0v4h2z"/>
                        </svg>
                        <span className="font-medium">{displayLikes}</span>
                        <span>likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        <span className="font-medium">{displayComments}</span>
                        <span>comments</span>
                      </div>
                      {displayShares > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                          </svg>
                          <span className="font-medium">{displayShares}</span>
                          <span>shares</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedJob.jobTitle || selectedJob.jobDetails?.title || 'Job Details'}
                </h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Job Summary */}
                {selectedJob.jobSummary && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700">{selectedJob.jobSummary}</p>
                  </div>
                )}

                {/* Original Post */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Original Post</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedJob.originalPost || selectedJob.content}
                  </p>
                </div>

                {/* Technical Skills */}
                {selectedJob.technicalSkills && selectedJob.technicalSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.technicalSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Responsibilities */}
                {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedJob.responsibilities.map((resp, index) => (
                        <li key={index}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Benefits</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedJob.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* How to Apply */}
                {selectedJob.howToApply && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Apply</h3>
                    <p className="text-gray-700">{selectedJob.howToApply}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
