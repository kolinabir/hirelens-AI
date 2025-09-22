import { NextResponse } from 'next/server';
import { dbConnection, DatabaseUtils } from '@/lib/database';
import { apiLogger } from '@/lib/logger';

export async function GET() {
  try {
    await dbConnection.connect();
    
    const stats = await DatabaseUtils.getDashboardStats();
    
    apiLogger.info('📊 Dashboard stats retrieved');
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    apiLogger.error('❌ Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard stats' 
      },
      { status: 500 }
    );
  }
}