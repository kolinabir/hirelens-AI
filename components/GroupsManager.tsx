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
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert("Failed to delete group");
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
    <div className="space-y-6">
      {/* Add New Group Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add New Facebook Group</h3>
        <form onSubmit={handleAddGroup} className="flex gap-4">
          <input
            type="url"
            value={newGroupUrl}
            onChange={(e) => setNewGroupUrl(e.target.value)}
            placeholder="https://www.facebook.com/groups/your-group/"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={isAdding}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add Group"}
          </button>
        </form>
      </div>

      {/* Groups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Facebook Groups ({groups.length})
          </h3>
        </div>

        {groups.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No groups added yet. Add your first Facebook group above.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groups.map((group) => (
              <div key={group._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {group.name}
                      </h4>
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

                    <p className="text-sm text-gray-600 mb-2">{group.url}</p>

                    <div className="text-sm text-gray-500 space-y-1">
                      <div>Posts scraped: {group.totalPostsScraped}</div>
                      {group.lastScraped && (
                        <div>
                          Last scraped:{" "}
                          {new Date(group.lastScraped).toLocaleString()}
                        </div>
                      )}
                      {group.memberCount && (
                        <div>Members: {group.memberCount.toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(group)}
                      className={`px-3 py-1 text-sm rounded ${
                        group.isActive
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {group.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => setEditingGroup(group)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteGroup(group.groupId)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingGroup(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
