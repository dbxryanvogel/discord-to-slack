import { NextResponse } from 'next/server';
import { getRecentMessageLogs, getMessageLogStats, getMessageLogsNeedingResponse } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const needsResponse = searchParams.get('needs_response') === 'true';

    let messageLogs;
    if (needsResponse) {
      messageLogs = await getMessageLogsNeedingResponse();
    } else {
      messageLogs = await getRecentMessageLogs(limit, offset);
    }

    const stats = await getMessageLogStats();

    return NextResponse.json({
      messageLogs,
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
