'use client';

import { MessageLog } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';

interface MessageDetailsDialogProps {
  message: MessageLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageDetailsDialog({ message, open, onOpenChange }: MessageDetailsDialogProps) {
  if (!message) return null;

  const discordUrl = `https://discord.com/channels/${message.server_id}/${message.channel_id}/${message.message_id}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Message from {message.author_tag}
            <span className="text-sm font-normal text-muted-foreground">
              {message.customer_mood_emoji}
            </span>
          </DialogTitle>
          <DialogDescription>
            #{message.channel_name} in {message.server_name} • {new Date(message.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message Content */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Message Content</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{message.message_content || 'No content available'}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(message.message_content || '')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(discordUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Discord
              </Button>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Analysis</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Priority:</span>
                  <Badge variant={getPriorityColor(message.priority)}>
                    {message.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={getSupportStatusColor(message.support_status)}>
                    {message.support_status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tone:</span>
                  <Badge variant="outline">{message.tone}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sentiment:</span>
                  <Badge variant={Number(message.sentiment_score) > 0 ? 'default' : 'destructive'}>
                    {(Number(message.sentiment_score) || 0).toFixed(2)} ({(Number(message.sentiment_confidence) || 0).toFixed(2)} confidence)
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Needs Response:</span>
                  <Badge variant={message.needs_response ? 'destructive' : 'secondary'}>
                    {message.needs_response ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Customer Mood</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{message.customer_mood_emoji}</span>
                  <span className="text-sm">{message.customer_mood_description}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {message.summary && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Summary</h3>
              <p className="text-sm text-muted-foreground">{message.summary}</p>
            </div>
          )}

          {/* Topics */}
          {message.topics && message.topics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {message.topics.map((topic, index) => (
                  <Badge key={index} variant="outline">{topic}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {message.suggested_actions && message.suggested_actions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Suggested Actions</h3>
              <ul className="list-disc list-inside space-y-1">
                {message.suggested_actions.map((action, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Technical Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant={message.has_code ? 'default' : 'secondary'}>
                {message.has_code ? 'Has Code' : 'No Code'}
              </Badge>
              <Badge variant={message.has_error ? 'destructive' : 'secondary'}>
                {message.has_error ? 'Has Error' : 'No Error'}
              </Badge>
              <Badge variant={message.has_screenshot ? 'default' : 'secondary'}>
                {message.has_screenshot ? 'Has Screenshot' : 'No Screenshot'}
              </Badge>
              <Badge variant={message.mentions_version ? 'default' : 'secondary'}>
                {message.mentions_version ? 'Mentions Version' : 'No Version'}
              </Badge>
            </div>
          </div>

          {/* Processing Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Processing Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Model:</span> {message.model_used}
              </div>
              <div>
                <span className="font-medium">Tokens:</span> {message.total_tokens.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Cost:</span> ${(Number(message.processing_cost) || 0).toFixed(6)}
              </div>
              <div>
                <span className="font-medium">Time:</span> {message.processing_time_ms}ms
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
