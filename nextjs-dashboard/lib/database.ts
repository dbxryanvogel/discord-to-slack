import { neon } from '@neondatabase/serverless';

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);

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
 * Get recent message logs
 */
export async function getRecentMessageLogs(limit: number = 50, offset: number = 0) {
  return await sql`
    SELECT 
      *
    FROM message_logs
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
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
