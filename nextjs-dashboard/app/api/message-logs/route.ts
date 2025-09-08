import { NextResponse } from 'next/server';
import { getMessageLogs, getMessageLogStats, getMessageLogsNeedingResponse } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const needsResponse = searchParams.get('needs_response') === 'true';
    
    // Search and filter parameters
    const search = searchParams.get('search') || '';
    const priority = searchParams.get('priority') || '';
    const supportStatus = searchParams.get('support_status') || '';
    const tone = searchParams.get('tone') || '';
    const channelId = searchParams.get('channel_id') || '';
    const authorId = searchParams.get('author_id') || '';

    let result;
    if (needsResponse) {
      result = await getMessageLogsNeedingResponse();
      // For needs response, we don't paginate but we can still filter
      return NextResponse.json({
        messageLogs: result,
        total: result.length,
        hasMore: false,
        stats: (await getMessageLogStats())[0] || {}
      });
    } else {
      result = await getMessageLogs({
        limit,
        offset,
        search,
        priority,
        supportStatus,
        tone,
        channelId,
        authorId
      });
    }

    const stats = await getMessageLogStats();

    return NextResponse.json({
      messageLogs: result.logs,
      total: result.total,
      hasMore: result.hasMore,
      stats: stats[0] || {}
    });
  } catch (error) {
    console.error('Error fetching message logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message logs' },
      { status: 500 }
    );
  }
}
