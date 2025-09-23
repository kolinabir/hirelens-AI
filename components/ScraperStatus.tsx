"use client";

import { useState, useEffect } from "react";

interface ScraperStatusProps {
  onUpdate: () => void;
}

interface ScraperProcess {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  datasetId?: string;
}

interface ScraperState {
  running: ScraperProcess[];
  total: number;
  recentRuns: ScraperProcess[];
  lastScrapeTime?: Date;
  nextScheduledScrape?: Date;
}

export default function ScraperStatus({ onUpdate }: ScraperStatusProps) {
  const [scraperState, setScraperState] = useState<ScraperState | null>(null);
  const [isManualScraping, setIsManualScraping] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScraperStatus();
    const interval = setInterval(fetchScraperStatus, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchScraperStatus = async () => {
    try {
      const response = await fetch("/api/scraping/abort");
      const result = await response.json();

      if (result.success) {
        setScraperState(result.data);

        // Get last scrape time from recent runs
        if (result.data.recentRuns?.length > 0) {
          const lastRun = result.data.recentRuns[0];
          if (lastRun.finishedAt) {
            setScraperState((prev) => ({
              ...prev!,
              lastScrapeTime: new Date(lastRun.finishedAt!),
            }));
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch scraper status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScrape = async () => {
    setIsManualScraping(true);
    try {
      const response = await fetch("/api/scraping/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual" }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Manual scrape started successfully!");
        fetchScraperStatus();
        onUpdate();
      } else {
        alert(`Error: ${result.error || "Failed to start scrape"}`);
      }
    } catch (error) {
      alert("Failed to start manual scrape");
      console.error(error);
    } finally {
      setIsManualScraping(false);
    }
  };

  const handleAbortAll = async () => {
    if (
      !confirm("Are you sure you want to abort all running scraper processes?")
    )
      return;

    try {
      const response = await fetch("/api/scraping/abort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abortAll: true }),
      });

      const result = await response.json();
      if (result.success) {
        alert("All running processes aborted successfully!");
        fetchScraperStatus();
      } else {
        alert(`Error: ${result.error || "Failed to abort processes"}`);
      }
    } catch (error) {
      alert("Failed to abort processes");
      console.error(error);
    }
  };

  const handleProcessResults = async () => {
    try {
      const response = await fetch("/api/scraping/process", {
        method: "POST",
      });

      const result = await response.json();
      if (result.success) {
        alert(
          `Processing completed! ${
            result.data?.processed || 0
          } new posts added.`
        );
        onUpdate();
      } else {
        alert(`Error: ${result.error || "Failed to process results"}`);
      }
    } catch (error) {
      alert("Failed to process results");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Scraper Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Running Processes</div>
            <div className="text-2xl font-bold text-blue-600">
              {scraperState?.total || 0}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Last Scrape</div>
            <div className="text-sm font-medium">
              {scraperState?.lastScrapeTime
                ? new Date(scraperState.lastScrapeTime).toLocaleString()
                : "Never"}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Recent Runs</div>
            <div className="text-2xl font-bold text-green-600">
              {scraperState?.recentRuns?.length || 0}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleManualScrape}
            disabled={isManualScraping || (scraperState?.total || 0) > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isManualScraping ? "Starting..." : "Start Manual Scrape"}
          </button>

          <button
            onClick={handleProcessResults}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Process Results
          </button>

          {(scraperState?.total || 0) > 0 && (
            <button
              onClick={handleAbortAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Abort All Processes
            </button>
          )}

          <button
            onClick={fetchScraperStatus}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Running Processes */}
      {scraperState && scraperState.running.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4">Running Processes</h4>
          <div className="space-y-3">
            {scraperState.running.map(
              (process: ScraperProcess, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      Process {process.id || index + 1}
                    </div>
                    <div className="text-sm text-gray-600">
                      Started: {new Date(process.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/scraping/abort", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ runId: process.id }),
                        });

                        if (response.ok) {
                          fetchScraperStatus();
                        }
                      } catch (error) {
                        console.error("Failed to abort process:", error);
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Abort
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Recent Runs */}
      {scraperState && scraperState.recentRuns.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4">Recent Runs</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Run ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Finished
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scraperState.recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {run.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          run.status === "SUCCEEDED"
                            ? "bg-green-100 text-green-800"
                            : run.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : run.status === "ABORTED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.finishedAt
                        ? new Date(run.finishedAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
