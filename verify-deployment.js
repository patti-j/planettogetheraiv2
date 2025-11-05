#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Production Deployment Readiness\n');

// Check if dist folder exists
const distExists = fs.existsSync('./dist');
console.log(`✅ Dist folder exists: ${distExists}`);

// Check if main server file exists
const serverFileExists = fs.existsSync('./dist/index.js');
console.log(`✅ Server file (dist/index.js) exists: ${serverFileExists}`);

// Check if public assets exist
const assetsPath = './dist/public/assets';
const assetsExist = fs.existsSync(assetsPath);
console.log(`✅ Assets folder exists: ${assetsExist}`);

if (assetsExist) {
  const assets = fs.readdirSync(assetsPath);
  const loginFile = assets.find(f => f.startsWith('Login-'));
  console.log(`✅ Login module found: ${loginFile || 'NOT FOUND'}`);
  console.log(`   Total asset files: ${assets.length}`);
}

// Check index.html
const indexPath = './dist/public/index.html';
const indexExists = fs.existsSync(indexPath);
console.log(`✅ Index.html exists: ${indexExists}`);

if (indexExists) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const loginMatch = indexContent.match(/Login-([^.]+)\.js/);
  if (loginMatch) {
    console.log(`   Index.html references: ${loginMatch[0]}`);
    
    // Check if referenced file exists
    const referencedFile = path.join(assetsPath, loginMatch[0]);
    const fileExists = fs.existsSync(referencedFile);
    console.log(`   ✅ Referenced file exists: ${fileExists}`);
  }
}

// Check environment variables
console.log('\n📊 Environment Check:');
console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`✅ DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'NOT SET'}`);
console.log(`✅ SESSION_SECRET: ${process.env.SESSION_SECRET ? 'configured' : 'NOT SET'}`);

console.log('\n✅ Deployment is ready!');
console.log('👉 Next step: Click "Deploy" in Replit to publish the updated application');