/**
 * Knowledge Base Import Script
 * 
 * Imports HubSpot knowledge base exports into PlanetTogether's KB system.
 * Supports both TSV (HubSpot default) and Excel formats.
 * 
 * Usage:
 *   npx tsx scripts/import-knowledge-base.ts <file-path> [--clear]
 * 
 * Options:
 *   --clear    Clear existing KB content before import (optional)
 * 
 * Examples:
 *   npx tsx scripts/import-knowledge-base.ts ./kb-export.txt
 *   npx tsx scripts/import-knowledge-base.ts ./kb-export.xlsx --clear
 * 
 * Supported formats:
 *   - .txt (HubSpot TSV export, UTF-16 or UTF-8)
 *   - .xlsx (Excel file)
 *   - .csv (Comma-separated)
 * 
 * Expected columns (HubSpot format):
 *   - Article title
 *   - Article subtitle (optional)
 *   - Article URL
 *   - Article body (HTML content)
 *   - Category name (optional)
 *   - Subcategory name (optional)
 */

import * as fs from 'fs';
import * as path from 'path';
import { db } from '../server/db';
import { knowledgeArticles, knowledgeChunks } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

interface KBArticle {
  title: string;
  subtitle?: string;
  url?: string;
  content: string;
  category?: string;
  subcategory?: string;
  tags?: string;
}

// Strip HTML tags and decode entities
function stripHtml(html: string): string {
  if (!html) return '';
  
  // Remove script and style tags with content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Replace common block elements with newlines
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr)[^>]*>/gi, '\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&rsquo;/g, "'");
  text = text.replace(/&lsquo;/g, "'");
  text = text.replace(/&rdquo;/g, '"');
  text = text.replace(/&ldquo;/g, '"');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');
  text = text.replace(/&#\d+;/g, '');
  
  // Normalize whitespace
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  
  return text.trim();
}

// Split content into chunks of ~400 tokens (roughly 1600 chars)
function chunkContent(content: string, maxChars: number = 1600, overlap: number = 200): string[] {
  const chunks: string[] = [];
  const sentences = content.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Start next chunk with overlap from end of current
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5)).join(' ');
      currentChunk = overlapWords + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}

// Parse TSV content (HubSpot format)
function parseTSV(content: string): KBArticle[] {
  const lines = content.split('\n');
  if (lines.length < 2) {
    throw new Error('TSV file must have header row and at least one data row');
  }
  
  // Parse header
  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
  console.log('📋 Detected columns:', headers);
  
  // Map HubSpot column names to our fields
  const columnMap: Record<string, string> = {
    'article title': 'title',
    'article subtitle': 'subtitle',
    'article url': 'url',
    'article body': 'content',
    'category name': 'category',
    'subcategory name': 'subcategory',
    'tags': 'tags'
  };
  
  const fieldIndices: Record<string, number> = {};
  headers.forEach((h, i) => {
    const mapped = columnMap[h] || h.replace(/\s+/g, '_');
    fieldIndices[mapped] = i;
  });
  
  const articles: KBArticle[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split('\t');
    
    const title = values[fieldIndices['title']]?.trim();
    const content = values[fieldIndices['content']]?.trim();
    
    if (!title || !content) {
      console.warn(`⚠️  Skipping row ${i + 1}: missing title or content`);
      continue;
    }
    
    articles.push({
      title,
      subtitle: values[fieldIndices['subtitle']]?.trim(),
      url: values[fieldIndices['url']]?.trim(),
      content: stripHtml(content),
      category: values[fieldIndices['category']]?.trim() || values[fieldIndices['subcategory']]?.trim(),
      tags: values[fieldIndices['tags']]?.trim()
    });
  }
  
  return articles;
}

// Parse Excel file
async function parseExcel(filePath: string): Promise<KBArticle[]> {
  const xlsx = await import('xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet);
  
  console.log('📋 Detected columns:', Object.keys(rows[0] || {}));
  
  const articles: KBArticle[] = [];
  
  for (const row of rows) {
    // Handle various column name formats
    const title = row['Article title'] || row['Title'] || row['title'];
    const content = row['Article body'] || row['Content'] || row['content'] || row['Body'];
    
    if (!title || !content) {
      console.warn(`⚠️  Skipping row: missing title or content`);
      continue;
    }
    
    articles.push({
      title: String(title).trim(),
      subtitle: (row['Article subtitle'] || row['Subtitle'])?.toString().trim(),
      url: (row['Article URL'] || row['URL'] || row['url'])?.toString().trim(),
      content: stripHtml(String(content)),
      category: (row['Category name'] || row['Category'] || row['category'])?.toString().trim(),
      subcategory: (row['Subcategory name'] || row['Subcategory'])?.toString().trim(),
      tags: (row['Tags'] || row['tags'])?.toString().trim()
    });
  }
  
  return articles;
}

// Read file with encoding detection
function readFileWithEncoding(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  
  // Check for UTF-16 BOM
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    console.log('📄 Detected UTF-16 LE encoding');
    return buffer.toString('utf16le').substring(1); // Skip BOM
  }
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    console.log('📄 Detected UTF-16 BE encoding');
    // Convert UTF-16 BE to string
    const swapped = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i += 2) {
      swapped[i] = buffer[i + 1];
      swapped[i + 1] = buffer[i];
    }
    return swapped.toString('utf16le').substring(1);
  }
  
  // Default to UTF-8
  console.log('📄 Using UTF-8 encoding');
  return buffer.toString('utf8');
}

async function importKnowledgeBase(filePath: string, clearExisting: boolean = false): Promise<void> {
  console.log('\n🚀 Knowledge Base Import Tool\n');
  console.log(`📁 Input file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const ext = path.extname(filePath).toLowerCase();
  let articles: KBArticle[];
  
  // Parse based on file type
  if (ext === '.xlsx' || ext === '.xls') {
    articles = await parseExcel(filePath);
  } else {
    // TSV or CSV
    const content = readFileWithEncoding(filePath);
    articles = parseTSV(content);
  }
  
  console.log(`\n📚 Parsed ${articles.length} articles`);
  
  if (articles.length === 0) {
    console.log('❌ No articles to import');
    return;
  }
  
  // Clear existing if requested
  if (clearExisting) {
    console.log('\n🗑️  Clearing existing knowledge base...');
    await db.delete(knowledgeChunks);
    await db.delete(knowledgeArticles);
    console.log('✅ Cleared existing articles and chunks');
  }
  
  // Import articles
  console.log('\n📥 Importing articles...');
  let imported = 0;
  let chunksCreated = 0;
  
  for (const article of articles) {
    try {
      // Build category from category + subcategory
      let fullCategory = article.category;
      if (article.subcategory) {
        fullCategory = fullCategory ? `${fullCategory} > ${article.subcategory}` : article.subcategory;
      }
      
      // Insert article
      const [inserted] = await db.insert(knowledgeArticles).values({
        title: article.title,
        content: article.content,
        category: fullCategory || null,
        sourceUrl: article.url || null,
        tags: article.tags || null,
        isActive: true
      }).returning();
      
      // Create chunks
      const chunks = chunkContent(article.content);
      for (let i = 0; i < chunks.length; i++) {
        await db.insert(knowledgeChunks).values({
          articleId: inserted.id,
          chunkIndex: i,
          content: chunks[i],
          tokenCount: Math.ceil(chunks[i].length / 4) // Rough token estimate
        });
        chunksCreated++;
      }
      
      imported++;
      if (imported % 10 === 0) {
        console.log(`   Imported ${imported}/${articles.length} articles...`);
      }
    } catch (error) {
      console.error(`❌ Failed to import "${article.title}":`, error);
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   📚 Articles imported: ${imported}`);
  console.log(`   📄 Chunks created: ${chunksCreated}`);
  
  // Show summary
  const [{ count: totalArticles }] = await db.select({ count: sql<number>`count(*)` }).from(knowledgeArticles);
  const [{ count: totalChunks }] = await db.select({ count: sql<number>`count(*)` }).from(knowledgeChunks);
  
  console.log(`\n📊 Database totals:`);
  console.log(`   📚 Total articles: ${totalArticles}`);
  console.log(`   📄 Total chunks: ${totalChunks}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Knowledge Base Import Script

Usage:
  npx tsx scripts/import-knowledge-base.ts <file-path> [--clear]

Options:
  --clear    Clear existing KB content before import

Examples:
  npx tsx scripts/import-knowledge-base.ts ./attached_assets/kb-export.txt
  npx tsx scripts/import-knowledge-base.ts ./kb-export.xlsx --clear
`);
    process.exit(0);
  }
  
  const filePath = args[0];
  const clearExisting = args.includes('--clear');
  
  try {
    await importKnowledgeBase(filePath, clearExisting);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
