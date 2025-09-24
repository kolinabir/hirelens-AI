import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "@/lib/database";
import { apiLogger } from "@/lib/logger";
import type { JobFilters, PaginatedResponse, JobPost } from "@/types";
import type { Filter, Sort, SortDirection } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    await dbConnection.connect();

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: JobFilters = {
      groupId: searchParams.get("groupId") || undefined,
      jobType: searchParams.get("jobType")?.split(",") || undefined,
      location: searchParams.get("location") || undefined,
      keywords: searchParams.get("keywords") || undefined,
      sortBy:
        (searchParams.get("sortBy") as "date" | "engagement" | "relevance") ||
        "date",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      structuredOnly:
        searchParams.get("structuredOnly") === "true" ? true : false,
    };

    // Parse date range
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    if (fromDate && toDate) {
      filters.dateRange = {
        from: new Date(fromDate),
        to: new Date(toDate),
      };
    }

    // Build filter as a generic record to support dot-notation keys
    const docFilter: Record<string, unknown> = { isDuplicate: { $ne: true } };

    if (filters.groupId) {
      docFilter.groupId = filters.groupId;
    }

    if (filters.dateRange) {
      docFilter.scrapedAt = {
        $gte: filters.dateRange.from,
        $lte: filters.dateRange.to,
      };
    }

    if (filters.jobType && filters.jobType.length > 0) {
      docFilter["jobDetails.type"] = { $in: filters.jobType };
    }

    if (filters.location) {
      docFilter["jobDetails.location"] = {
        $regex: filters.location,
        $options: "i",
      };
    }

    if (filters.keywords) {
      docFilter["$text"] = { $search: filters.keywords };
    }

    // Structured-only filter: include docs that have a resolvable postUrl or extractedAt
    if (filters.structuredOnly) {
      docFilter["$or"] = [
        { postUrl: { $exists: true } },
        { extractedAt: { $exists: true } },
      ];
    }

    // Pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    // Sort spec
    const sortDirection: SortDirection = filters.sortOrder === "asc" ? 1 : -1;
    const sortSpec: Sort = filters.structuredOnly
      ? { extractedAt: sortDirection, scrapedAt: sortDirection }
      : { scrapedAt: sortDirection };

    const collection = dbConnection.getJobsCollection();

    // Query with casts only at call sites
    const mongoFilter = docFilter as Filter<JobPost>;

    const [total, jobs] = await Promise.all([
      collection.countDocuments(mongoFilter),
      collection
        .find(mongoFilter)
        .sort(sortSpec)
        .limit(limit)
        .skip(skip)
        .toArray(),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<JobPost> = {
      data: jobs as unknown as JobPost[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    apiLogger.info(
      `📋 Retrieved ${jobs.length} jobs (page ${page}/${totalPages})`,
      { structuredOnly: filters.structuredOnly }
    );
    return NextResponse.json(response);
  } catch (error) {
    apiLogger.error("❌ Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnection.connect();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");
    const postUrl = searchParams.get("postUrl");

    if (!postId && !postUrl) {
      return NextResponse.json(
        { error: "Post ID or postUrl is required" },
        { status: 400 }
      );
    }

    const collection = dbConnection.getJobsCollection();

    const deleteFilter: Record<string, unknown> = postUrl
      ? { postUrl }
      : { postId };
    const deletedResult = await collection.deleteOne(
      deleteFilter as Filter<JobPost>
    );

    if (deletedResult.deletedCount && deletedResult.deletedCount > 0) {
      apiLogger.info(
        `🗑️ Deleted job post by ${postUrl ? "postUrl" : "postId"}: ${
          postUrl || postId
        }`
      );
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Job post not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    apiLogger.error("❌ Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
