#!/usr/bin/env node

/**
 * Development startup script for Marin Pest Control Backend
 * This script helps with development by:
 * 1. Building the TypeScript code
 * 2. Starting the main server
 * 3. Optionally starting background services
 */

import { spawn } from 'child_process';
import { logger } from './src/utils/logger.js';

const args = process.argv.slice(2);
const startServices = args.includes('--with-services');

console.log('🚀 Starting Marin Pest Control Backend in development mode...\n');

// Build TypeScript
console.log('📦 Building TypeScript...');
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Build failed');
    process.exit(1);
  }

  console.log('✅ Build completed successfully\n');

  // Start main server
  console.log('🌐 Starting main server...');
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      SKIP_AUTH: 'true',
    },
  });

  if (startServices) {
    console.log('🔄 Starting background services...');
    
    // Start token refresher
    const tokenProcess = spawn('node', ['dist/services/tokenRefresher.js'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });

    // Start sync service
    const syncProcess = spawn('node', ['dist/services/syncService.js'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });

    // Handle process cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      serverProcess.kill();
      tokenProcess.kill();
      syncProcess.kill();
      process.exit(0);
    });
  } else {
    console.log('ℹ️  To start background services, use: npm run dev:with-services\n');
    
    // Handle process cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      serverProcess.kill();
      process.exit(0);
    });
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error);
  process.exit(1);
});
