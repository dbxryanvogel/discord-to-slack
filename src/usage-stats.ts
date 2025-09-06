#!/usr/bin/env node
import 'dotenv/config';
import { getUsageStats, getUsageByModel, getTopChannelsByUsage } from './database/client';

async function displayUsageStats() {
  console.log('\n📊 === USAGE STATISTICS ===\n');
  
  try {
    // Get overall stats for the last 30 days
    const stats = await getUsageStats();
    
    if (stats) {
      console.log('📈 Overall Stats (Last 30 Days):');
      console.log('--------------------------------');
      console.log(`Total Messages: ${stats.total_messages || 0}`);
      console.log(`Total Tokens: ${(stats.total_tokens || 0).toLocaleString()}`);
      console.log(`Total Cost: $${(stats.total_cost || 0).toFixed(4)}`);
      console.log(`Avg Tokens/Message: ${Math.round(stats.avg_tokens_per_message || 0)}`);
      console.log(`Avg Cost/Message: $${(stats.avg_cost_per_message || 0).toFixed(6)}`);
      
      if (stats.first_message) {
        console.log(`First Message: ${new Date(stats.first_message).toLocaleString()}`);
      }
      if (stats.last_message) {
        console.log(`Last Message: ${new Date(stats.last_message).toLocaleString()}`);
      }
    }
    
    // Get usage by model
    const modelUsage = await getUsageByModel();
    
    if (modelUsage && modelUsage.length > 0) {
      console.log('\n🤖 Usage by Model:');
      console.log('------------------');
      
      for (const model of modelUsage) {
        console.log(`\n${model.model}:`);
        console.log(`  Messages: ${model.message_count}`);
        console.log(`  Total Tokens: ${(model.total_tokens || 0).toLocaleString()}`);
        console.log(`  Total Cost: $${(model.total_cost || 0).toFixed(4)}`);
        console.log(`  Avg Processing Time: ${Math.round(model.avg_processing_time || 0)}ms`);
      }
    }
    
    // Get top channels by usage
    const topChannels = await getTopChannelsByUsage(5);
    
    if (topChannels && topChannels.length > 0) {
      console.log('\n💬 Top 5 Channels by Cost:');
      console.log('---------------------------');
      
      for (let i = 0; i < topChannels.length; i++) {
        const channel = topChannels[i];
        console.log(`\n${i + 1}. #${channel.channel_name} (${channel.server_name})`);
        console.log(`   Messages: ${channel.message_count}`);
        console.log(`   Total Cost: $${(channel.total_cost || 0).toFixed(4)}`);
        console.log(`   Avg Sentiment: ${(channel.avg_sentiment || 0).toFixed(2)}`);
      }
    }
    
    // Calculate daily cost projection
    if (stats && stats.total_messages > 0) {
      const daysSinceFirst = stats.first_message 
        ? (Date.now() - new Date(stats.first_message).getTime()) / (1000 * 60 * 60 * 24)
        : 1;
      const dailyAvgCost = (stats.total_cost || 0) / Math.max(daysSinceFirst, 1);
      const monthlyProjection = dailyAvgCost * 30;
      
      console.log('\n💰 Cost Projections:');
      console.log('--------------------');
      console.log(`Daily Average: $${dailyAvgCost.toFixed(4)}`);
      console.log(`Monthly Projection: $${monthlyProjection.toFixed(2)}`);
    }
    
    console.log('\n=====================================\n');
    
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    console.log('\nMake sure your DATABASE_URL is configured correctly in .env');
  }
}

// Run the stats display
displayUsageStats().then(() => process.exit(0));
