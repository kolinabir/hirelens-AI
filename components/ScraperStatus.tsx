"use client";

import { useState, useEffect, useCallback } from "react";

interface ScrapingStatus {
  runningProcesses: Array<{
    runId: string;
    status: string;
    startedAt: string;
    elapsedTime: string;
  }>;
  recentRuns: Array<{
    runId: string;
    status: string;
    startedAt: string;
    finishedAt: string;
    duration: string;
    itemsScraped: number;
  }>;
}

interface ScraperStatusProps {
  onUpdate: () => void;
}

export default function ScraperStatus({ onUpdate }: ScraperStatusProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<ScrapingStatus | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    maxPosts: 10,
    scrapeComments: false,
    scrapePhotos: true,
    timeout: 60,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/scraping/status");
      if (response.ok) {
        const result = await response.json();
        setStatus(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const result = await response.json();
        setGroups(result.data || []);
        if (result.data?.length > 0) {
          setSelectedGroups([result.data[0].url]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchGroups();

    // Poll status every 5 seconds when running
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchGroups]);

  const startScraping = async () => {
    if (selectedGroups.length === 0) {
      alert("Please select at least one group to scrape");
      return;
    }

    setIsRunning(true);
    setLogs((prev) => [
      ...prev,
      `🚀 Starting scraping for ${selectedGroups.length} group(s)...`,
    ]);

    try {
      const response = await fetch("/api/scraping/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupUrls: selectedGroups,
          maxPosts: settings.maxPosts,
          scrapeComments: settings.scrapeComments,
          scrapePhotos: settings.scrapePhotos,
          timeout: settings.timeout,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setLogs((prev) => [
          ...prev,
          `✅ Scraping completed successfully`,
          result.message
            ? `ℹ️ ${result.message}`
            : `📊 Summary: processed ${
                result?.jobExtraction?.savedJobs ??
                result?.data?.jobExtraction?.savedJobs ??
                0
              } jobs`,
        ]);
        // Append detailed progress logs if provided by the API
        const providedLogs: string[] = result?.data?.progressLogs;
        if (Array.isArray(providedLogs) && providedLogs.length > 0) {
          setLogs((prev) => [...prev, ...providedLogs]);
        }
        onUpdate();
        fetchStatus();
      } else {
        setLogs((prev) => [
          ...prev,
          `❌ Error: ${
            typeof result.error === "string" ? result.error : "Unknown error"
          }`,
        ]);
      }
    } catch (error) {
      setLogs((prev) => [...prev, `❌ Error: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const abortScraping = async () => {
    try {
      const response = await fetch("/api/scraping/abort", {
        method: "POST",
      });

      const result = await response.json();
      if (result.success) {
        setLogs((prev) => [...prev, "🛑 Scraping processes aborted"]);
        fetchStatus();
      } else {
        setLogs((prev) => [...prev, `❌ Failed to abort: ${result.error}`]);
      }
    } catch (error) {
      setLogs((prev) => [...prev, `❌ Abort error: ${error}`]);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
        return "bg-blue-100 text-blue-800";
      case "succeeded":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "aborted":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
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
            <h3 className="text-xl font-semibold text-gray-900">
              Scraping Status
            </h3>
          </div>
          <button
            onClick={fetchStatus}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
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

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Running Processes */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  Running Processes
                </h4>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {status.runningProcesses.length}
                </span>
              </div>
              {status.runningProcesses.length === 0 ? (
                <p className="text-gray-500 text-sm">No active processes</p>
              ) : (
                <div className="space-y-2">
                  {status.runningProcesses.map((process) => (
                    <div
                      key={process.runId}
                      className="p-3 bg-white rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-blue-800">
                          {process.runId.substring(0, 12)}...
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            process.status
                          )}`}
                        >
                          {process.status}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        Running for {process.elapsedTime}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Runs */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Recent Runs</h4>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  {status.recentRuns.length}
                </span>
              </div>
              {status.recentRuns.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent runs</p>
              ) : (
                <div className="space-y-2">
                  {status.recentRuns.slice(0, 3).map((run) => (
                    <div
                      key={run.runId}
                      className="p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-gray-700">
                          {run.runId.substring(0, 12)}...
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            run.status
                          )}`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {run.itemsScraped} items • {run.duration} •{" "}
                        {formatDateTime(run.finishedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scraping Configuration */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg
              className="w-6 h-6 text-green-600"
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
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Scraping Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Group Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Groups to Scrape
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {groups.length === 0 ? (
                <div className="text-center py-4">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-2"
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
                  <p className="text-gray-500 text-sm">No groups available</p>
                  <p className="text-gray-400 text-xs">
                    Add groups in the Groups tab first
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {groups.map((group) => (
                    <label
                      key={group._id}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.url)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups((prev) => [...prev, group.url]);
                          } else {
                            setSelectedGroups((prev) =>
                              prev.filter((url) => url !== group.url)
                            );
                          }
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {group.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {group.totalPostsScraped} posts scraped
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Posts per Group
                </label>
                <input
                  type="number"
                  value={settings.maxPosts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      maxPosts: parseInt(e.target.value) || 10,
                    }))
                  }
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={settings.timeout}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      timeout: parseInt(e.target.value) || 60,
                    }))
                  }
                  min="10"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={settings.scrapePhotos}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      scrapePhotos: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Scrape Photos
                  </span>
                  <p className="text-xs text-gray-500">
                    Include images and attachments from posts
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={settings.scrapeComments}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      scrapeComments: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Scrape Comments
                  </span>
                  <p className="text-xs text-gray-500">
                    Include comments from posts (slower)
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={startScraping}
            disabled={isRunning || selectedGroups.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running...
              </>
            ) : (
              <>
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
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Start Scraping
              </>
            )}
          </button>

          {status?.runningProcesses.length > 0 && (
            <button
              onClick={abortScraping}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium shadow-sm"
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
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10h6m-6 4h6"
                />
              </svg>
              Abort All
            </button>
          )}

          <button
            onClick={() => setLogs([])}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium shadow-sm"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear Logs
          </button>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg
              className="w-6 h-6 text-purple-600"
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
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Activity Logs</h3>
        </div>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-600 mx-auto mb-2"
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
              <p className="text-gray-500">No activity yet</p>
              <p className="text-gray-600 text-xs mt-1">
                Start scraping to see logs here
              </p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-2">
                <span className="text-gray-500">
                  [{new Date().toLocaleTimeString()}]
                </span>{" "}
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
