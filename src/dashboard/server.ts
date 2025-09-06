import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;
const sql = neon(process.env.DATABASE_URL!);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints

// Get overall usage statistics
app.get('/api/stats/overall', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    
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
      WHERE created_at >= ${startDate}
    `;
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get daily usage trend
app.get('/api/stats/daily', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    
    const result = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as message_count,
        SUM(total_tokens) as total_tokens,
        SUM(total_cost) as total_cost
      FROM usage
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily statistics' });
  }
});

// Get usage by model
app.get('/api/stats/models', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    
    const result = await sql`
      SELECT 
        model,
        COUNT(*) as message_count,
        SUM(total_tokens) as total_tokens,
        SUM(total_cost) as total_cost,
        AVG(processing_time_ms) as avg_processing_time
      FROM usage
      WHERE created_at >= ${startDate}
      GROUP BY model
      ORDER BY total_cost DESC
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching model stats:', error);
    res.status(500).json({ error: 'Failed to fetch model statistics' });
  }
});

// Get top channels by usage
app.get('/api/stats/channels', async (req, res) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    
    const result = await sql`
      SELECT 
        channel_id,
        channel_name,
        server_name,
        COUNT(*) as message_count,
        SUM(total_tokens) as total_tokens,
        SUM(total_cost) as total_cost,
        AVG(sentiment_score) as avg_sentiment
      FROM usage
      WHERE created_at >= ${startDate}
      GROUP BY channel_id, channel_name, server_name
      ORDER BY total_cost DESC
      LIMIT ${Number(limit)}
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    res.status(500).json({ error: 'Failed to fetch channel statistics' });
  }
});

// Get support status distribution
app.get('/api/stats/support-status', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    
    const result = await sql`
      SELECT 
        support_status,
        COUNT(*) as count
      FROM usage
      WHERE created_at >= ${startDate}
      GROUP BY support_status
      ORDER BY count DESC
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching support status:', error);
    res.status(500).json({ error: 'Failed to fetch support status distribution' });
  }
});

// Get tone distribution
app.get('/api/stats/tone', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    
    const result = await sql`
      SELECT 
        tone,
        COUNT(*) as count
      FROM usage
      WHERE created_at >= ${startDate}
      GROUP BY tone
      ORDER BY count DESC
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching tone distribution:', error);
    res.status(500).json({ error: 'Failed to fetch tone distribution' });
  }
});

// Get priority distribution
app.get('/api/stats/priority', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    
    const result = await sql`
      SELECT 
        priority,
        COUNT(*) as count
      FROM usage
      WHERE created_at >= ${startDate}
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching priority distribution:', error);
    res.status(500).json({ error: 'Failed to fetch priority distribution' });
  }
});

// Get hourly pattern
app.get('/api/stats/hourly', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    
    const result = await sql`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as message_count,
        AVG(total_cost) as avg_cost
      FROM usage
      WHERE created_at >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching hourly pattern:', error);
    res.status(500).json({ error: 'Failed to fetch hourly pattern' });
  }
});

// Serve the dashboard HTML at /usage
app.get('/usage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`📊 Dashboard server running at http://localhost:${PORT}`);
  console.log(`📈 View usage dashboard at http://localhost:${PORT}/usage`);
});
