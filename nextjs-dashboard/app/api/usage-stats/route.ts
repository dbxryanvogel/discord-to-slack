import { NextResponse } from 'next/server';
import { getUsageStats, getUsageByModel, getTopChannelsByUsage, getDailyUsageStats } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const [overallStats, modelUsage, topChannels, dailyStats] = await Promise.all([
      getUsageStats(startDate, endDate),
      getUsageByModel(startDate, endDate),
      getTopChannelsByUsage(5),
      getDailyUsageStats(7)
    ]);

    return NextResponse.json({
      overallStats,
      modelUsage,
      topChannels,
      dailyStats
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}
