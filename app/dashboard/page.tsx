"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DashboardStats } from "@/types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/stats");
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || "Failed to fetch stats");
      }
    } catch (err) {
      setError("Failed to fetch dashboard stats");
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
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
              onClick={fetchStats}
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
              <h1 className="text-3xl font-bold text-gray-900">
                Facebook Job Scraper Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor and manage your job scraping operations
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard/jobs"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Jobs
              </Link>
              <Link
                href="/dashboard/groups"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Manage Groups
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Jobs"
            value={stats?.totalJobs || 0}
            icon="📋"
            color="blue"
          />
          <StatsCard
            title="Today's Jobs"
            value={stats?.todayJobs || 0}
            icon="📈"
            color="green"
          />
          <StatsCard
            title="Active Groups"
            value={stats?.activeGroups || 0}
            icon="👥"
            color="purple"
          />
          <StatsCard
            title="Active Sessions"
            value={stats?.activeSessions || 0}
            icon="⚡"
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/jobs"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <h3 className="font-medium text-gray-900">View All Jobs</h3>
                  <p className="text-sm text-gray-500">
                    Browse scraped job posts
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/groups"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">👥</span>
                <div>
                  <h3 className="font-medium text-gray-900">Manage Groups</h3>
                  <p className="text-sm text-gray-500">
                    Add or remove Facebook groups
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/scraping"
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <h3 className="font-medium text-gray-900">Start Scraping</h3>
                  <p className="text-sm text-gray-500">
                    Begin a new scraping session
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              System Status
            </h2>
          </div>
          <div className="p-6">
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
      </main>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
