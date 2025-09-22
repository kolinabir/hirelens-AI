import { NextRequest, NextResponse } from 'next/server';
import { dbConnection, DatabaseUtils } from '@/lib/database';
import { groupNavigator } from '@/lib/group-navigator';
import { apiLogger } from '@/lib/logger';
import type { FacebookGroup } from '@/types';

export async function GET() {
  try {
    await dbConnection.connect();
    
    const groups = await DatabaseUtils.findGroups({ isActive: true });
    
    apiLogger.info(`📋 Retrieved ${groups.length} groups`);
    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    apiLogger.error('❌ Error fetching groups:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch groups' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnection.connect();
    
    const body = await request.json();
    const { urls } = body;
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'URLs array is required' 
        },
        { status: 400 }
      );
    }

    // Validate URLs
    const { valid, invalid } = await groupNavigator.validateGroupUrls(urls);
    
    if (invalid.length > 0) {
      apiLogger.warn(`⚠️ Invalid URLs provided: ${invalid.join(', ')}`);
    }

    const addedGroups: FacebookGroup[] = [];
    const errors: string[] = [];

    // Add each valid group
    for (const url of valid) {
      try {
        const groupId = url.replace(/[^\w]/g, '_');
        const now = new Date();
        
        const newGroup: Omit<FacebookGroup, '_id'> = {
          groupId,
          name: `Group ${groupId}`, // Will be updated when scraped
          url,
          isActive: true,
          totalPostsScraped: 0,
          createdAt: now,
          updatedAt: now,
        };

        const insertedId = await DatabaseUtils.insertGroup(newGroup);
        addedGroups.push({ ...newGroup, _id: insertedId });
        
        apiLogger.info(`✅ Added group: ${url}`);
      } catch (error) {
        const errorMsg = `Failed to add group ${url}: ${error}`;
        errors.push(errorMsg);
        apiLogger.error(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        added: addedGroups,
        invalid,
        errors,
      },
    });
  } catch (error) {
    apiLogger.error('❌ Error adding groups:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to add groups' 
      },
      { status: 500 }
    );
  }
}