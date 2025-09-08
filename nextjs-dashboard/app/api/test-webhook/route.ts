import { NextResponse } from 'next/server';
import { getWebhookSettings } from '@/lib/database';

export async function POST() {
  try {
    const settings = await getWebhookSettings();
    
    if (!settings || !settings.slack_webhook_url) {
      return NextResponse.json(
        { error: 'No webhook URL configured' },
        { status: 400 }
      );
    }

    const testPayload = {
      text: 'Test message from Discord Bot Dashboard',
      attachments: [
        {
          color: '#36a64f',
          title: '🧪 Test Webhook',
          fields: [
            {
              title: 'Status',
              value: 'Webhook configuration is working!',
              short: false
            }
          ],
          footer: 'Discord Bot Dashboard',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    const response = await fetch(settings.slack_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test webhook sent successfully! Check your Slack channel.' 
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Webhook test failed: ${response.status} ${response.statusText} - ${errorText}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
