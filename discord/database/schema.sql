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

-- Create message logs table for storing all analyzed messages
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
    topics TEXT[], -- Array of topics
    suggested_actions TEXT[], -- Array of suggested actions
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
);

-- Create indexes for message logs
CREATE INDEX idx_message_logs_created_at ON message_logs(created_at DESC);
CREATE INDEX idx_message_logs_message_id ON message_logs(message_id);
CREATE INDEX idx_message_logs_author_id ON message_logs(author_id);
CREATE INDEX idx_message_logs_channel_id ON message_logs(channel_id);
CREATE INDEX idx_message_logs_server_id ON message_logs(server_id);
CREATE INDEX idx_message_logs_priority ON message_logs(priority);
CREATE INDEX idx_message_logs_support_status ON message_logs(support_status);
CREATE INDEX idx_message_logs_needs_response ON message_logs(needs_response);

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

-- Create settings table for Slack webhook configuration
CREATE TABLE IF NOT EXISTS webhook_settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Webhook configuration
    slack_webhook_url VARCHAR(500),
    webhook_enabled BOOLEAN DEFAULT FALSE,
    
    -- Priority thresholds
    send_critical BOOLEAN DEFAULT TRUE,
    send_high BOOLEAN DEFAULT TRUE,
    send_medium BOOLEAN DEFAULT FALSE,
    send_low BOOLEAN DEFAULT FALSE,
    
    -- Sentiment thresholds
    min_sentiment_score DECIMAL(3, 2) DEFAULT -1.0, -- Send if sentiment <= this value
    max_sentiment_score DECIMAL(3, 2) DEFAULT 1.0,  -- Send if sentiment >= this value (for very positive feedback)
    
    -- Support status filters
    send_help_request BOOLEAN DEFAULT TRUE,
    send_bug_report BOOLEAN DEFAULT TRUE,
    send_feature_request BOOLEAN DEFAULT FALSE,
    send_complaint BOOLEAN DEFAULT TRUE,
    send_urgent_issue BOOLEAN DEFAULT TRUE,
    send_feedback BOOLEAN DEFAULT FALSE,
    send_question BOOLEAN DEFAULT FALSE,
    send_documentation_issue BOOLEAN DEFAULT FALSE,
    send_general_discussion BOOLEAN DEFAULT FALSE,
    send_resolved BOOLEAN DEFAULT FALSE,
    send_other BOOLEAN DEFAULT FALSE,
    
    -- Additional filters
    only_needs_response BOOLEAN DEFAULT FALSE, -- Only send if needs_response is true
    
    -- Metadata
    description TEXT DEFAULT 'Default webhook settings'
);

-- Insert default settings
INSERT INTO webhook_settings (description) VALUES ('Default webhook settings') 
ON CONFLICT DO NOTHING;

-- Create index for webhook settings
CREATE INDEX IF NOT EXISTS idx_webhook_settings_enabled ON webhook_settings(webhook_enabled);

-- Create teams table for routing messages to specific teams
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Team configuration
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL, -- What this team does (for AI routing)
    slack_webhook_url VARCHAR(500) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Priority thresholds for this team
    send_critical BOOLEAN DEFAULT TRUE,
    send_high BOOLEAN DEFAULT TRUE,
    send_medium BOOLEAN DEFAULT FALSE,
    send_low BOOLEAN DEFAULT FALSE,
    
    -- Support status filters for this team
    send_help_request BOOLEAN DEFAULT TRUE,
    send_bug_report BOOLEAN DEFAULT TRUE,
    send_feature_request BOOLEAN DEFAULT FALSE,
    send_complaint BOOLEAN DEFAULT TRUE,
    send_urgent_issue BOOLEAN DEFAULT TRUE,
    send_feedback BOOLEAN DEFAULT FALSE,
    send_question BOOLEAN DEFAULT FALSE,
    send_documentation_issue BOOLEAN DEFAULT FALSE,
    send_general_discussion BOOLEAN DEFAULT FALSE,
    send_resolved BOOLEAN DEFAULT FALSE,
    send_other BOOLEAN DEFAULT FALSE,
    
    -- Additional filters
    only_needs_response BOOLEAN DEFAULT FALSE -- Only send if needs_response is true
);

-- Create indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_enabled ON teams(enabled);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

-- Create table to track team webhook sends (for preventing duplicates and tracking routing)
CREATE TABLE IF NOT EXISTS team_webhook_sends (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    message_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    webhook_url VARCHAR(500) NOT NULL,
    
    -- Response tracking
    success BOOLEAN DEFAULT FALSE,
    response_status INTEGER,
    error_message TEXT,
    
    -- Routing information
    routed_by_ai BOOLEAN DEFAULT TRUE,
    routing_confidence DECIMAL(3, 2), -- AI confidence in routing decision
    
    UNIQUE(message_id, team_id) -- Prevent duplicate sends for same message to same team
);

-- Create indexes for team webhook sends
CREATE INDEX IF NOT EXISTS idx_team_webhook_sends_created_at ON team_webhook_sends(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_webhook_sends_message_id ON team_webhook_sends(message_id);
CREATE INDEX IF NOT EXISTS idx_team_webhook_sends_team_id ON team_webhook_sends(team_id);

-- Create table to track webhook sends (for preventing duplicates)
CREATE TABLE IF NOT EXISTS webhook_sends (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    message_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500) NOT NULL,
    
    -- Response tracking
    success BOOLEAN DEFAULT FALSE,
    response_status INTEGER,
    error_message TEXT,
    
    UNIQUE(message_id) -- Prevent duplicate sends for same message
);

-- Create indexes for webhook sends
CREATE INDEX IF NOT EXISTS idx_webhook_sends_created_at ON webhook_sends(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_sends_message_id ON webhook_sends(message_id);
