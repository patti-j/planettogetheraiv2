#!/usr/bin/env node
/**
 * Runtime Error Checker for PlanetTogether Application
 * Automatically checks for JavaScript runtime errors after fixes
 */

import { execSync } from 'child_process';

const PAGES_TO_CHECK = [
  '/',
  '/dashboard', 
  '/production-scheduler-pro',
  '/boards',
  '/reports'
];

const ERROR_PATTERNS = [
  'Cannot read properties of undefined',
  'TypeError:',
  'ReferenceError:',
  'cls',
  'TreeColumn',
  'runtime error'
];

async function checkForErrors() {
  console.log('🔍 Checking for runtime errors...\n');
  
  let totalErrors = 0;
  
  for (const page of PAGES_TO_CHECK) {
    console.log(`📄 Checking page: ${page}`);
    
    try {
      // Check if server is running
      const response = execSync(`curl -s -w "%{http_code}" http://localhost:5000${page}`, 
        { encoding: 'utf8', timeout: 10000 });
      
      // Check HTTP status
      const httpCode = response.slice(-3);
      if (httpCode !== '200') {
        console.log(`   ❌ HTTP ${httpCode} error`);
        totalErrors++;
        continue;
      }
      
      // Check for error patterns in response
      const pageContent = response.slice(0, -3);
      let pageErrors = 0;
      
      ERROR_PATTERNS.forEach(pattern => {
        const matches = (pageContent.match(new RegExp(pattern, 'gi')) || []).length;
        if (matches > 0) {
          console.log(`   ❌ Found ${matches} instance(s) of: ${pattern}`);
          pageErrors += matches;
        }
      });
      
      if (pageErrors === 0) {
        console.log(`   ✅ No runtime errors detected`);
      } else {
        totalErrors += pageErrors;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to check page: ${error.message}`);
      totalErrors++;
    }
    
    console.log('');
  }
  
  console.log(`📊 Summary: ${totalErrors > 0 ? '❌' : '✅'} Total errors found: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('🎉 All pages are error-free!');
  } else {
    console.log('⚠️ Runtime errors detected. Please fix before marking task complete.');
  }
  
  return totalErrors;
}

// Export for use in other scripts
if (require.main === module) {
  checkForErrors().then(errorCount => {
    process.exit(errorCount > 0 ? 1 : 0);
  });
} else {
  module.exports = { checkForErrors };
}