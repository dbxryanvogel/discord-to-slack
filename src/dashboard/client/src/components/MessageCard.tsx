import React, { useState } from 'react';

interface MessageCardProps {
  message: {
    id: number;
    created_at: string;
    message_id: string;
    message_content: string;
    author_tag: string;
    author_avatar: string;
    channel_name: string;
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
    total_tokens: number;
    processing_cost: number;
    processing_time_ms: number;
  };
}

const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(cost || 0);
  };

  const getPriorityClass = (priority: string) => {
    return `priority priority-${priority}`;
  };

  const getStatusClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'help_request': 'help',
      'bug_report': 'bug',
      'feature_request': 'feature',
      'complaint': 'complaint',
      'urgent_issue': 'urgent',
      'resolved': 'resolved'
    };
    return `status status-${statusMap[status] || 'default'}`;
  };

  const getToneClass = (tone: string) => {
    const toneMap: { [key: string]: string } = {
      'happy': 'positive',
      'grateful': 'positive',
      'neutral': 'neutral',
      'professional': 'neutral',
      'confused': 'warning',
      'frustrated': 'warning',
      'angry': 'negative',
      'urgent': 'urgent'
    };
    return `tone tone-${toneMap[tone] || 'neutral'}`;
  };

  return (
    <div className={`message-card ${expanded ? 'expanded' : ''} ${message.needs_response ? 'needs-response' : ''}`}>
      <div className="message-header" onClick={() => setExpanded(!expanded)}>
        <div className="message-meta">
          <div className="author-info">
            {message.author_avatar && (
              <img src={message.author_avatar} alt={message.author_tag} className="author-avatar" />
            )}
            <span className="author-tag">{message.author_tag}</span>
          </div>
          <div className="channel-info">
            <span className="channel-name">#{message.channel_name}</span>
            <span className="server-name">{message.server_name}</span>
          </div>
          <div className="timestamp">{formatTime(message.created_at)}</div>
        </div>
        
        <div className="message-badges">
          <span className={getPriorityClass(message.priority)}>{message.priority}</span>
          <span className={getStatusClass(message.support_status)}>
            {message.support_status.replace(/_/g, ' ')}
          </span>
          <span className={getToneClass(message.tone)}>{message.tone}</span>
          {message.needs_response && <span className="badge-response">Needs Response</span>}
        </div>
      </div>

      <div className="message-content">
        <p className="message-text">{message.message_content || '(No text content)'}</p>
      </div>

      <div className="message-analysis">
        <div className="analysis-section">
          <h4>📊 AI Analysis</h4>
          <div className="summary">
            <strong>Summary:</strong> {message.summary}
          </div>
          <div className="mood">
            <strong>Customer Mood:</strong> {message.customer_mood_emoji} {message.customer_mood_description}
          </div>
          <div className="sentiment">
            <strong>Sentiment:</strong> {message.sentiment_score.toFixed(2)} 
            <span className="confidence">(confidence: {(message.sentiment_confidence * 100).toFixed(0)}%)</span>
          </div>
        </div>

        {message.topics && message.topics.length > 0 && (
          <div className="topics">
            <strong>Topics:</strong>
            <div className="topic-tags">
              {message.topics.map((topic, idx) => (
                <span key={idx} className="topic-tag">{topic}</span>
              ))}
            </div>
          </div>
        )}

        {expanded && (
          <>
            {message.suggested_actions && message.suggested_actions.length > 0 && (
              <div className="suggested-actions">
                <strong>Suggested Actions:</strong>
                <ul>
                  {message.suggested_actions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="usage-info">
              <div className="usage-stat">
                <span className="label">Tokens:</span>
                <span className="value">{message.total_tokens}</span>
              </div>
              <div className="usage-stat">
                <span className="label">Cost:</span>
                <span className="value cost">{formatCost(message.processing_cost)}</span>
              </div>
              <div className="usage-stat">
                <span className="label">Processing:</span>
                <span className="value">{message.processing_time_ms}ms</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="expand-toggle">
        {expanded ? '▲ Show Less' : '▼ Show More'}
      </div>
    </div>
  );
};

export default MessageCard;
