import { NextRequest, NextResponse } from 'next/server';
import { getTeams, createTeam } from '@/lib/database';

export async function GET() {
  try {
    const teams = await getTeams();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      slack_webhook_url, 
      enabled = true,
      send_critical = true,
      send_high = true,
      send_medium = false,
      send_low = false,
      send_help_request = true,
      send_bug_report = true,
      send_feature_request = false,
      send_complaint = true,
      send_urgent_issue = true,
      send_feedback = false,
      send_question = false,
      send_documentation_issue = false,
      send_general_discussion = false,
      send_resolved = false,
      send_other = false,
      only_needs_response = false
    } = body;

    if (!name || !description || !slack_webhook_url) {
      return NextResponse.json(
        { error: 'Name, description, and Slack webhook URL are required' },
        { status: 400 }
      );
    }

    const team = await createTeam({
      name,
      description,
      slack_webhook_url,
      enabled,
      send_critical,
      send_high,
      send_medium,
      send_low,
      send_help_request,
      send_bug_report,
      send_feature_request,
      send_complaint,
      send_urgent_issue,
      send_feedback,
      send_question,
      send_documentation_issue,
      send_general_discussion,
      send_resolved,
      send_other,
      only_needs_response
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

