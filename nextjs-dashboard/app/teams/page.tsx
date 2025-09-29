'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Trash2, Edit } from 'lucide-react';
import { TeamManagement } from '@/components/team-management';

interface Team {
  id: number;
  name: string;
  description: string;
  slack_webhook_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
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

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      setTeams(teams.filter(team => team.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const getPriorityBadges = (team: Team) => {
    const priorities = [];
    if (team.send_critical) priorities.push('Critical');
    if (team.send_high) priorities.push('High');
    if (team.send_medium) priorities.push('Medium');
    if (team.send_low) priorities.push('Low');
    return priorities;
  };

  const getSupportStatusCount = (team: Team) => {
    const statuses = [
      team.send_help_request,
      team.send_bug_report,
      team.send_feature_request,
      team.send_complaint,
      team.send_urgent_issue,
      team.send_feedback,
      team.send_question,
      team.send_documentation_issue,
      team.send_general_discussion,
      team.send_resolved,
      team.send_other
    ];
    return statuses.filter(Boolean).length;
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleTeamSaved = () => {
    fetchTeams();
    setShowCreateDialog(false);
    setEditingTeam(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading teams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Configure teams for AI-powered message routing
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first team to enable AI-powered message routing to specific Slack channels.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className={`${!team.enabled ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {team.name}
                      {!team.enabled && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {team.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Priority Levels</h4>
                    <div className="flex flex-wrap gap-1">
                      {getPriorityBadges(team).map((priority) => (
                        <Badge key={priority} variant="outline" className="text-xs">
                          {priority}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Support Types</h4>
                    <p className="text-sm text-muted-foreground">
                      {getSupportStatusCount(team)} types enabled
                    </p>
                  </div>

                  {team.only_needs_response && (
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        Only messages needing response
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTeam(team)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTeam(team.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TeamManagement
        open={showCreateDialog || !!editingTeam}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingTeam(null);
        }}
        onSave={handleTeamSaved}
        team={editingTeam}
      />
    </div>
  );
}

