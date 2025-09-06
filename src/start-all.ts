#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting Discord Bot and Dashboard...\n');

// Start the Discord bot
const bot = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait a moment then start the dashboard
setTimeout(() => {
  console.log('\n📊 Starting Dashboard Server...\n');
  const dashboard = spawn('npm', ['run', 'dashboard'], {
    stdio: 'inherit',
    shell: true
  });
  
  dashboard.on('error', (error) => {
    console.error('Failed to start dashboard:', error);
  });
}, 2000);

bot.on('error', (error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  bot.kill();
  process.exit(0);
});
