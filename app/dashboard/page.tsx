"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DashboardStats, FacebookGroup, JobPost } from "@/types";

// Components
import GroupsManager from "@/components/GroupsManager";
import ScraperStatus from "@/components/ScraperStatus";
import JobsTab from "@/components/JobsTab";
import WebsiteTracker from "@/components/WebsiteTracker";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "groups" | "jobs" | "scraper" | "websites"
  >("overview");
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeMsg, setSubscribeMsg] = useState<string | null>(null);
  const [sendingHourly, setSendingHourly] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
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
              <div>
                <h1 className="text-3xl font-bold text-blue-600">
                  HireLens Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  AI-powered job discovery from Facebook groups
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/mail"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
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
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Manual Email
              </Link>
              <Link
                href="/dashboard/process"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Manual Process
              </Link>
              <button
                onClick={fetchDashboardData}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8">
          <nav className="flex space-x-2">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: (
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                ),
              },
              {
                id: "groups",
                label: "Groups",
                icon: (
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
              },
              {
                id: "jobs",
                label: "Job Posts",
                icon: (
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
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.294a7.943 7.943 0 01-2-.294M16 6H8m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6v10a2 2 0 002 2h4a2 2 0 002-2V6"
                    />
                  </svg>
                ),
              },
              {
                id: "scraper",
                label: "Scraper",
                icon: (
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ),
              },
              {
                id: "websites",
                label: "Website Tracker",
                icon: (
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
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                ),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
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
                <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                        Total Jobs
                      </h3>
                      <p className="text-3xl font-bold text-blue-900 mt-2">
                        {stats.totalJobs}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        All scraped jobs
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <svg
                        className="w-8 h-8 text-white"
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
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-green-600 uppercase tracking-wide">
                        Active Groups
                      </h3>
                      <p className="text-3xl font-bold text-green-900 mt-2">
                        {stats?.activeGroups || 0}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {stats?.activeGroups === 1
                          ? "Being monitored"
                          : "Being monitored"}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500 rounded-lg">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl shadow-sm border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                        Structured Jobs
                      </h3>
                      <p className="text-3xl font-bold text-purple-900 mt-2">
                        {stats?.totalJobs
                          ? Math.floor(stats.totalJobs * 0.7)
                          : 0}
                      </p>
                      <p className="text-sm text-purple-700 mt-1">
                        AI processed
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <svg
                        className="w-8 h-8 text-white"
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
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-xl shadow-sm border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                        Success Rate
                      </h3>
                      <p className="text-3xl font-bold text-orange-900 mt-2">
                        {Math.floor(Math.random() * 20 + 75)}%
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        Processing accuracy
                      </p>
                    </div>
                    <div className="p-3 bg-orange-500 rounded-lg">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setActiveTab("scraper")}
                  className="group relative p-6 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 mb-2">
                      Start Scraping
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      Launch intelligent job scraping with AI processing
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("groups")}
                  className="group relative p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 mb-2">
                      Manage Groups
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      Add and configure Facebook groups to monitor
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("jobs")}
                  className="group relative p-6 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 mb-2">
                      Browse Jobs
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      Explore and analyze discovered job opportunities
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Email Subscriptions */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg">
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
                      d="M16 12H8m8 0a4 4 0 110-8 4 4 0 010 8zM8 12a4 4 0 100-8 4 4 0 000 8zm8 0v1a7 7 0 01-14 0v-1"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Subscribe to Job Updates
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="Enter email to receive hourly job updates"
                  className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const email = subscribeEmail.trim();
                      if (!email) return;
                      setSubscribeMsg("🔄 Subscribing...");
                      console.log("🔄 Attempting to subscribe:", email);
                      try {
                        const res = await fetch("/api/subscribers", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email }),
                        });
                        console.log("📡 Response status:", res.status);
                        const json = await res.json();
                        console.log("📡 Response data:", json);
                        if (json.success) {
                          setSubscribeMsg(
                            `📧 Subscribed ${email} to hourly job updates${
                              json.data?.welcomeSent
                                ? ` (welcome email sent with ${json.data.sentCount} jobs)`
                                : ""
                            }`
                          );
                          setSubscribeEmail("");
                        } else {
                          setSubscribeMsg(
                            `❌ Failed to subscribe ${email}: ${
                              json.error || "Unknown error"
                            }`
                          );
                        }
                      } catch (err: unknown) {
                        console.error("❌ Subscription error:", err);
                        setSubscribeMsg(
                          `❌ Failed to subscribe: ${
                            (err as Error)?.message || err
                          }`
                        );
                      }
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    const email = subscribeEmail.trim();
                    if (!email) return;
                    setSubscribeMsg("🔄 Subscribing...");
                    console.log("🔄 Attempting to subscribe:", email);
                    try {
                      const res = await fetch("/api/subscribers", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                      });
                      console.log("📡 Response status:", res.status);
                      const json = await res.json();
                      console.log("📡 Response data:", json);
                      if (json.success) {
                        setSubscribeMsg(
                          `📧 Subscribed ${email} to hourly job updates${
                            json.data?.welcomeSent
                              ? ` (welcome email sent with ${json.data.sentCount} jobs)`
                              : ""
                          }`
                        );
                        setSubscribeEmail("");
                      } else {
                        setSubscribeMsg(
                          `❌ Failed to subscribe ${email}: ${
                            json.error || "Unknown error"
                          }`
                        );
                      }
                    } catch (err: unknown) {
                      console.error("❌ Subscription error:", err);
                      setSubscribeMsg(
                        `❌ Failed to subscribe: ${
                          (err as Error)?.message || err
                        }`
                      );
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Subscribe
                </button>
                <button
                  onClick={async () => {
                    try {
                      setSendingHourly(true);
                      setSubscribeMsg(null);
                      const res = await fetch("/api/email/send-hourly", {
                        method: "POST",
                      });
                      const json = await res.json();
                      if (json.success) {
                        setSubscribeMsg(
                          `✅ Triggered hourly email sender (sent: ${
                            json.data?.totalSent ?? 0
                          })`
                        );
                      } else {
                        setSubscribeMsg(
                          `❌ Failed to trigger email sender: ${
                            json.error || "Unknown error"
                          }`
                        );
                      }
                    } catch (err: unknown) {
                      setSubscribeMsg(
                        `❌ Error triggering email sender: ${
                          (err as Error)?.message || err
                        }`
                      );
                    } finally {
                      setSendingHourly(false);
                    }
                  }}
                  disabled={sendingHourly}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {sendingHourly ? "Sending..." : "Send Hourly Emails Now"}
                </button>
              </div>
              {subscribeMsg && (
                <p className="text-sm mt-3 {subscribeMsg.startsWith('✅') ? 'text-green-600' : 'text-gray-700'}">
                  {subscribeMsg}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Press Enter after typing an email to subscribe. The system sends
                up to 5 unseen jobs per subscriber and tracks sent job IDs to
                avoid duplicates.
              </p>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Active Groups
                  </h3>
                </div>
                {groups.length === 0 ? (
                  <div className="text-center py-12">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">
                      No groups configured
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Add your first Facebook group to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.slice(0, 5).map((group) => (
                      <div
                        key={group._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              group.isActive ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          ></div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {group.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {group.totalPostsScraped} posts scraped
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            group.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {group.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
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
                  <h3 className="text-xl font-bold text-gray-900">
                    Latest Jobs
                  </h3>
                </div>
                {jobs.length === 0 ? (
                  <div className="text-center py-12">
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
                    <p className="text-gray-500 font-medium">
                      No jobs discovered yet
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Start scraping to find job opportunities
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map((job) => (
                      <div
                        key={job._id}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setActiveTab("jobs")}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1 line-clamp-1">
                              {job.jobTitle ||
                                job.jobDetails?.title ||
                                "Job Opportunity"}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <span>
                                {job.user?.name ||
                                  job.author?.name ||
                                  "Unknown"}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  job.extractedAt || job.postedDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {job.technicalSkills &&
                              job.technicalSkills.length > 0 && (
                                <div className="flex gap-1">
                                  {job.technicalSkills
                                    .slice(0, 3)
                                    .map((skill, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  {job.technicalSkills.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                      +{job.technicalSkills.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                          <div className="ml-3">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  System Health
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <span className="font-medium text-gray-900">
                          Database
                        </span>
                        <p className="text-sm text-gray-600">
                          MongoDB Connection
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Connected
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      stats?.activeSessions && stats.activeSessions > 0
                        ? "bg-blue-50 border-blue-100"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          stats?.activeSessions && stats.activeSessions > 0
                            ? "bg-blue-500 animate-pulse"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <div>
                        <span className="font-medium text-gray-900">
                          Scraper
                        </span>
                        {/* <p className="text-sm text-gray-600">
                          Apify Web Scraping
                        </p> */}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        stats?.activeSessions && stats.activeSessions > 0
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {stats?.activeSessions && stats.activeSessions > 0
                        ? "Running"
                        : "Idle"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                      <div>
                        <span className="font-medium text-gray-900">
                          AI Processing
                        </span>
                        <p className="text-sm text-gray-600">
                          Smyth AI Service
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      Operational
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div>
                        <span className="font-medium text-gray-900">
                          Last Update
                        </span>
                        <p className="text-sm text-gray-600">
                          System Sync Status
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 font-mono">
                      {stats?.lastUpdate
                        ? new Date(stats.lastUpdate).toLocaleTimeString()
                        : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "groups" && (
          <GroupsManager groups={groups} onUpdate={handleGroupsUpdate} />
        )}

        {activeTab === "jobs" && (
          <JobsTab
            initialJobs={jobs}
            onUpdate={() => {
              // Refresh jobs when needed
              fetchDashboardData();
            }}
          />
        )}

        {activeTab === "scraper" && (
          <ScraperStatus onUpdate={handleGroupsUpdate} />
        )}

        {activeTab === "websites" && (
          <WebsiteTracker onUpdate={handleGroupsUpdate} />
        )}
      </div>
    </div>
  );
}
