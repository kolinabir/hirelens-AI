#!/usr/bin/env node

// Environment validation script
import { validateEnvironment } from './config/env.js';
import { dbConnection } from './lib/database.js';

async function checkSetup() {
  console.log('🔍 Facebook Job Scraper - Environment Check\n');

  try {
    // 1. Validate environment variables
    console.log('1. Checking environment variables...');
    validateEnvironment();
    console.log('   ✅ Environment variables valid\n');

    // 2. Test database connection
    console.log('2. Testing database connection...');
    await dbConnection.connect();
    
    const isHealthy = await dbConnection.healthCheck();
    if (isHealthy) {
      console.log('   ✅ Database connection successful\n');
    } else {
      console.log('   ❌ Database health check failed\n');
    }

    // 3. Check logs directory
    console.log('3. Checking logs directory...');
    const fs = await import('fs');
    if (fs.existsSync('./logs')) {
      console.log('   ✅ Logs directory exists\n');
    } else {
      console.log('   ⚠️  Logs directory not found, creating...');
      fs.mkdirSync('./logs', { recursive: true });
      console.log('   ✅ Logs directory created\n');
    }

    console.log('🎉 Setup check completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update .env file with your Facebook credentials');
    console.log('2. Make sure MongoDB is running');
    console.log('3. Visit http://localhost:3000/dashboard to start using the app');

  } catch (error) {
    console.error('❌ Setup check failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your .env file configuration');
    console.log('3. Verify all dependencies are installed (npm install)');
  } finally {
    await dbConnection.disconnect();
    process.exit();
  }
}

checkSetup();