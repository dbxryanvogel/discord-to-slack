'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageLog, MessageLogsResponse, MessageLogFilters } from '@/lib/types';
import { MessageDetailsDialog } from './message-details-dialog';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export function MessageLogsComponent() {
  const [data, setData] = useState<MessageLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNeedsResponse, setShowNeedsResponse] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<MessageLogFilters>({
    search: '',
    priority: '',
    supportStatus: '',
    tone: '',
    channelId: '',
    authorId: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (showNeedsResponse) {
        params.append('needs_response', 'true');
      } else {
        params.append('limit', ITEMS_PER_PAGE.toString());
        params.append('offset', ((currentPage - 1) * ITEMS_PER_PAGE).toString());
        
        if (filters.search) params.append('search', filters.search);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.supportStatus) params.append('support_status', filters.supportStatus);
        if (filters.tone) params.append('tone', filters.tone);
        if (filters.channelId) params.append('channel_id', filters.channelId);
        if (filters.authorId) params.append('author_id', filters.authorId);
      }

      const response = await fetch(`/api/message-logs?${params}`);
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
  }, [showNeedsResponse, currentPage, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: keyof MessageLogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      priority: '',
      supportStatus: '',
      tone: '',
      channelId: '',
      authorId: ''
    });
    setCurrentPage(1);
  };

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

  const { messageLogs, stats, total = 0, hasMore = false } = data;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Ensure messageLogs is an array
  const logsArray = Array.isArray(messageLogs) ? messageLogs : [];

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
          <CardDescription>
            {showNeedsResponse 
              ? 'Messages that need response' 
              : `${total.toLocaleString()} total messages`
            }
          </CardDescription>
          
          {/* View Toggle */}
          <div className="flex gap-2 mb-4">
            <Button 
              variant={!showNeedsResponse ? 'default' : 'outline'}
              onClick={() => {
                setShowNeedsResponse(false);
                setCurrentPage(1);
              }}
            >
              All Messages
            </Button>
            <Button 
              variant={showNeedsResponse ? 'default' : 'outline'}
              onClick={() => {
                setShowNeedsResponse(true);
                setCurrentPage(1);
              }}
            >
              Needs Response
            </Button>
          </div>

          {/* Search and Filters */}
          {!showNeedsResponse && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search messages, authors, channels, or summaries..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select value={filters.priority || "all"} onValueChange={(value) => handleFilterChange('priority', value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.supportStatus || "all"} onValueChange={(value) => handleFilterChange('supportStatus', value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="help_request">Help Request</SelectItem>
                    <SelectItem value="bug_report">Bug Report</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="urgent_issue">Urgent Issue</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.tone || "all"} onValueChange={(value) => handleFilterChange('tone', value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tones</SelectItem>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="frustrated">Frustrated</SelectItem>
                    <SelectItem value="angry">Angry</SelectItem>
                    <SelectItem value="confused">Confused</SelectItem>
                    <SelectItem value="grateful">Grateful</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
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
              {logsArray.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {loading ? 'Loading messages...' : 'No messages found'}
                  </TableCell>
                </TableRow>
              ) : (
                logsArray.map((log) => (
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
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!showNeedsResponse && totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total.toLocaleString()} messages
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
