'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UsageStats, ModelUsage, ChannelUsage, DailyUsageStats } from '@/lib/types';

interface UsageStatsData {
  overallStats: UsageStats;
  modelUsage: ModelUsage[];
  topChannels: ChannelUsage[];
  dailyStats: DailyUsageStats[];
}

export function UsageStatsComponent() {
  const [data, setData] = useState<UsageStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/usage-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch usage stats');
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
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
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

  const { overallStats, modelUsage, topChannels } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_messages?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_tokens?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(Number(overallStats?.total_cost) || 0).toFixed(4)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(Number(overallStats?.avg_cost_per_message) || 0).toFixed(6)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Model</CardTitle>
          <CardDescription>Token usage and costs broken down by AI model</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Total Tokens</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Avg Processing Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelUsage?.map((model) => (
                <TableRow key={model.model}>
                  <TableCell className="font-medium">{model.model}</TableCell>
                  <TableCell>{model.message_count.toLocaleString()}</TableCell>
                  <TableCell>{model.total_tokens.toLocaleString()}</TableCell>
                  <TableCell>${(Number(model.total_cost) || 0).toFixed(4)}</TableCell>
                  <TableCell>{Math.round(Number(model.avg_processing_time) || 0)}ms</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Top Channels by Cost</CardTitle>
          <CardDescription>Channels with the highest AI processing costs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Server</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Avg Sentiment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topChannels?.map((channel) => (
                <TableRow key={channel.channel_id}>
                  <TableCell className="font-medium">#{channel.channel_name}</TableCell>
                  <TableCell>{channel.server_name}</TableCell>
                  <TableCell>{channel.message_count.toLocaleString()}</TableCell>
                  <TableCell>${(Number(channel.total_cost) || 0).toFixed(4)}</TableCell>
                  <TableCell>
                    <Badge variant={Number(channel.avg_sentiment) > 0 ? 'default' : 'destructive'}>
                      {(Number(channel.avg_sentiment) || 0).toFixed(2)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
