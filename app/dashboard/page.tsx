"use client";

import { useState, useEffect } from "react";
import type { DashboardStats, FacebookGroup, JobPost } from "@/types";

// Components
import GroupsManager from "@/components/GroupsManager";
import JobPostsList from "@/components/JobPostsList";
import ScraperStatus from "@/components/ScraperStatus";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "groups" | "jobs" | "scraper"
  >("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [statsRes, groupsRes, jobsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/groups"),
        fetch("/api/jobs?limit=50"),
      ]);

      const [statsResult, groupsResult, jobsResult] = await Promise.all([
        statsRes.json(),
        groupsRes.json(),
        jobsRes.json(),
      ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      }

      if (groupsResult.success) {
        setGroups(groupsResult.data);
      }

      if (jobsResult.data) {
        setJobs(jobsResult.data);
      }
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupsUpdate = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchDashboardData}
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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Job Scraper Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your Facebook group scraping operations
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "groups", label: "Groups", icon: "👥" },
              { id: "jobs", label: "Job Posts", icon: "💼" },
              { id: "scraper", label: "Scraper", icon: "🤖" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Total Jobs
                      </h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {stats.totalJobs}
                      </p>
                    </div>
                    <div className="text-4xl">💼</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Active Groups
                      </h3>
                      <p className="text-3xl font-bold text-green-600">
                        {stats.activeGroups}
                      </p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Jobs Today
                      </h3>
                      <p className="text-3xl font-bold text-purple-600">
                        {stats.totalJobs}
                      </p>
                    </div>
                    <div className="text-4xl">📅</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        This Week
                      </h3>
                      <p className="text-3xl font-bold text-orange-600">
                        {stats.totalJobs}
                      </p>
                    </div>
                    <div className="text-4xl">📈</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("scraper")}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-medium">Start Scraping</div>
                  <div className="text-sm text-gray-600">Run manual scrape</div>
                </button>

                <button
                  onClick={() => setActiveTab("groups")}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-medium">Add Groups</div>
                  <div className="text-sm text-gray-600">
                    Manage Facebook groups
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("jobs")}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <div className="text-2xl mb-2">👀</div>
                  <div className="font-medium">View Jobs</div>
                  <div className="text-sm text-gray-600">Browse job posts</div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Groups</h3>
                {groups.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No groups added yet
                  </p>
                ) : (
                  groups.slice(0, 5).map((group) => (
                    <div
                      key={group._id}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-gray-600">
                          {group.totalPostsScraped} posts
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          group.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {group.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
                {jobs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No jobs found yet
                  </p>
                ) : (
                  jobs.slice(0, 5).map((job) => (
                    <div
                      key={job._id}
                      className="py-2 border-b last:border-b-0"
                    >
                      <div className="font-medium truncate">
                        {job.jobTitle || job.jobDetails?.title || "Untitled Job"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {job.user?.name || job.author?.name || "Unknown"} •{" "}
                        {new Date(job.extractedAt || job.postedDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Update</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.lastUpdate
                      ? new Date(stats.lastUpdate).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Scraping Status</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stats?.activeSessions && stats.activeSessions > 0
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {stats?.activeSessions && stats.activeSessions > 0
                      ? "Running"
                      : "Idle"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "groups" && (
          <GroupsManager groups={groups} onUpdate={handleGroupsUpdate} />
        )}

        {activeTab === "jobs" && <JobPostsList jobs={jobs} />}

        {activeTab === "scraper" && (
          <ScraperStatus onUpdate={handleGroupsUpdate} />
        )}
      </div>
    </div>
  );
}
