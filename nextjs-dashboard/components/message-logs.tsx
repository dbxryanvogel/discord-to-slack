'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageLog, MessageLogStats } from '@/lib/types';
import { MessageDetailsDialog } from './message-details-dialog';

interface MessageLogsData {
  messageLogs: MessageLog[];
  stats: MessageLogStats;
}

export function MessageLogsComponent() {
  const [data, setData] = useState<MessageLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNeedsResponse, setShowNeedsResponse] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const url = showNeedsResponse ? '/api/message-logs?needs_response=true' : '/api/message-logs';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch message logs');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [showNeedsResponse]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSupportStatusColor = (status: string) => {
    switch (status) {
      case 'urgent_issue': return 'destructive';
      case 'bug_report': return 'destructive';
      case 'help_request': return 'default';
      case 'feature_request': return 'default';
      case 'resolved': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleRowClick = (message: MessageLog) => {
    setSelectedMessage(message);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading message logs...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { messageLogs, stats } = data;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_messages?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.needs_response_count?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.critical_count?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(Number(stats?.avg_sentiment) || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Message Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Message Logs</CardTitle>
          <CardDescription>Recent Discord messages analyzed by AI</CardDescription>
          <div className="flex gap-2">
            <Button 
              variant={!showNeedsResponse ? 'default' : 'outline'}
              onClick={() => setShowNeedsResponse(false)}
            >
              All Messages
            </Button>
            <Button 
              variant={showNeedsResponse ? 'default' : 'outline'}
              onClick={() => setShowNeedsResponse(true)}
            >
              Needs Response
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Mood</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messageLogs?.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(log)}
                >
                  <TableCell className="text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{log.author_tag}</TableCell>
                  <TableCell>#{log.channel_name}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(log.priority)}>
                      {log.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSupportStatusColor(log.support_status)}>
                      {log.support_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={Number(log.sentiment_score) > 0 ? 'default' : 'destructive'}>
                      {(Number(log.sentiment_score) || 0).toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={log.summary}>
                    {log.summary}
                  </TableCell>
                  <TableCell>
                    <span title={log.customer_mood_description}>
                      {log.customer_mood_emoji}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MessageDetailsDialog
        message={selectedMessage}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
