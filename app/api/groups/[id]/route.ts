import { NextRequest, NextResponse } from "next/server";
import { dbConnection, DatabaseUtils } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import type { FacebookGroup } from "@/types";

/**
 * @swagger
 * /api/groups/{id}:
 *   put:
 *     summary: Update a Facebook group
 *     description: Update an existing Facebook group's information
 *     tags:
 *       - Groups
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *           example:
 *             name: "DevJobs Community"
 *             description: "A community for developers to find job opportunities"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnection.connect();

    const groupId = params.id;
    const body = await request.json();

    // Find existing group
    const existingGroups = await DatabaseUtils.findGroups({ _id: groupId });
    if (existingGroups.length === 0) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    const existingGroup = existingGroups[0];

    // Update group data
    const updatedGroup: Partial<FacebookGroup> = {
      ...existingGroup,
      ...body,
      updatedAt: new Date(),
    };

    await DatabaseUtils.updateGroup(groupId, updatedGroup);

    apiLogger.info(`✅ Updated group: ${groupId}`);
    return NextResponse.json({
      success: true,
      data: updatedGroup,
      message: "Group updated successfully",
    });
  } catch (error) {
    apiLogger.error("❌ Error updating group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update group" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/groups/{id}:
 *   delete:
 *     summary: Delete a Facebook group
 *     description: Remove a Facebook group from the scraping list
 *     tags:
 *       - Groups
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnection.connect();

    const groupId = params.id;

    // Check if group exists
    const existingGroups = await DatabaseUtils.findGroups({ _id: groupId });
    if (existingGroups.length === 0) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    // Delete the group
    await DatabaseUtils.deleteGroup(groupId);

    apiLogger.info(`🗑️ Deleted group: ${groupId}`);
    return NextResponse.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    apiLogger.error("❌ Error deleting group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete group" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get a specific Facebook group
 *     description: Retrieve details of a specific Facebook group
 *     tags:
 *       - Groups
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID
 *     responses:
 *       200:
 *         description: Group details
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnection.connect();

    const groupId = params.id;
    const groups = await DatabaseUtils.findGroups({ _id: groupId });

    if (groups.length === 0) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    apiLogger.info(`📋 Retrieved group: ${groupId}`);
    return NextResponse.json({
      success: true,
      data: groups[0],
    });
  } catch (error) {
    apiLogger.error("❌ Error fetching group:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}
