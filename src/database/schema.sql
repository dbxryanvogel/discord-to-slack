-- Create usage table for tracking AI token usage and costs
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
    input_cost DECIMAL(10, 6) DEFAULT 0,  -- Cost for input tokens
    output_cost DECIMAL(10, 6) DEFAULT 0, -- Cost for output tokens
    total_cost DECIMAL(10, 6) NOT NULL,   -- Total cost
    
    -- Analysis results
    support_status VARCHAR(50),
    tone VARCHAR(50),
    priority VARCHAR(20),
    sentiment_score DECIMAL(3, 2),
    needs_response BOOLEAN,
    summary TEXT,
    
    -- Metadata
    processing_time_ms INTEGER, -- Time taken to process in milliseconds
    error_occurred BOOLEAN DEFAULT FALSE,
    error_message TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_usage_created_at ON usage(created_at);
CREATE INDEX idx_usage_message_id ON usage(message_id);
CREATE INDEX idx_usage_author_id ON usage(author_id);
CREATE INDEX idx_usage_channel_id ON usage(channel_id);
CREATE INDEX idx_usage_server_id ON usage(server_id);
CREATE INDEX idx_usage_model ON usage(model);
CREATE INDEX idx_usage_priority ON usage(priority);

-- Create a view for daily usage statistics
CREATE OR REPLACE VIEW daily_usage_stats AS
SELECT 
    DATE(created_at) as date,
    model,
    COUNT(*) as message_count,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost) as total_cost,
    AVG(total_tokens) as avg_tokens_per_message,
    AVG(total_cost) as avg_cost_per_message,
    SUM(CASE WHEN error_occurred THEN 1 ELSE 0 END) as error_count
FROM usage
GROUP BY DATE(created_at), model
ORDER BY date DESC, model;

-- Create a view for channel statistics
CREATE OR REPLACE VIEW channel_stats AS
SELECT 
    channel_id,
    channel_name,
    server_name,
    COUNT(*) as message_count,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost) as total_cost,
    AVG(sentiment_score) as avg_sentiment,
    COUNT(DISTINCT author_id) as unique_authors
FROM usage
GROUP BY channel_id, channel_name, server_name
ORDER BY message_count DESC;
