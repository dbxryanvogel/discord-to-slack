import { neon } from '@neondatabase/serverless';
import { MessageData, MessageAnalysis } from '../types';

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);

// Pricing configuration (per 1M tokens)
const PRICING = {
  input: 0.050,  // $0.050 per 1M input tokens
  output: 0.400  // $0.400 per 1M output tokens
};

/**
 * Initialize the database schema
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Create the message_logs table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS message_logs (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Discord message information
        message_id VARCHAR(255) NOT NULL UNIQUE,
        message_content TEXT,
        author_id VARCHAR(255) NOT NULL,
        author_tag VARCHAR(255) NOT NULL,
        author_avatar VARCHAR(500),
        channel_id VARCHAR(255) NOT NULL,
        channel_name VARCHAR(255) NOT NULL,
        server_id VARCHAR(255) NOT NULL,
        server_name VARCHAR(255) NOT NULL,
        
        -- Analysis results
        support_status VARCHAR(50),
        tone VARCHAR(50),
        priority VARCHAR(20),
        sentiment_score DECIMAL(3, 2),
        sentiment_confidence DECIMAL(3, 2),
        needs_response BOOLEAN,
        summary TEXT,
        topics TEXT[],
        suggested_actions TEXT[],
        customer_mood_description VARCHAR(255),
        customer_mood_emoji VARCHAR(10),
        
        -- Technical details
        has_code BOOLEAN DEFAULT FALSE,
        has_error BOOLEAN DEFAULT FALSE,
        has_screenshot BOOLEAN DEFAULT FALSE,
        mentions_version BOOLEAN DEFAULT FALSE,
        attachment_count INTEGER DEFAULT 0,
        
        -- Token usage for this specific message
        model_used VARCHAR(100),
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        processing_cost DECIMAL(10, 6) DEFAULT 0,
        processing_time_ms INTEGER,
        
        -- Metadata
        thread_id VARCHAR(255),
        parent_channel_id VARCHAR(255),
        is_thread BOOLEAN DEFAULT FALSE,
        mentioned_users TEXT[],
        mentioned_roles TEXT[],
        mentions_everyone BOOLEAN DEFAULT FALSE
      )
    `;

    // Create indexes for message_logs
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_message_id ON message_logs(message_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_channel_id ON message_logs(channel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_logs_priority ON message_logs(priority)`;
    
    // Create the usage table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS usage (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Discord message information
        message_id VARCHAR(255) NOT NULL,
        author_id VARCHAR(255) NOT NULL,
        author_tag VARCHAR(255) NOT NULL,
        channel_id VARCHAR(255) NOT NULL,
        channel_name VARCHAR(255) NOT NULL,
        server_id VARCHAR(255) NOT NULL,
        server_name VARCHAR(255) NOT NULL,
        
        -- AI model information
        model VARCHAR(100) NOT NULL,
        
        -- Token usage
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER NOT NULL,
        
        -- Cost calculation (in USD)
        input_cost DECIMAL(10, 6) DEFAULT 0,
        output_cost DECIMAL(10, 6) DEFAULT 0,
        total_cost DECIMAL(10, 6) NOT NULL,
        
        -- Analysis results
        support_status VARCHAR(50),
        tone VARCHAR(50),
        priority VARCHAR(20),
        sentiment_score DECIMAL(3, 2),
        needs_response BOOLEAN,
        summary TEXT,
        
        -- Metadata
        processing_time_ms INTEGER,
        error_occurred BOOLEAN DEFAULT FALSE,
        error_message TEXT
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_message_id ON usage(message_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_author_id ON usage(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_channel_id ON usage(channel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_server_id ON usage(server_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_model ON usage(model)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_priority ON usage(priority)`;

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

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
 * Save usage data to the database
 */
export async function saveUsage(
  messageData: MessageData,
  analysis: MessageAnalysis,
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  },
  model: string,
  processingTimeMs: number,
  error?: Error
): Promise<void> {
  try {
    const costs = calculateCosts(usage.promptTokens, usage.completionTokens);
    
    await sql`
      INSERT INTO usage (
        message_id,
        author_id,
        author_tag,
        channel_id,
        channel_name,
        server_id,
        server_name,
        model,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        input_cost,
        output_cost,
        total_cost,
        support_status,
        tone,
        priority,
        sentiment_score,
        needs_response,
        summary,
        processing_time_ms,
        error_occurred,
        error_message
      ) VALUES (
        ${messageData.id},
        ${messageData.author.id},
        ${messageData.author.tag},
        ${messageData.channel.id},
        ${messageData.channel.name},
        ${messageData.guild.id},
        ${messageData.guild.name},
        ${model},
        ${usage.promptTokens},
        ${usage.completionTokens},
        ${usage.totalTokens},
        ${costs.inputCost},
        ${costs.outputCost},
        ${costs.totalCost},
        ${analysis.supportStatus},
        ${analysis.tone},
        ${analysis.priority},
        ${analysis.sentiment.score},
        ${analysis.needsResponse},
        ${analysis.summary},
        ${processingTimeMs},
        ${error ? true : false},
        ${error?.message || null}
      )
    `;
    
    console.log(`💾 Usage saved: ${usage.totalTokens} tokens, $${costs.totalCost.toFixed(6)} cost`);
  } catch (dbError) {
    console.error('❌ Failed to save usage data:', dbError);
    // Don't throw - we don't want database errors to break message processing
  }
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
 * Save a message log with analysis to the database
 */
export async function saveMessageLog(
  messageData: MessageData,
  analysis: MessageAnalysis,
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  },
  model: string,
  processingTimeMs: number
): Promise<void> {
  try {
    const costs = calculateCosts(usage.promptTokens, usage.completionTokens);
    
    await sql`
      INSERT INTO message_logs (
        message_id,
        message_content,
        author_id,
        author_tag,
        author_avatar,
        channel_id,
        channel_name,
        server_id,
        server_name,
        support_status,
        tone,
        priority,
        sentiment_score,
        sentiment_confidence,
        needs_response,
        summary,
        topics,
        suggested_actions,
        customer_mood_description,
        customer_mood_emoji,
        has_code,
        has_error,
        has_screenshot,
        mentions_version,
        attachment_count,
        model_used,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        processing_cost,
        processing_time_ms,
        thread_id,
        parent_channel_id,
        is_thread,
        mentioned_users,
        mentioned_roles,
        mentions_everyone
      ) VALUES (
        ${messageData.id},
        ${messageData.content},
        ${messageData.author.id},
        ${messageData.author.tag},
        ${messageData.author.avatar},
        ${messageData.channel.id},
        ${messageData.channel.name},
        ${messageData.guild.id},
        ${messageData.guild.name},
        ${analysis.supportStatus},
        ${analysis.tone},
        ${analysis.priority},
        ${analysis.sentiment.score},
        ${analysis.sentiment.confidence},
        ${analysis.needsResponse},
        ${analysis.summary},
        ${analysis.topics},
        ${analysis.suggestedActions},
        ${analysis.customerMood.description},
        ${analysis.customerMood.emoji},
        ${analysis.technicalDetails.hasCode},
        ${analysis.technicalDetails.hasError},
        ${analysis.technicalDetails.hasScreenshot},
        ${analysis.technicalDetails.mentionsVersion},
        ${messageData.attachments.length},
        ${model},
        ${usage.promptTokens},
        ${usage.completionTokens},
        ${usage.totalTokens},
        ${costs.totalCost},
        ${processingTimeMs},
        ${messageData.channel.isThread ? messageData.channel.id : null},
        ${messageData.channel.parentId},
        ${messageData.channel.isThread},
        ${messageData.mentions.users},
        ${messageData.mentions.roles},
        ${messageData.mentions.everyone}
      )
      ON CONFLICT (message_id) DO UPDATE SET
        support_status = EXCLUDED.support_status,
        tone = EXCLUDED.tone,
        priority = EXCLUDED.priority,
        sentiment_score = EXCLUDED.sentiment_score,
        sentiment_confidence = EXCLUDED.sentiment_confidence,
        needs_response = EXCLUDED.needs_response,
        summary = EXCLUDED.summary,
        topics = EXCLUDED.topics,
        suggested_actions = EXCLUDED.suggested_actions,
        customer_mood_description = EXCLUDED.customer_mood_description,
        customer_mood_emoji = EXCLUDED.customer_mood_emoji,
        has_code = EXCLUDED.has_code,
        has_error = EXCLUDED.has_error,
        has_screenshot = EXCLUDED.has_screenshot,
        mentions_version = EXCLUDED.mentions_version,
        model_used = EXCLUDED.model_used,
        prompt_tokens = EXCLUDED.prompt_tokens,
        completion_tokens = EXCLUDED.completion_tokens,
        total_tokens = EXCLUDED.total_tokens,
        processing_cost = EXCLUDED.processing_cost,
        processing_time_ms = EXCLUDED.processing_time_ms
    `;
    
    console.log(`💾 Message log saved: ${messageData.id}`);
  } catch (dbError) {
    console.error('❌ Failed to save message log:', dbError);
  }
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
