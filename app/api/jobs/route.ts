import { NextRequest, NextResponse } from 'next/server';
import { dbConnection, DatabaseUtils } from '@/lib/database';
import { apiLogger } from '@/lib/logger';
import type { JobFilters, PaginatedResponse, JobPost } from '@/types';
import { Filter } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await dbConnection.connect();
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: JobFilters = {
      groupId: searchParams.get('groupId') || undefined,
      jobType: searchParams.get('jobType')?.split(',') || undefined,
      location: searchParams.get('location') || undefined,
      keywords: searchParams.get('keywords') || undefined,
      sortBy: (searchParams.get('sortBy') as 'date' | 'engagement' | 'relevance') || 'date',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Parse date range
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    if (fromDate && toDate) {
      filters.dateRange = {
        from: new Date(fromDate),
        to: new Date(toDate),
      };
    }

    // Build MongoDB filter
    const dbFilter: Filter<JobPost> = { isDuplicate: { $ne: true } };
    
    if (filters.groupId) {
      dbFilter.groupId = filters.groupId;
    }
    
    if (filters.dateRange) {
      dbFilter.scrapedAt = {
        $gte: filters.dateRange.from,
        $lte: filters.dateRange.to,
      };
    }
    
    if (filters.jobType && filters.jobType.length > 0) {
      dbFilter['jobDetails.type'] = { $in: filters.jobType };
    }
    
    if (filters.location) {
      dbFilter['jobDetails.location'] = { $regex: filters.location, $options: 'i' };
    }
    
    if (filters.keywords) {
      dbFilter.$text = { $search: filters.keywords };
    }

    // Calculate pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    // Get total count and data
    const [total, jobs] = await Promise.all([
      DatabaseUtils.countJobPosts(dbFilter),
      DatabaseUtils.findJobPosts(dbFilter, limit, skip),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<JobPost> = {
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    apiLogger.info(`📋 Retrieved ${jobs.length} jobs (page ${page}/${totalPages})`);
    return NextResponse.json(response);
  } catch (error) {
    apiLogger.error('❌ Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnection.connect();
    
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const deleted = await DatabaseUtils.deleteJobPost(postId);
    
    if (deleted) {
      apiLogger.info(`🗑️ Deleted job post: ${postId}`);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Job post not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    apiLogger.error('❌ Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}