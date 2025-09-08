import React from 'react';

interface FilterBarProps {
  filter: {
    priority: string;
    status: string;
    needsResponse: string;
    channel: string;
  };
  setFilter: (filter: any) => void;
  channels: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ filter, setFilter, channels }) => {
  const handleFilterChange = (key: string, value: string) => {
    setFilter({ ...filter, [key]: value });
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Priority:</label>
        <select 
          value={filter.priority} 
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Status:</label>
        <select 
          value={filter.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="all">All</option>
          <option value="help_request">Help Request</option>
          <option value="bug_report">Bug Report</option>
          <option value="feature_request">Feature Request</option>
          <option value="complaint">Complaint</option>
          <option value="feedback">Feedback</option>
          <option value="question">Question</option>
          <option value="urgent_issue">Urgent Issue</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Needs Response:</label>
        <select 
          value={filter.needsResponse} 
          onChange={(e) => handleFilterChange('needsResponse', e.target.value)}
        >
          <option value="all">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Channel:</label>
        <select 
          value={filter.channel} 
          onChange={(e) => handleFilterChange('channel', e.target.value)}
        >
          <option value="all">All Channels</option>
          {channels.map(channel => (
            <option key={channel} value={channel}>#{channel}</option>
          ))}
        </select>
      </div>

      <button 
        className="reset-filters"
        onClick={() => setFilter({
          priority: 'all',
          status: 'all',
          needsResponse: 'all',
          channel: 'all'
        })}
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterBar;
