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
      return (
        job.content.toLowerCase().includes(searchText) ||
        job.author.name.toLowerCase().includes(searchText) ||
        job.groupName.toLowerCase().includes(searchText) ||
        job.jobDetails.title?.toLowerCase().includes(searchText) ||
        job.jobDetails.company?.toLowerCase().includes(searchText)
      );
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
        );
      } else {
        const aEngagement =
          a.engagementMetrics.likes + a.engagementMetrics.comments;
        const bEngagement =
          b.engagementMetrics.likes + b.engagementMetrics.comments;
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

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            {jobs.length === 0
              ? "No job posts found. Run the scraper to get job posts."
              : "No job posts match your search criteria."}
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {job.author.profileImage && (
                        <Image
                          src={job.author.profileImage}
                          alt={job.author.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {job.author.name}
                        </h4>
                        <p className="text-sm text-gray-500">{job.groupName}</p>
                      </div>
                    </div>

                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(job.postedDate)}
                    </span>

                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        job.source === "apify"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {job.source}
                    </span>
                  </div>

                  {/* Job Title */}
                  {job.jobDetails.title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {job.jobDetails.title}
                    </h3>
                  )}

                  {/* Job Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3 text-sm">
                    {job.jobDetails.company && (
                      <div>
                        <span className="text-gray-600">Company:</span>
                        <span className="ml-1 font-medium">
                          {job.jobDetails.company}
                        </span>
                      </div>
                    )}
                    {job.jobDetails.location && (
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-1 font-medium">
                          {job.jobDetails.location}
                        </span>
                      </div>
                    )}
                    {job.jobDetails.type && (
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-1 font-medium capitalize">
                          {job.jobDetails.type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="text-gray-700 mb-4">
                    {truncateText(job.content)}
                    {job.content.length > 200 && (
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Read more
                      </button>
                    )}
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>👍 {job.engagementMetrics.likes}</span>
                    <span>💬 {job.engagementMetrics.comments}</span>
                    <span>📤 {job.engagementMetrics.shares}</span>

                    {job.apifyData?.facebookUrl && (
                      <a
                        href={job.apifyData.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View on Facebook
                      </a>
                    )}
                  </div>
                </div>

                {/* Attachments Preview */}
                {job.apifyData?.attachments &&
                  job.apifyData.attachments.length > 0 && (
                    <div className="ml-4">
                      <div className="text-xs text-gray-500 mb-1">
                        {job.apifyData.attachments.length} attachment(s)
                      </div>
                      {job.apifyData.attachments
                        .slice(0, 2)
                        .map((attachment, index) => (
                          <div key={index} className="mb-2">
                            {attachment.photo_image && (
                              <Image
                                src={attachment.photo_image.uri}
                                alt="Attachment"
                                width={64}
                                height={64}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  )}
              </div>

              {/* Tags */}
              {job.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedJob.jobDetails.title || "Job Post Details"}
                  </h2>
                  <p className="text-gray-600">
                    by {selectedJob.author.name} in {selectedJob.groupName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Full Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Full Post Content
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedJob.content}
                  </div>
                </div>

                {/* Job Details */}
                {(selectedJob.jobDetails.company ||
                  selectedJob.jobDetails.location ||
                  selectedJob.jobDetails.salary) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Job Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      {selectedJob.jobDetails.company && (
                        <div>
                          <strong>Company:</strong>{" "}
                          {selectedJob.jobDetails.company}
                        </div>
                      )}
                      {selectedJob.jobDetails.location && (
                        <div>
                          <strong>Location:</strong>{" "}
                          {selectedJob.jobDetails.location}
                        </div>
                      )}
                      {selectedJob.jobDetails.salary && (
                        <div>
                          <strong>Salary:</strong>{" "}
                          {selectedJob.jobDetails.salary}
                        </div>
                      )}
                      {selectedJob.jobDetails.type && (
                        <div>
                          <strong>Type:</strong> {selectedJob.jobDetails.type}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {selectedJob.jobDetails.requirements &&
                  selectedJob.jobDetails.requirements.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Requirements
                      </h3>
                      <ul className="bg-gray-50 p-4 rounded-lg list-disc list-inside space-y-1">
                        {selectedJob.jobDetails.requirements.map(
                          (req, index) => (
                            <li key={index}>{req}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* Attachments */}
                {selectedJob.apifyData?.attachments &&
                  selectedJob.apifyData.attachments.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Attachments
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedJob.apifyData.attachments.map(
                          (attachment, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-2 rounded-lg"
                            >
                              {attachment.photo_image && (
                                <Image
                                  src={attachment.photo_image.uri}
                                  alt={`Attachment ${index + 1}`}
                                  width={400}
                                  height={128}
                                  className="w-full h-32 object-cover rounded"
                                />
                              )}
                              {attachment.ocrText && (
                                <p className="text-xs text-gray-600 mt-2">
                                  {attachment.ocrText}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Meta Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Meta Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                    <div>
                      <strong>Posted:</strong>{" "}
                      {formatDate(selectedJob.postedDate)}
                    </div>
                    <div>
                      <strong>Scraped:</strong>{" "}
                      {formatDate(selectedJob.scrapedAt)}
                    </div>
                    <div>
                      <strong>Source:</strong> {selectedJob.source}
                    </div>
                    <div>
                      <strong>Post ID:</strong> {selectedJob.postId}
                    </div>
                    {selectedJob.apifyData?.facebookUrl && (
                      <div>
                        <strong>Facebook URL:</strong>{" "}
                        <a
                          href={selectedJob.apifyData.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View on Facebook
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
