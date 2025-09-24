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
      // Basic filters
      groupId: searchParams.get("groupId") || undefined,
      keywords: searchParams.get("keywords") || undefined,
      location: searchParams.get("location") || undefined,
      company: searchParams.get("company") || undefined,

      // Employment & Experience
      jobType: searchParams.get("jobType")?.split(",") || undefined,
      experienceLevel: searchParams.get("experienceLevel") || undefined,
      salaryRange: searchParams.get("salaryRange") || undefined,
      workType: searchParams.get("workType") || undefined,

      // Skills & Requirements
      skills: searchParams.get("skills") || undefined,

      // Date filters
      dateRange: searchParams.get("dateRange") || undefined,

      // Advanced options
      hasAttachments: searchParams.get("hasAttachments") === "true",
      hasDeadline: searchParams.get("hasDeadline") === "true",
      hasContact: searchParams.get("hasContact") === "true",
      highEngagement: searchParams.get("highEngagement") === "true",

      // Sorting & Pagination
      sortBy:
        (searchParams.get("sortBy") as
          | "date"
          | "engagement"
          | "relevance"
          | "title"
          | "company"
          | "likes") || "date",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),

      // Quality filter
      structuredOnly: searchParams.get("structuredOnly") === "true",
    };

    // Parse legacy date range format
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

    // Basic filters
    if (filters.groupId) {
      docFilter.groupId = filters.groupId;
    }

    if (filters.keywords) {
      // Search in multiple fields
      docFilter["$or"] = [
        { jobTitle: { $regex: filters.keywords, $options: "i" } },
        { company: { $regex: filters.keywords, $options: "i" } },
        { location: { $regex: filters.keywords, $options: "i" } },
        { content: { $regex: filters.keywords, $options: "i" } },
        { originalPost: { $regex: filters.keywords, $options: "i" } },
        { technicalSkills: { $in: [new RegExp(filters.keywords, "i")] } },
        { "jobDetails.title": { $regex: filters.keywords, $options: "i" } },
        { "jobDetails.company": { $regex: filters.keywords, $options: "i" } },
        {
          "jobDetails.description": { $regex: filters.keywords, $options: "i" },
        },
      ];
    }

    if (filters.location) {
      docFilter["$or"] = [
        ...((docFilter["$or"] as any[]) || []),
        { location: { $regex: filters.location, $options: "i" } },
        { "jobDetails.location": { $regex: filters.location, $options: "i" } },
      ];
    }

    if (filters.company) {
      docFilter["$or"] = [
        ...((docFilter["$or"] as any[]) || []),
        { company: { $regex: filters.company, $options: "i" } },
        { "jobDetails.company": { $regex: filters.company, $options: "i" } },
      ];
    }

    // Employment & Experience filters
    if (filters.jobType && filters.jobType.length > 0) {
      docFilter["$or"] = [
        ...((docFilter["$or"] as any[]) || []),
        { employmentType: { $in: filters.jobType } },
        { "jobDetails.type": { $in: filters.jobType } },
      ];
    }

    if (filters.experienceLevel) {
      docFilter["experienceLevel"] = {
        $regex: filters.experienceLevel,
        $options: "i",
      };
    }

    if (filters.salaryRange) {
      // Parse salary range like "30000-50000" or "120000+"
      if (filters.salaryRange.includes("-")) {
        const [min, max] = filters.salaryRange
          .split("-")
          .map((s) => parseInt(s));
        docFilter["$or"] = [
          ...((docFilter["$or"] as any[]) || []),
          { salary: { $regex: `\\b(${min}|${max})\\b`, $options: "i" } },
          {
            "jobDetails.salary": {
              $regex: `\\b(${min}|${max})\\b`,
              $options: "i",
            },
          },
        ];
      } else if (filters.salaryRange.includes("+")) {
        const min = parseInt(filters.salaryRange.replace("+", ""));
        docFilter["$or"] = [
          ...((docFilter["$or"] as any[]) || []),
          { salary: { $regex: `\\b${min}\\b`, $options: "i" } },
          { "jobDetails.salary": { $regex: `\\b${min}\\b`, $options: "i" } },
        ];
      }
    }

    if (filters.workType) {
      const workTypeRegex =
        filters.workType === "remote"
          ? "remote|work from home|wfh"
          : filters.workType === "onsite"
          ? "onsite|office|on-site"
          : filters.workType === "hybrid"
          ? "hybrid"
          : filters.workType;

      docFilter["$or"] = [
        ...((docFilter["$or"] as any[]) || []),
        { content: { $regex: workTypeRegex, $options: "i" } },
        { originalPost: { $regex: workTypeRegex, $options: "i" } },
        { remoteOption: filters.workType === "remote" },
        { onsiteRequired: filters.workType === "onsite" },
      ];
    }

    // Skills filter
    if (filters.skills) {
      const skillsArray = filters.skills
        .split(",")
        .map((skill) => skill.trim());
      docFilter["$or"] = [
        ...((docFilter["$or"] as any[]) || []),
        {
          technicalSkills: {
            $in: skillsArray.map((skill) => new RegExp(skill, "i")),
          },
        },
        {
          softSkills: {
            $in: skillsArray.map((skill) => new RegExp(skill, "i")),
          },
        },
        {
          "jobDetails.requirements": {
            $in: skillsArray.map((skill) => new RegExp(skill, "i")),
          },
        },
      ];
    }

    // Date range filter
    if (filters.dateRange) {
      if (typeof filters.dateRange === "string") {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "3months":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        docFilter.scrapedAt = { $gte: startDate };
      } else if (filters.dateRange.from && filters.dateRange.to) {
        docFilter.scrapedAt = {
          $gte: filters.dateRange.from,
          $lte: filters.dateRange.to,
        };
      }
    }

    // Advanced options
    if (filters.hasAttachments) {
      docFilter["attachments"] = { $exists: true, $ne: [] };
    }

    if (filters.hasDeadline) {
      docFilter["applicationDeadline"] = { $exists: true, $ne: "" };
    }

    if (filters.hasContact) {
      docFilter["$or"] = [
        ...((docFilter["$or"] as any[]) || []),
        { howToApply: { $exists: true, $ne: "" } },
        { applicationMethods: { $exists: true, $ne: [] } },
        { "jobDetails.contactInfo": { $exists: true, $ne: "" } },
      ];
    }

    if (filters.highEngagement) {
      docFilter["$or"] = [
        ...((docFilter["$or"] as any[]) || []),
        { likesCount: { $gte: 10 } },
        { "engagementMetrics.likes": { $gte: 10 } },
      ];
    }

    // Structured-only filter
    if (filters.structuredOnly) {
      docFilter["$and"] = [
        ...((docFilter["$and"] as any[]) || []),
        {
          $or: [
            { postUrl: { $exists: true, $ne: "" } },
            { extractedAt: { $exists: true } },
          ],
        },
      ];
    }

    // Pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    // Sort spec
    const sortDirection: SortDirection = filters.sortOrder === "asc" ? 1 : -1;
    let sortSpec: Sort = {};

    switch (filters.sortBy) {
      case "title":
        sortSpec = {
          jobTitle: sortDirection,
          "jobDetails.title": sortDirection,
        };
        break;
      case "company":
        sortSpec = {
          company: sortDirection,
          "jobDetails.company": sortDirection,
        };
        break;
      case "likes":
      case "engagement":
        sortSpec = {
          likesCount: sortDirection,
          "engagementMetrics.likes": sortDirection,
        };
        break;
      case "date":
      default:
        sortSpec = filters.structuredOnly
          ? { extractedAt: sortDirection, scrapedAt: sortDirection }
          : { scrapedAt: sortDirection };
        break;
    }

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
