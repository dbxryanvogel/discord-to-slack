import React from 'react';

interface StatsProps {
  stats: {
    total_messages: number;
    total_tokens: number;
    total_cost: number;
    avg_cost_per_message: number;
    needs_response_count: number;
    critical_count: number;
    high_count: number;
    avg_sentiment: number;
  };
}

const UsageStats: React.FC<StatsProps> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value || 0);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const getSentimentEmoji = (score: number) => {
    if (score > 0.3) return '😊';
    if (score < -0.3) return '😔';
    return '😐';
  };

  return (
    <div className="stats-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Messages (24h)</div>
          <div className="stat-value">{formatNumber(stats.total_messages)}</div>
          {stats.needs_response_count > 0 && (
            <div className="stat-subtitle">{stats.needs_response_count} need response</div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Tokens</div>
          <div className="stat-value">{formatNumber(Math.round(stats.total_tokens))}</div>
          <div className="stat-subtitle">24 hour usage</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Cost (24h)</div>
          <div className="stat-value cost">{formatCurrency(stats.total_cost)}</div>
          <div className="stat-subtitle">Avg: {formatCurrency(stats.avg_cost_per_message)}/msg</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Priority Issues</div>
          <div className="stat-value">
            <span className="priority-critical">{stats.critical_count}</span>
            {' / '}
            <span className="priority-high">{stats.high_count}</span>
          </div>
          <div className="stat-subtitle">Critical / High</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg Sentiment</div>
          <div className="stat-value">
            {getSentimentEmoji(stats.avg_sentiment)} {(stats.avg_sentiment || 0).toFixed(2)}
          </div>
          <div className="stat-subtitle">Customer mood</div>
        </div>
      </div>
    </div>
  );
};

export default UsageStats;
