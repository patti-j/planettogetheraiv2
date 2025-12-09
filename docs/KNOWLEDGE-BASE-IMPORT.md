# Knowledge Base Import Guide

## Overview

PlanetTogether uses a RAG (Retrieval-Augmented Generation) system to provide AI-powered answers from documentation. This guide explains how to import and refresh the knowledge base.

## Monthly Refresh Process

### Step 1: Export from HubSpot

1. Log in to HubSpot Knowledge Base
2. Go to **Service > Knowledge Base**
3. Click **Actions > Export**
4. Select **All articles** and download the export file
5. Save the file to `attached_assets/` folder

### Step 2: Run the Import Script

```bash
# Import and replace all existing content
npx tsx scripts/import-knowledge-base.ts ./attached_assets/your-export-file.txt --clear

# Or append to existing content (no --clear flag)
npx tsx scripts/import-knowledge-base.ts ./attached_assets/your-export-file.txt
```

### Step 3: Verify Import

```bash
# Check article count in database
npx tsx -e "
import { db } from './server/db';
import { knowledgeArticles, knowledgeChunks } from './shared/schema';
import { sql } from 'drizzle-orm';

async function check() {
  const [articles] = await db.select({ count: sql\`count(*)\` }).from(knowledgeArticles);
  const [chunks] = await db.select({ count: sql\`count(*)\` }).from(knowledgeChunks);
  console.log('Articles:', articles.count);
  console.log('Chunks:', chunks.count);
  process.exit(0);
}
check();
"
```

## Supported File Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| HubSpot TSV | `.txt` | Default export format, UTF-16 encoded |
| Excel | `.xlsx` | Alternative format |
| CSV | `.csv` | Comma-separated values |

## Expected Columns

The import script expects these columns (HubSpot format):

| Column Name | Required | Description |
|-------------|----------|-------------|
| Article title | Yes | Article headline |
| Article body | Yes | HTML content (auto-stripped) |
| Article URL | No | Link to original article |
| Category name | No | Primary category |
| Subcategory name | No | Secondary category |
| Article subtitle | No | Optional subtitle |
| Tags | No | Comma-separated tags |

## How RAG Works

1. **Chunking**: Articles are split into ~400 token passages for better retrieval
2. **Search**: When a user asks Max a question, relevant chunks are retrieved
3. **Generation**: Max uses the retrieved passages to generate an answer with citations

## Script Options

```bash
npx tsx scripts/import-knowledge-base.ts <file-path> [options]

Options:
  --clear    Clear existing KB content before import
  --help     Show help message
```

## Troubleshooting

### "File not found" error
- Ensure the file path is correct
- Use full path: `./attached_assets/filename.txt`

### "No articles to import" 
- Check that the file has content
- Verify the column names match expected format

### Encoding issues
- HubSpot exports are UTF-16; the script handles this automatically
- If using Excel, save as `.xlsx` format

## Database Tables

| Table | Purpose |
|-------|---------|
| `knowledge_articles` | Full article content, metadata |
| `knowledge_chunks` | Chunked passages for retrieval |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/knowledge/search` | GET | Search KB with query |
| `/api/knowledge/articles` | GET | List all articles |
| `/api/knowledge/upload` | POST | Add single article |

## Files

- `scripts/import-knowledge-base.ts` - Import script
- `server/services/knowledge-retrieval.service.ts` - RAG service
- `server/routes.ts` - KB API endpoints
- `shared/schema.ts` - Database schema (knowledgeArticles, knowledgeChunks)
