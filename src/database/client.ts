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
