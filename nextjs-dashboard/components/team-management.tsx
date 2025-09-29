'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Team {
  id: number;
  name: string;
  description: string;
  slack_webhook_url: string;
  enabled: boolean;
  send_critical: boolean;
  send_high: boolean;
  send_medium: boolean;
  send_low: boolean;
  send_help_request: boolean;
  send_bug_report: boolean;
  send_feature_request: boolean;
  send_complaint: boolean;
  send_urgent_issue: boolean;
  send_feedback: boolean;
  send_question: boolean;
  send_documentation_issue: boolean;
  send_general_discussion: boolean;
  send_resolved: boolean;
  send_other: boolean;
  only_needs_response: boolean;
}

interface TeamManagementProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  team?: Team | null;
}

export function TeamManagement({ open, onClose, onSave, team }: TeamManagementProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slack_webhook_url: '',
    enabled: true,
    send_critical: true,
    send_high: true,
    send_medium: false,
    send_low: false,
    send_help_request: true,
    send_bug_report: true,
    send_feature_request: false,
    send_complaint: true,
    send_urgent_issue: true,
    send_feedback: false,
    send_question: false,
    send_documentation_issue: false,
    send_general_discussion: false,
    send_resolved: false,
    send_other: false,
    only_needs_response: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description,
        slack_webhook_url: team.slack_webhook_url,
        enabled: team.enabled,
        send_critical: team.send_critical,
        send_high: team.send_high,
        send_medium: team.send_medium,
        send_low: team.send_low,
        send_help_request: team.send_help_request,
        send_bug_report: team.send_bug_report,
        send_feature_request: team.send_feature_request,
        send_complaint: team.send_complaint,
        send_urgent_issue: team.send_urgent_issue,
        send_feedback: team.send_feedback,
        send_question: team.send_question,
        send_documentation_issue: team.send_documentation_issue,
        send_general_discussion: team.send_general_discussion,
        send_resolved: team.send_resolved,
        send_other: team.send_other,
        only_needs_response: team.only_needs_response,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        slack_webhook_url: '',
        enabled: true,
        send_critical: true,
        send_high: true,
        send_medium: false,
        send_low: false,
        send_help_request: true,
        send_bug_report: true,
        send_feature_request: false,
        send_complaint: true,
        send_urgent_issue: true,
        send_feedback: false,
        send_question: false,
        send_documentation_issue: false,
        send_general_discussion: false,
        send_resolved: false,
        send_other: false,
        only_needs_response: false,
      });
    }
    setError(null);
  }, [team, open]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.slack_webhook_url.trim()) {
      setError('Name, description, and Slack webhook URL are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = team ? `/api/teams/${team.id}` : '/api/teams';
      const method = team ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save team');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  const prioritySettings = [
    { key: 'send_critical', label: 'Critical', description: 'Urgent issues requiring immediate attention' },
    { key: 'send_high', label: 'High', description: 'Important issues that need prompt response' },
    { key: 'send_medium', label: 'Medium', description: 'Standard issues with moderate urgency' },
    { key: 'send_low', label: 'Low', description: 'Minor issues or general inquiries' },
  ];

  const supportStatusSettings = [
    { key: 'send_help_request', label: 'Help Request', description: 'Users asking for assistance' },
    { key: 'send_bug_report', label: 'Bug Report', description: 'Reports of technical issues' },
    { key: 'send_feature_request', label: 'Feature Request', description: 'Suggestions for new features' },
    { key: 'send_complaint', label: 'Complaint', description: 'User complaints or dissatisfaction' },
    { key: 'send_urgent_issue', label: 'Urgent Issue', description: 'Critical problems requiring immediate attention' },
    { key: 'send_feedback', label: 'Feedback', description: 'General user feedback or suggestions' },
    { key: 'send_question', label: 'Question', description: 'General questions or inquiries' },
    { key: 'send_documentation_issue', label: 'Documentation Issue', description: 'Problems with documentation' },
    { key: 'send_general_discussion', label: 'General Discussion', description: 'General conversation or discussion' },
    { key: 'send_resolved', label: 'Resolved', description: 'Issues that have been resolved' },
    { key: 'send_other', label: 'Other', description: 'Miscellaneous or uncategorized messages' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{team ? 'Edit Team' : 'Create New Team'}</DialogTitle>
          <DialogDescription>
            Configure a team for AI-powered message routing. The AI will use the team description to determine when to route messages to this team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., BaaS, Docs, Console Frontend"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Team Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this team does so the AI knows when to route messages to them..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="webhook">Slack Webhook URL</Label>
              <Input
                id="webhook"
                type="url"
                value={formData.slack_webhook_url}
                onChange={(e) => setFormData({ ...formData, slack_webhook_url: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable this team</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="only_needs_response"
                checked={formData.only_needs_response}
                onCheckedChange={(checked) => setFormData({ ...formData, only_needs_response: checked })}
              />
              <Label htmlFor="only_needs_response">Only send messages that need a response</Label>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Priority Levels</CardTitle>
              <CardDescription>
                Select which priority levels this team should receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {prioritySettings.map((setting) => (
                  <div key={setting.key} className="flex items-start space-x-3">
                    <Switch
                      id={setting.key}
                      checked={formData[setting.key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, [setting.key]: checked })
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor={setting.key} className="text-sm font-medium">
                        {setting.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Status Types</CardTitle>
              <CardDescription>
                Select which types of support messages this team should receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {supportStatusSettings.map((setting) => (
                  <div key={setting.key} className="flex items-start space-x-3">
                    <Switch
                      id={setting.key}
                      checked={formData[setting.key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, [setting.key]: checked })
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor={setting.key} className="text-sm font-medium">
                        {setting.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

