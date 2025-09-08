import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './components/MessageList';
import UsageStats from './components/UsageStats';
import FilterBar from './components/FilterBar';

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

interface Stats {
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  avg_cost_per_message: number;
  needs_response_count: number;
  critical_count: number;
  high_count: number;
  avg_sentiment: number;
}

function App() {
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    priority: 'all',
    status: 'all',
    needsResponse: 'all',
    channel: 'all'
  });
  const [channels, setChannels] = useState<string[]>([]);

  // Fetch messages and stats
  const fetchData = async () => {
    try {
      const [messagesRes, statsRes] = await Promise.all([
        axios.get('/api/messages/recent'),
        axios.get('/api/messages/stats')
      ]);
      
      setMessages(messagesRes.data);
      setStats(statsRes.data);
      
      // Extract unique channels
      const uniqueChannels = [...new Set(messagesRes.data.map((m: MessageLog) => m.channel_name))] as string[];
      setChannels(uniqueChannels);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Poll every second
  useEffect(() => {
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    if (filter.priority !== 'all' && msg.priority !== filter.priority) return false;
    if (filter.status !== 'all' && msg.support_status !== filter.status) return false;
    if (filter.needsResponse !== 'all') {
      if (filter.needsResponse === 'yes' && !msg.needs_response) return false;
      if (filter.needsResponse === 'no' && msg.needs_response) return false;
    }
    if (filter.channel !== 'all' && msg.channel_name !== filter.channel) return false;
    return true;
  });

  if (loading && messages.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🤖 Discord Bot Dashboard</h1>
          <p className="subtitle">Real-time message analysis and usage tracking</p>
        </div>
      </header>

      <div className="dashboard-container">
        {stats && <UsageStats stats={stats} />}
        
        <FilterBar 
          filter={filter}
          setFilter={setFilter}
          channels={channels}
        />
        
        <MessageList messages={filteredMessages} />
      </div>
    </div>
  );
}

export default App;
