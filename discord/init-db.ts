#!/usr/bin/env node
import 'dotenv/config';
import { initializeDatabase } from './database/client';

async function main() {
  console.log('🔧 Initializing database tables...');
  
  try {
    await initializeDatabase();
    console.log('✅ Database tables initialized successfully!');
    console.log('📊 You can now run the dashboard service.');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

main();
