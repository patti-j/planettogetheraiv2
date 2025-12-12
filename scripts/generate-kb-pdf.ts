/**
 * Knowledge Base PDF Generator
 * 
 * Generates a PDF from the HubSpot Knowledge Base CSV export.
 * The CSV contains original HTML content which preserves formatting and internal links.
 * 
 * Usage: npx tsx scripts/generate-kb-pdf.ts
 * 
 * Alternative (recommended for complex CSV): python3 scripts/generate-kb-pdf.py
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const CSV_PATH = 'attached_assets/hubspot-knowledge-base-export-empty-2025-12-11_1765485879660.csv';

console.log('For best results with complex CSV files, use the Python version:');
console.log('  python3 scripts/generate-kb-pdf.py');
console.log('');
console.log('Running Python script...');

try {
  execSync('python3 scripts/generate-kb-pdf.py', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running Python script:', error);
  process.exit(1);
}
