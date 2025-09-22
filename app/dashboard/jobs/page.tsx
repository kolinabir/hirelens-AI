'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { JobPost, PaginatedResponse, JobFilters } from '@/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<JobPost>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc',
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
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            queryParams.set(key, value.join(','));
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
      setError('Failed to fetch jobs');
      console.error('Jobs fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: keyof JobFilters, value: string | string[] | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const deleteJob = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this job post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs?id=${postId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchJobs(); // Refresh the list
      } else {
        alert('Failed to delete job post');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete job post');
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
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
                {pagination ? `${pagination.total} total jobs found` : 'Loading...'}
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.keywords || ''}
                onChange={(e) => handleFilterChange('keywords', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={filters.jobType?.[0] || ''}
                onChange={(e) => handleFilterChange('jobType', e.target.value ? [e.target.value] : undefined)}
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
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
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
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="engagement-desc">Most Engagement</option>
                <option value="engagement-asc">Least Engagement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
            <p className="text-gray-500 mb-6">
              No job posts match your current filters. Try adjusting your search criteria.
            </p>
            <button
              onClick={() => setFilters({ page: 1, limit: 20, sortBy: 'date', sortOrder: 'desc' })}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.postId} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                {/* Job Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {job.jobDetails.title || 'Job Opportunity'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>👤 {job.author.name}</span>
                      <span>👥 {job.groupName}</span>
                      <span>📅 {formatDate(job.postedDate)}</span>
                      {job.jobDetails.company && (
                        <span>🏢 {job.jobDetails.company}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.jobDetails.type && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.jobDetails.type === 'full-time'
                          ? 'bg-green-100 text-green-800'
                          : job.jobDetails.type === 'part-time'
                          ? 'bg-blue-100 text-blue-800'
                          : job.jobDetails.type === 'contract'
                          ? 'bg-purple-100 text-purple-800'
                          : job.jobDetails.type === 'freelance'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.jobDetails.type}
                      </span>
                    )}
                    <button
                      onClick={() => deleteJob(job.postId)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete job post"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Job Content */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">
                    {truncateText(job.content, 300)}
                  </p>
                </div>

                {/* Job Details */}
                {(job.jobDetails.location || job.jobDetails.salary) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {job.jobDetails.location && (
                        <div>
                          <span className="font-medium text-gray-700">📍 Location:</span>
                          <span className="ml-1 text-gray-600">{job.jobDetails.location}</span>
                        </div>
                      )}
                      {job.jobDetails.salary && (
                        <div>
                          <span className="font-medium text-gray-700">💰 Salary:</span>
                          <span className="ml-1 text-gray-600">{job.jobDetails.salary}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>👍 {job.engagementMetrics.likes}</span>
                    <span>💬 {job.engagementMetrics.comments}</span>
                    <span>📤 {job.engagementMetrics.shares}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Scraped: {formatDate(job.scrapedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
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
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = Math.max(1, pagination.page - 2) + i;
                  if (page > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        page === pagination.page
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
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