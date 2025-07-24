#!/usr/bin/env node

// Simple script to handle database migration with automatic responses
import { spawn } from 'child_process';

const child = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  cwd: process.cwd()
});

// When the process asks for input, send Enter (choose first option)
child.stdin.on('error', () => {
  // Ignore stdin errors
});

// Send Enter key repeatedly to select default options
const sendEnter = () => {
  try {
    child.stdin.write('\n');
  } catch (error) {
    // Ignore errors
  }
};

// Send multiple Enter keys to handle all the prompts
setTimeout(() => sendEnter(), 1000);
setTimeout(() => sendEnter(), 2000);
setTimeout(() => sendEnter(), 3000);
setTimeout(() => sendEnter(), 4000);
setTimeout(() => sendEnter(), 5000);

child.on('close', (code) => {
  console.log(`Database migration completed with exit code ${code}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Migration error:', error);
  process.exit(1);
});