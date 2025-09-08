'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { WebhookSettings } from '@/lib/types';
import { Save, TestTube } from 'lucide-react';

export function WebhookSettingsComponent() {
  const [settings, setSettings] = useState<WebhookSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/webhook-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/webhook-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!settings.slack_webhook_url) {
      setError('Please enter a webhook URL first');
      return;
    }

    try {
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(result.error || 'Webhook test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Webhook test failed');
    }
  };

  const updateSetting = (key: keyof WebhookSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading webhook settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-600">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Slack Webhook Configuration</CardTitle>
          <CardDescription>
            Configure your Slack webhook to receive notifications for Discord messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Slack Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={settings.slack_webhook_url || ''}
              onChange={(e) => updateSetting('slack_webhook_url', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="webhook-enabled"
              checked={settings.webhook_enabled || false}
              onCheckedChange={(checked) => updateSetting('webhook_enabled', checked)}
            />
            <Label htmlFor="webhook-enabled">Enable webhook notifications</Label>
          </div>


          <div className="flex gap-2">
            <Button onClick={testWebhook} variant="outline" disabled={!settings.slack_webhook_url}>
              <TestTube className="h-4 w-4 mr-2" />
              Test Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Priority Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Filters</CardTitle>
          <CardDescription>Choose which priority levels should trigger webhooks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="send-critical"
                checked={settings.send_critical !== false}
                onCheckedChange={(checked) => updateSetting('send_critical', checked)}
              />
              <Label htmlFor="send-critical">Critical</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-high"
                checked={settings.send_high !== false}
                onCheckedChange={(checked) => updateSetting('send_high', checked)}
              />
              <Label htmlFor="send-high">High</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-medium"
                checked={settings.send_medium || false}
                onCheckedChange={(checked) => updateSetting('send_medium', checked)}
              />
              <Label htmlFor="send-medium">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-low"
                checked={settings.send_low || false}
                onCheckedChange={(checked) => updateSetting('send_low', checked)}
              />
              <Label htmlFor="send-low">Low</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Filters</CardTitle>
          <CardDescription>Set sentiment score thresholds for webhook triggers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-sentiment">Minimum Sentiment Score</Label>
              <Input
                id="min-sentiment"
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={settings.min_sentiment_score ?? -1.0}
                onChange={(e) => updateSetting('min_sentiment_score', parseFloat(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Send if sentiment ≤ this value (negative emotions)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-sentiment">Maximum Sentiment Score</Label>
              <Input
                id="max-sentiment"
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={settings.max_sentiment_score ?? 1.0}
                onChange={(e) => updateSetting('max_sentiment_score', parseFloat(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Send if sentiment ≥ this value (very positive feedback)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Status Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Support Status Filters</CardTitle>
          <CardDescription>Choose which types of support requests should trigger webhooks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="send-help-request"
                checked={settings.send_help_request !== false}
                onCheckedChange={(checked) => updateSetting('send_help_request', checked)}
              />
              <Label htmlFor="send-help-request">Help Request</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-bug-report"
                checked={settings.send_bug_report !== false}
                onCheckedChange={(checked) => updateSetting('send_bug_report', checked)}
              />
              <Label htmlFor="send-bug-report">Bug Report</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-feature-request"
                checked={settings.send_feature_request || false}
                onCheckedChange={(checked) => updateSetting('send_feature_request', checked)}
              />
              <Label htmlFor="send-feature-request">Feature Request</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-complaint"
                checked={settings.send_complaint !== false}
                onCheckedChange={(checked) => updateSetting('send_complaint', checked)}
              />
              <Label htmlFor="send-complaint">Complaint</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-urgent-issue"
                checked={settings.send_urgent_issue !== false}
                onCheckedChange={(checked) => updateSetting('send_urgent_issue', checked)}
              />
              <Label htmlFor="send-urgent-issue">Urgent Issue</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-feedback"
                checked={settings.send_feedback || false}
                onCheckedChange={(checked) => updateSetting('send_feedback', checked)}
              />
              <Label htmlFor="send-feedback">Feedback</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-question"
                checked={settings.send_question || false}
                onCheckedChange={(checked) => updateSetting('send_question', checked)}
              />
              <Label htmlFor="send-question">Question</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-documentation-issue"
                checked={settings.send_documentation_issue || false}
                onCheckedChange={(checked) => updateSetting('send_documentation_issue', checked)}
              />
              <Label htmlFor="send-documentation-issue">Documentation Issue</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Options */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Options</CardTitle>
          <CardDescription>Extra filtering and configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="only-needs-response"
              checked={settings.only_needs_response || false}
              onCheckedChange={(checked) => updateSetting('only_needs_response', checked)}
            />
            <Label htmlFor="only-needs-response">Only send for messages that need a response</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for these settings..."
              value={settings.description || ''}
              onChange={(e) => updateSetting('description', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
