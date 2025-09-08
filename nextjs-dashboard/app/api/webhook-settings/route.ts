import { NextResponse } from 'next/server';
import { getWebhookSettings, updateWebhookSettings } from '@/lib/database';

export async function GET() {
  try {
    const settings = await getWebhookSettings();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Error fetching webhook settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updatedSettings = await updateWebhookSettings(body);
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating webhook settings:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook settings' },
      { status: 500 }
    );
  }
}
