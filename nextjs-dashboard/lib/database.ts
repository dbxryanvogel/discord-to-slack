import { neon } from '@neondatabase/serverless';

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);

// Pricing configuration (per 1M tokens)
const PRICING = {
  input: 0.050,  // $0.050 per 1M input tokens
  output: 0.400  // $0.400 per 1M output tokens
};

/**
 * Calculate costs based on token usage
 */
export function calculateCosts(promptTokens: number, completionTokens: number): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  // Calculate costs (tokens / 1,000,000 * price per 1M)
  const inputCost = (promptTokens / 1_000_000) * PRICING.input;
  const outputCost = (completionTokens / 1_000_000) * PRICING.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number(totalCost.toFixed(6))
  };
}

/**
 * Get usage statistics for a specific date range
 */
export async function getUsageStats(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
  const end = endDate || new Date();
  
  const result = await sql`
    SELECT 
      COUNT(*) as total_messages,
      SUM(total_tokens) as total_tokens,
      SUM(total_cost) as total_cost,
      AVG(total_tokens) as avg_tokens_per_message,
      AVG(total_cost) as avg_cost_per_message,
      MIN(created_at) as first_message,
      MAX(created_at) as last_message
    FROM usage
    WHERE created_at BETWEEN ${start} AND ${end}
  `;
  
  return result[0];
}

/**
 * Get usage by model
 */
export async function getUsageByModel(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  
  return await sql`
    SELECT 
      model,
      COUNT(*) as message_count,
      SUM(total_tokens) as total_tokens,
      SUM(total_cost) as total_cost,
      AVG(processing_time_ms) as avg_processing_time
    FROM usage
    WHERE created_at BETWEEN ${start} AND ${end}
    GROUP BY model
    ORDER BY total_cost DESC
  `;
}

/**
 * Get top channels by usage
 */
export async function getTopChannelsByUsage(limit: number = 10) {
  return await sql`
    SELECT 
      channel_id,
      channel_name,
      server_name,
      COUNT(*) as message_count,
      SUM(total_tokens) as total_tokens,
      SUM(total_cost) as total_cost,
      AVG(sentiment_score) as avg_sentiment
    FROM usage
    GROUP BY channel_id, channel_name, server_name
    ORDER BY total_cost DESC
    LIMIT ${limit}
  `;
}

/**
 * Get message logs with search and filtering
 */
export async function getMessageLogs(params: {
  limit?: number;
  offset?: number;
  search?: string;
  priority?: string;
  supportStatus?: string;
  tone?: string;
  channelId?: string;
  authorId?: string;
}) {
  const {
    limit = 50,
    offset = 0,
    search = '',
    priority = '',
    supportStatus = '',
    tone = '',
    channelId = '',
    authorId = ''
  } = params;

  try {
    // Build base query with filters
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(sql`(
        message_content ILIKE ${`%${search}%`} OR 
        author_tag ILIKE ${`%${search}%`} OR 
        summary ILIKE ${`%${search}%`} OR
        channel_name ILIKE ${`%${search}%`}
      )`);
    }
    
    if (priority) {
      whereConditions.push(sql`priority = ${priority}`);
    }
    
    if (supportStatus) {
      whereConditions.push(sql`support_status = ${supportStatus}`);
    }
    
    if (tone) {
      whereConditions.push(sql`tone = ${tone}`);
    }
    
    if (channelId) {
      whereConditions.push(sql`channel_id = ${channelId}`);
    }
    
    if (authorId) {
      whereConditions.push(sql`author_id = ${authorId}`);
    }

    // If no filters, get all messages
    if (whereConditions.length === 0) {
      const [countResult, dataResult] = await Promise.all([
        sql`SELECT COUNT(*) as total FROM message_logs`,
        sql`
          SELECT * FROM message_logs 
          ORDER BY created_at DESC 
          LIMIT ${limit} OFFSET ${offset}
        `
      ]);

      const total = parseInt(countResult[0]?.total || '0');
      const hasMore = offset + limit < total;

      return {
        logs: dataResult || [],
        total,
        hasMore
      };
    }

    // With filters - this is more complex, let's use a simpler approach for now
    // Just get recent messages and filter in memory for the first version
    const allMessages = await sql`
      SELECT * FROM message_logs 
      ORDER BY created_at DESC 
      LIMIT 1000
    `;

    let filteredMessages = allMessages || [];

    // Apply filters in memory
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMessages = filteredMessages.filter(msg => 
        (msg.message_content && msg.message_content.toLowerCase().includes(searchLower)) ||
        (msg.author_tag && msg.author_tag.toLowerCase().includes(searchLower)) ||
        (msg.summary && msg.summary.toLowerCase().includes(searchLower)) ||
        (msg.channel_name && msg.channel_name.toLowerCase().includes(searchLower))
      );
    }

    if (priority) {
      filteredMessages = filteredMessages.filter(msg => msg.priority === priority);
    }

    if (supportStatus) {
      filteredMessages = filteredMessages.filter(msg => msg.support_status === supportStatus);
    }

    if (tone) {
      filteredMessages = filteredMessages.filter(msg => msg.tone === tone);
    }

    if (channelId) {
      filteredMessages = filteredMessages.filter(msg => msg.channel_id === channelId);
    }

    if (authorId) {
      filteredMessages = filteredMessages.filter(msg => msg.author_id === authorId);
    }

    // Apply pagination
    const total = filteredMessages.length;
    const paginatedMessages = filteredMessages.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      logs: paginatedMessages,
      total,
      hasMore
    };

  } catch (error) {
    console.error('Error in getMessageLogs:', error);
    
    // Return empty result on error
    return {
      logs: [],
      total: 0,
      hasMore: false
    };
  }
}

/**
 * Get recent message logs (legacy function for backward compatibility)
 */
export async function getRecentMessageLogs(limit: number = 50, offset: number = 0) {
  const result = await getMessageLogs({ limit, offset });
  return result.logs; // Return just the logs array for backward compatibility
}

/**
 * Get message logs by channel
 */
export async function getMessageLogsByChannel(channelId: string, limit: number = 50) {
  return await sql`
    SELECT 
      *
    FROM message_logs
    WHERE channel_id = ${channelId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

/**
 * Get message logs needing response
 */
export async function getMessageLogsNeedingResponse() {
  return await sql`
    SELECT 
      *
    FROM message_logs
    WHERE needs_response = true
    ORDER BY 
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      created_at DESC
  `;
}

/**
 * Get message log stats for dashboard
 */
export async function getMessageLogStats() {
  return await sql`
    SELECT 
      COUNT(*) as total_messages,
      COUNT(CASE WHEN needs_response THEN 1 END) as needs_response_count,
      COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_count,
      COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_count,
      AVG(sentiment_score) as avg_sentiment,
      SUM(total_tokens) as total_tokens_used,
      SUM(processing_cost) as total_cost
    FROM message_logs
    WHERE created_at >= NOW() - INTERVAL '24 hours'
  `;
}

/**
 * Get daily usage statistics for charts
 */
export async function getDailyUsageStats(days: number = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as message_count,
      SUM(total_tokens) as total_tokens,
      SUM(total_cost) as total_cost,
      AVG(sentiment_score) as avg_sentiment
    FROM usage
    WHERE created_at >= ${startDate}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
}

/**
 * Create additional indexes for search performance
 */
export async function createSearchIndexes() {
  try {
    // Text search indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_content_search ON message_logs USING gin(to_tsvector('english', message_content))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_author_search ON message_logs USING gin(to_tsvector('english', author_tag))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_summary_search ON message_logs USING gin(to_tsvector('english', summary))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_channel_search ON message_logs USING gin(to_tsvector('english', channel_name))`;
    
    // Additional filter indexes (these might already exist from the schema)
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_priority_created ON message_logs(priority, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_support_status_created ON message_logs(support_status, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_tone_created ON message_logs(tone, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_author_created ON message_logs(author_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_channel_created ON message_logs(channel_id, created_at DESC)`;
    
    console.log('✅ Search indexes created successfully');
  } catch (error) {
    console.error('❌ Failed to create search indexes:', error);
  }
}

/**
 * Get webhook settings
 */
export async function getWebhookSettings() {
  const result = await sql`
    SELECT * FROM webhook_settings 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  return result[0] || null;
}

/**
 * Update webhook settings
 */
export async function updateWebhookSettings(settings: {
  slack_webhook_url?: string;
  webhook_enabled?: boolean;
  send_critical?: boolean;
  send_high?: boolean;
  send_medium?: boolean;
  send_low?: boolean;
  min_sentiment_score?: number;
  max_sentiment_score?: number;
  send_help_request?: boolean;
  send_bug_report?: boolean;
  send_feature_request?: boolean;
  send_complaint?: boolean;
  send_urgent_issue?: boolean;
  send_feedback?: boolean;
  send_question?: boolean;
  send_documentation_issue?: boolean;
  send_general_discussion?: boolean;
  send_resolved?: boolean;
  send_other?: boolean;
  only_needs_response?: boolean;
  cooldown_minutes?: number;
  description?: string;
}) {
  const result = await sql`
    UPDATE webhook_settings SET
      slack_webhook_url = COALESCE(${settings.slack_webhook_url}, slack_webhook_url),
      webhook_enabled = COALESCE(${settings.webhook_enabled}, webhook_enabled),
      send_critical = COALESCE(${settings.send_critical}, send_critical),
      send_high = COALESCE(${settings.send_high}, send_high),
      send_medium = COALESCE(${settings.send_medium}, send_medium),
      send_low = COALESCE(${settings.send_low}, send_low),
      min_sentiment_score = COALESCE(${settings.min_sentiment_score}, min_sentiment_score),
      max_sentiment_score = COALESCE(${settings.max_sentiment_score}, max_sentiment_score),
      send_help_request = COALESCE(${settings.send_help_request}, send_help_request),
      send_bug_report = COALESCE(${settings.send_bug_report}, send_bug_report),
      send_feature_request = COALESCE(${settings.send_feature_request}, send_feature_request),
      send_complaint = COALESCE(${settings.send_complaint}, send_complaint),
      send_urgent_issue = COALESCE(${settings.send_urgent_issue}, send_urgent_issue),
      send_feedback = COALESCE(${settings.send_feedback}, send_feedback),
      send_question = COALESCE(${settings.send_question}, send_question),
      send_documentation_issue = COALESCE(${settings.send_documentation_issue}, send_documentation_issue),
      send_general_discussion = COALESCE(${settings.send_general_discussion}, send_general_discussion),
      send_resolved = COALESCE(${settings.send_resolved}, send_resolved),
      send_other = COALESCE(${settings.send_other}, send_other),
      only_needs_response = COALESCE(${settings.only_needs_response}, only_needs_response),
      cooldown_minutes = COALESCE(${settings.cooldown_minutes}, cooldown_minutes),
      description = COALESCE(${settings.description}, description),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT id FROM webhook_settings ORDER BY created_at DESC LIMIT 1)
    RETURNING *
  `;
  return result[0];
}
