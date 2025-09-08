import React from 'react';
import MessageCard from './MessageCard';

interface MessageLog {
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
}

interface MessageListProps {
  messages: MessageLog[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <div className="no-messages">
        <p>No messages found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      <div className="message-list-header">
        <h2>📨 Recent Messages ({messages.length})</h2>
      </div>
      <div className="messages-container">
        {messages.map(message => (
          <MessageCard key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
};

export default MessageList;
