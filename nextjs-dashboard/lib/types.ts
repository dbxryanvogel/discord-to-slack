export interface MessageAnalysis {
  supportStatus: 'help_request' | 'bug_report' | 'feature_request' | 'complaint' | 'feedback' | 'question' | 'documentation_issue' | 'urgent_issue' | 'general_discussion' | 'resolved' | 'other';
  tone: 'happy' | 'neutral' | 'frustrated' | 'angry' | 'confused' | 'grateful' | 'urgent' | 'professional';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentiment: {
    score: number;
    confidence: number;
  };
  topics: string[];
  needsResponse: boolean;
  summary: string;
  suggestedActions: string[];
  customerMood: {
    description: string;
    emoji: string;
  };
  technicalDetails: {
    hasCode: boolean;
    hasError: boolean;
    hasScreenshot: boolean;
    mentionsVersion: boolean;
  };
}

export interface UsageStats {
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  avg_tokens_per_message: number;
  avg_cost_per_message: number;
  first_message: string;
  last_message: string;
}

export interface ModelUsage {
  model: string;
  message_count: number;
  total_tokens: number;
  total_cost: number;
  avg_processing_time: number;
}

export interface ChannelUsage {
  channel_id: string;
  channel_name: string;
  server_name: string;
  message_count: number;
  total_tokens: number;
  total_cost: number;
  avg_sentiment: number;
}

export interface MessageLog {
  id: number;
  created_at: string;
  message_id: string;
  message_content: string;
  author_id: string;
  author_tag: string;
  author_avatar: string;
  channel_id: string;
  channel_name: string;
  server_id: string;
  server_name: string;
  support_status: string;
  tone: string;
  priority: string;
  sentiment_score: number;
  sentiment_confidence: number;
  needs_response: boolean;
  summary: string;
  topics: string[];
  suggested_actions: string[];
  customer_mood_description: string;
  customer_mood_emoji: string;
  has_code: boolean;
  has_error: boolean;
  has_screenshot: boolean;
  mentions_version: boolean;
  attachment_count: number;
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  processing_cost: number;
  processing_time_ms: number;
  thread_id: string;
  parent_channel_id: string;
  is_thread: boolean;
  mentioned_users: string[];
  mentioned_roles: string[];
  mentions_everyone: boolean;
}

export interface MessageLogStats {
  total_messages: number;
  needs_response_count: number;
  critical_count: number;
  high_count: number;
  avg_sentiment: number;
  total_tokens_used: number;
  total_cost: number;
}

export interface DailyUsageStats {
  date: string;
  message_count: number;
  total_tokens: number;
  total_cost: number;
  avg_sentiment: number;
}
