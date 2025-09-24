"use client";

import { useState } from "react";
import type { FacebookGroup } from "@/types";

interface GroupsManagerProps {
  groups: FacebookGroup[];
  onUpdate: () => void;
}

export default function GroupsManager({
  groups,
  onUpdate,
}: GroupsManagerProps) {
  const [newGroupUrl, setNewGroupUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FacebookGroup | null>(null);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupUrl.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [newGroupUrl.trim()] }),
      });

      const result = await response.json();
      if (result.success) {
        setNewGroupUrl("");
        onUpdate();
      } else {
        alert(`Error: ${result.error || "Failed to add group"}`);
      }
    } catch (error) {
      alert("Failed to add group");
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      const response = await fetch("/api/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: [groupId] }),
      });

      const result = await response.json();
      if (result.success) {
        onUpdate();
      } else {
        alert(`Failed to delete group: ${result.error}`);
      }
    } catch (error) {
      alert("Failed to delete group");
      console.error(error);
    }
  };

  const handleToggleActive = async (group: FacebookGroup) => {
    try {
      const response = await fetch(`/api/groups/${group._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...group, isActive: !group.isActive }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert("Failed to update group");
      }
    } catch (error) {
      alert("Failed to update group");
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Add New Group Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Add New Facebook Group
          </h3>
        </div>
        <form
          onSubmit={handleAddGroup}
          className="flex flex-col sm:flex-row gap-4"
        >
          <input
            type="url"
            value={newGroupUrl}
            onChange={(e) => setNewGroupUrl(e.target.value)}
            placeholder="https://www.facebook.com/groups/your-group/"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            required
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={isAdding}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            {isAdding ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </div>
            ) : (
              "Add Group"
            )}
          </button>
        </form>
      </div>

      {/* Groups List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md">
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
            <h3 className="text-2xl font-bold text-gray-900">
              Facebook Groups
            </h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {groups.length} {groups.length === 1 ? "group" : "groups"}
            </span>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
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
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              No groups configured
            </h4>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start by adding your first Facebook group to begin monitoring job
              posts and opportunities.
            </p>
            <button
              onClick={() => {
                const input = document.querySelector(
                  'input[type="url"]'
                ) as HTMLInputElement;
                input?.focus();
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Add Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {groups.map((group) => (
              <div
                key={group._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          group.isActive
                            ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <h4 className="text-3xl font-bold text-gray-900">
                        {group.name.replace(/^Facebook Group\s*/i, "")}
                      </h4>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          group.isActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {group.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <a
                      href={group.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 inline-flex items-center gap-1"
                    >
                      {group.url}
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(group)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                        group.isActive
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200"
                      }`}
                    >
                      {group.isActive ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => setEditingGroup(group)}
                      className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-xl transition-all duration-200 border border-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.groupId)}
                      className="px-4 py-2 text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 rounded-xl transition-all duration-200 border border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6 rounded-2xl border border-blue-200 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-600/5 rounded-full translate-y-8 -translate-x-8"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                            Posts Scraped
                          </div>
                        </div>
                      </div>
                      <div className="text-3xl font-black text-blue-900 mb-2">
                        {group.totalPostsScraped.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(
                                100,
                                (group.totalPostsScraped / 100) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-blue-700 font-semibold">
                          {group.totalPostsScraped > 50
                            ? "High"
                            : group.totalPostsScraped > 20
                            ? "Medium"
                            : "Low"}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-2 font-medium">
                        Total posts collected from this group
                      </div>
                    </div>
                  </div>

                  {group.lastScraped && (
                    <div className="relative bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 p-6 rounded-2xl border border-emerald-200 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-600/10 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-600/5 rounded-full translate-y-8 -translate-x-8"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide">
                              Last Scraped
                            </div>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-emerald-900 mb-1">
                          {new Date(group.lastScraped).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-sm font-semibold text-emerald-800 mb-3">
                          {new Date(group.lastScraped).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full animate-pulse ${
                              new Date().getTime() -
                                new Date(group.lastScraped).getTime() <
                              3600000
                                ? "bg-emerald-500"
                                : new Date().getTime() -
                                    new Date(group.lastScraped).getTime() <
                                  86400000
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span
                            className={`text-xs font-semibold ${
                              new Date().getTime() -
                                new Date(group.lastScraped).getTime() <
                              3600000
                                ? "text-emerald-700"
                                : new Date().getTime() -
                                    new Date(group.lastScraped).getTime() <
                                  86400000
                                ? "text-yellow-700"
                                : "text-red-700"
                            }`}
                          >
                            {new Date().getTime() -
                              new Date(group.lastScraped).getTime() <
                            3600000
                              ? "Recently Active"
                              : new Date().getTime() -
                                  new Date(group.lastScraped).getTime() <
                                86400000
                              ? "Active Today"
                              : "Needs Update"}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-600 mt-2 font-medium">
                          {(() => {
                            const timeDiff =
                              new Date().getTime() -
                              new Date(group.lastScraped).getTime();
                            const hours = Math.floor(
                              timeDiff / (1000 * 60 * 60)
                            );
                            const days = Math.floor(
                              timeDiff / (1000 * 60 * 60 * 24)
                            );

                            if (hours < 1) return "Just scraped";
                            if (hours < 24)
                              return `${hours} hour${hours > 1 ? "s" : ""} ago`;
                            if (days < 7)
                              return `${days} day${days > 1 ? "s" : ""} ago`;
                            return "More than a week ago";
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {group.memberCount && (
                    <div className="relative bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 p-6 rounded-2xl border border-purple-200 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-purple-600/10 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-600/5 rounded-full translate-y-8 -translate-x-8"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg">
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
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                              />
                            </svg>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-purple-600 font-medium uppercase tracking-wide">
                              Members
                            </div>
                          </div>
                        </div>
                        <div className="text-3xl font-black text-purple-900 mb-2">
                          {group.memberCount.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-4 rounded-full ${
                                  i <
                                  Math.min(
                                    5,
                                    Math.ceil(
                                      ((group.memberCount || 0) / 50000) * 5
                                    )
                                  )
                                    ? "bg-purple-500"
                                    : "bg-purple-200"
                                }`}
                              ></div>
                            ))}
                          </div>
                          <span className="text-xs text-purple-700 font-semibold ml-2">
                            {(group.memberCount || 0) > 10000
                              ? "Large"
                              : (group.memberCount || 0) > 1000
                              ? "Medium"
                              : "Small"}
                          </span>
                        </div>
                        <div className="text-xs text-purple-600 mt-2 font-medium">
                          {(group.memberCount || 0) > 50000
                            ? "Very active community"
                            : (group.memberCount || 0) > 10000
                            ? "Active community"
                            : "Growing community"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Edit Group</h3>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editingGroup.name}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter group name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingGroup.description || ""}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Add a description for this group (optional)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setEditingGroup(null)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/groups/${editingGroup._id}`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(editingGroup),
                        }
                      );

                      if (response.ok) {
                        setEditingGroup(null);
                        onUpdate();
                      } else {
                        alert("Failed to update group");
                      }
                    } catch (error) {
                      alert("Failed to update group");
                      console.error(error);
                    }
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
