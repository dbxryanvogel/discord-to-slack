import { NextResponse } from 'next/server';
import { createSearchIndexes } from '@/lib/database';

export async function POST() {
  try {
    await createSearchIndexes();
    return NextResponse.json({ success: true, message: 'Search indexes created successfully' });
  } catch (error) {
    console.error('Error creating search indexes:', error);
    return NextResponse.json(
      { error: 'Failed to create search indexes' },
      { status: 500 }
    );
  }
}
