"use client";

import { useState, useEffect, useCallback } from "react";
import type { TrackedWebsite } from "@/types";
import WebsiteJobsList from "./WebsiteJobsList";

interface WebsiteTrackerProps {
  onUpdate: () => void;
}

export default function WebsiteTracker({ onUpdate }: WebsiteTrackerProps) {
  const [websites, setWebsites] = useState<TrackedWebsite[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
    url: "",
    name: "",
    companyName: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [scraping, setScraping] = useState<string | null>(null); // websiteId being scraped
  const [showJobs, setShowJobs] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

  const fetchWebsites = useCallback(async () => {
    try {
      const response = await fetch("/api/websites");
      if (response.ok) {
        const result = await response.json();
        setWebsites(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch websites:", error);
    }
  }, []);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebsite.url || !newWebsite.name) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebsite),
      });

      const result = await response.json();
      if (result.success) {
        setMessage(`✅ Added ${newWebsite.name} to tracking`);
        setNewWebsite({ url: "", name: "", companyName: "" });
        fetchWebsites();
        onUpdate();
      } else {
        setMessage(`❌ Failed to add website: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error adding website: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebsite = async (websiteId: string, name: string) => {
    if (!confirm(`Are you sure you want to stop tracking "${name}"?`)) return;

    try {
      const response = await fetch("/api/websites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteIds: [websiteId] }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage(`✅ Stopped tracking ${name}`);
        fetchWebsites();
        onUpdate();
      } else {
        setMessage(`❌ Failed to delete website: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error deleting website: ${error}`);
    }
  };

  const handleScrapeWebsite = async (websiteId: string, name: string) => {
    setScraping(websiteId);
    setMessage(`🔄 Scraping ${name}...`);

    try {
      const response = await fetch("/api/websites/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });

      const result = await response.json();
      if (result.success) {
        const data = result.data.results[0];
        setMessage(
          `✅ Scraped ${name}: ${data.totalJobs} total jobs, ${data.newJobs} new jobs found`
        );
        fetchWebsites();
        onUpdate();
      } else {
        setMessage(`❌ Failed to scrape ${name}: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error scraping ${name}: ${error}`);
    } finally {
      setScraping(null);
    }
  };

  const handleScrapeAll = async () => {
    setScraping("all");
    setMessage("🔄 Scraping all active websites...");

    try {
      const response = await fetch("/api/websites/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapeAll: true }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage(
          `✅ Scraped ${result.data.websitesScraped} websites: ${result.data.totalNewJobs} new jobs found`
        );
        fetchWebsites();
        onUpdate();
      } else {
        setMessage(`❌ Failed to scrape websites: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error scraping websites: ${error}`);
    } finally {
      setScraping(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Website Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-600 rounded-lg">
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
          <h3 className="text-xl font-semibold text-gray-900">
            Add Website to Track
          </h3>
        </div>

        <form onSubmit={handleAddWebsite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL *
              </label>
              <input
                type="url"
                value={newWebsite.url}
                onChange={(e) =>
                  setNewWebsite((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://company.com/careers"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={newWebsite.name}
                onChange={(e) =>
                  setNewWebsite((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Company Careers"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={newWebsite.companyName}
                onChange={(e) =>
                  setNewWebsite((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                placeholder="Company Inc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              )}
              Add Website
            </button>
            {websites.length > 0 && (
              <button
                type="button"
                onClick={handleScrapeAll}
                disabled={scraping !== null}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {scraping === "all" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
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
                )}
                Scrape All Now
              </button>
            )}
          </div>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}
      </div>

      {/* Tracked Websites List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-600 rounded-lg">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Tracked Websites ({websites.length})
          </h3>
        </div>

        {websites.length === 0 ? (
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
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">
              No websites being tracked
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Add your first website to start monitoring job postings
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {websites.map((website) => (
              <div
                key={website._id?.toString()}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          website.isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></div>
                      <h4 className="font-semibold text-gray-900">
                        {website.name}
                      </h4>
                      {website.companyName && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {website.companyName}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {website.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Last scraped:{" "}
                        {website.lastScraped
                          ? new Date(website.lastScraped).toLocaleString()
                          : "Never"}
                      </span>
                      <span>{website.lastJobCount} jobs found</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleScrapeWebsite(
                          website._id?.toString() || "",
                          website.name
                        )
                      }
                      disabled={scraping !== null}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {scraping === website._id?.toString() ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Scrape Now"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWebsiteId(website._id?.toString() || "");
                        setShowJobs(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      View Jobs
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteWebsite(
                          website._id?.toString() || "",
                          website.name
                        )
                      }
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Jobs Display Section */}
      {showJobs && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedWebsiteId 
                ? `Jobs from ${websites.find(w => w._id?.toString() === selectedWebsiteId)?.name || 'Selected Website'}` 
                : 'All Website Jobs'
              }
            </h2>
            <div className="flex items-center space-x-3">
              {selectedWebsiteId && (
                <button
                  onClick={() => {
                    setSelectedWebsiteId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Show All Jobs
                </button>
              )}
              <button
                onClick={() => setShowJobs(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Hide Jobs
              </button>
            </div>
          </div>
          
          <WebsiteJobsList 
            websiteId={selectedWebsiteId || undefined}
            showAll={!selectedWebsiteId}
            limit={selectedWebsiteId ? 50 : 20}
          />
        </div>
      )}

      {/* Show All Jobs Button */}
      {!showJobs && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setSelectedWebsiteId(null);
              setShowJobs(true);
            }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5" />
            </svg>
            View All Scraped Jobs
          </button>
        </div>
      )}
    </div>
  );
}
