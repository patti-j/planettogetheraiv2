import { openai } from './openai-config';
import { getDb } from '../db';
import { knowledgeArticles, knowledgeChunks, KnowledgeArticle, KnowledgeChunk } from '@shared/schema';
import { eq, sql, and, like, desc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export interface KBSearchResult {
  articleId: number;
  chunkId: number;
  title: string;
  content: string;
  category: string | null;
  sourceUrl: string | null;
  score: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

interface EmbeddingCache {
  embeddings: Map<string, number[]>;
  lastUpdated: Date;
}

export class KnowledgeRetrievalService {
  private static instance: KnowledgeRetrievalService;
  private embeddingCache: EmbeddingCache;
  private cacheFile: string;
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly MAX_RESULTS = 6;
  private readonly CHUNK_SIZE = 500; // Target tokens per chunk
  private readonly CHUNK_OVERLAP = 50; // Overlap between chunks
  
  // Hybrid search weights
  private readonly SEMANTIC_WEIGHT = 0.70;
  private readonly KEYWORD_WEIGHT = 0.30;

  private constructor() {
    this.cacheFile = path.join(process.cwd(), '.cache', 'knowledge-embeddings.json');
    this.embeddingCache = this.loadCache();
  }

  static getInstance(): KnowledgeRetrievalService {
    if (!KnowledgeRetrievalService.instance) {
      KnowledgeRetrievalService.instance = new KnowledgeRetrievalService();
    }
    return KnowledgeRetrievalService.instance;
  }

  private loadCache(): EmbeddingCache {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf-8');
        const parsed = JSON.parse(data);
        return {
          embeddings: new Map(Object.entries(parsed.embeddings)),
          lastUpdated: new Date(parsed.lastUpdated)
        };
      }
    } catch (error) {
      console.error('[KnowledgeRetrieval] Failed to load cache:', error);
    }

    return {
      embeddings: new Map(),
      lastUpdated: new Date()
    };
  }

  private saveCache(): void {
    try {
      const cacheDir = path.dirname(this.cacheFile);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const data = {
        embeddings: Object.fromEntries(this.embeddingCache.embeddings),
        lastUpdated: this.embeddingCache.lastUpdated
      };

      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
      console.log('[KnowledgeRetrieval] Cache saved with', this.embeddingCache.embeddings.size, 'embeddings');
    } catch (error) {
      console.error('[KnowledgeRetrieval] Failed to save cache:', error);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('[KnowledgeRetrieval] Failed to generate embedding:', error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async search(query: string, topK: number = this.MAX_RESULTS): Promise<KBSearchResult[]> {
    console.log(`[KnowledgeRetrieval] Searching for: "${query}"`);
    
    try {
      // Get query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Fetch all chunks with embeddings
      const chunks = await getDb().select({
        chunkId: knowledgeChunks.id,
        articleId: knowledgeChunks.articleId,
        content: knowledgeChunks.content,
        embedding: knowledgeChunks.embedding,
      })
      .from(knowledgeChunks)
      .where(sql`${knowledgeChunks.embedding} IS NOT NULL`);

      if (chunks.length === 0) {
        console.log('[KnowledgeRetrieval] No chunks with embeddings found, falling back to keyword search');
        return this.keywordSearch(query, topK);
      }

      // Calculate semantic scores
      const scoredChunks = chunks.map(chunk => {
        const embedding = chunk.embedding as number[];
        const semanticScore = this.cosineSimilarity(queryEmbedding, embedding);
        
        // Simple keyword bonus
        const queryTerms = query.toLowerCase().split(/\s+/);
        const contentLower = chunk.content.toLowerCase();
        const keywordMatches = queryTerms.filter(term => contentLower.includes(term)).length;
        const keywordScore = keywordMatches / queryTerms.length;
        
        const finalScore = (semanticScore * this.SEMANTIC_WEIGHT) + (keywordScore * this.KEYWORD_WEIGHT);
        
        return {
          ...chunk,
          score: finalScore,
          matchType: 'hybrid' as const
        };
      });

      // Sort by score and take top K
      scoredChunks.sort((a, b) => b.score - a.score);
      const topChunks = scoredChunks.slice(0, topK);

      // Fetch article details for top chunks
      const results: KBSearchResult[] = [];
      for (const chunk of topChunks) {
        const article = await getDb().select()
          .from(knowledgeArticles)
          .where(eq(knowledgeArticles.id, chunk.articleId))
          .limit(1);
        
        if (article.length > 0) {
          results.push({
            articleId: chunk.articleId,
            chunkId: chunk.chunkId,
            title: article[0].title,
            content: chunk.content,
            category: article[0].category,
            sourceUrl: article[0].sourceUrl,
            score: chunk.score,
            matchType: chunk.matchType
          });
        }
      }

      console.log(`[KnowledgeRetrieval] Found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('[KnowledgeRetrieval] Search failed, falling back to keyword search:', error);
      return this.keywordSearch(query, topK);
    }
  }

  private async keywordSearch(query: string, topK: number): Promise<KBSearchResult[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    if (terms.length === 0) return [];

    // Search articles by title/content
    const articles = await getDb().select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.isActive, true))
      .limit(50);

    const scored = articles.map(article => {
      const searchText = `${article.title} ${article.content}`.toLowerCase();
      const matches = terms.filter(term => searchText.includes(term)).length;
      return {
        article,
        score: matches / terms.length
      };
    });

    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, topK).map(item => ({
      articleId: item.article.id,
      chunkId: 0, // No chunk for keyword search
      title: item.article.title,
      content: item.article.content.substring(0, 500) + '...',
      category: item.article.category,
      sourceUrl: item.article.sourceUrl,
      score: item.score,
      matchType: 'keyword' as const
    }));
  }

  chunkText(text: string, chunkSize: number = this.CHUNK_SIZE): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    // Approximate tokens as words * 1.3
    const wordsPerChunk = Math.floor(chunkSize / 1.3);
    const overlapWords = Math.floor(this.CHUNK_OVERLAP / 1.3);
    
    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + wordsPerChunk, words.length);
      const chunk = words.slice(start, end).join(' ');
      
      if (chunk.trim()) {
        chunks.push(chunk);
      }
      
      // Move start forward, accounting for overlap
      start = end - overlapWords;
      if (start >= end) start = end; // Prevent infinite loop
    }
    
    return chunks;
  }

  async ingestArticle(article: {
    title: string;
    content: string;
    category?: string;
    tags?: string;
    source?: string;
    sourceUrl?: string;
    createdBy?: number;
  }): Promise<{ articleId: number; chunkCount: number }> {
    console.log(`[KnowledgeRetrieval] Ingesting article: ${article.title}`);
    
    // Insert article
    const [insertedArticle] = await getDb().insert(knowledgeArticles).values({
      title: article.title,
      content: article.content,
      category: article.category || null,
      tags: article.tags || null,
      source: article.source || null,
      sourceUrl: article.sourceUrl || null,
      createdBy: article.createdBy || null,
      isActive: true,
    }).returning();

    // Chunk the content
    const chunks = this.chunkText(article.content);
    console.log(`[KnowledgeRetrieval] Created ${chunks.length} chunks for article ${insertedArticle.id}`);
    
    // Generate embeddings and insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      const embedding = await this.generateEmbedding(`${article.title}: ${chunkContent}`);
      
      await getDb().insert(knowledgeChunks).values({
        articleId: insertedArticle.id,
        chunkIndex: i,
        content: chunkContent,
        embedding: embedding as any,
        tokenCount: Math.ceil(chunkContent.split(/\s+/).length * 1.3),
        model: this.EMBEDDING_MODEL,
      });
    }

    console.log(`[KnowledgeRetrieval] Article ${insertedArticle.id} ingested with ${chunks.length} chunks`);
    return { articleId: insertedArticle.id, chunkCount: chunks.length };
  }

  async reindexArticle(articleId: number): Promise<void> {
    console.log(`[KnowledgeRetrieval] Reindexing article ${articleId}`);
    
    // Get article
    const [article] = await getDb().select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.id, articleId));
    
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    // Delete existing chunks
    await getDb().delete(knowledgeChunks)
      .where(eq(knowledgeChunks.articleId, articleId));

    // Re-chunk and embed
    const chunks = this.chunkText(article.content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      const embedding = await this.generateEmbedding(`${article.title}: ${chunkContent}`);
      
      await getDb().insert(knowledgeChunks).values({
        articleId: article.id,
        chunkIndex: i,
        content: chunkContent,
        embedding: embedding as any,
        tokenCount: Math.ceil(chunkContent.split(/\s+/).length * 1.3),
        model: this.EMBEDDING_MODEL,
      });
    }

    console.log(`[KnowledgeRetrieval] Article ${articleId} reindexed with ${chunks.length} chunks`);
  }

  async initializeAllEmbeddings(): Promise<void> {
    console.log('[KnowledgeRetrieval] Initializing all embeddings...');
    
    // Get all articles without embeddings
    const articlesWithoutChunks = await getDb().execute(sql`
      SELECT a.id, a.title, a.content
      FROM knowledge_articles a
      LEFT JOIN knowledge_chunks c ON a.id = c.article_id
      WHERE a.is_active = true AND c.id IS NULL
    `);

    const articles = articlesWithoutChunks.rows as { id: number; title: string; content: string }[];
    console.log(`[KnowledgeRetrieval] Found ${articles.length} articles needing embeddings`);

    for (const article of articles) {
      await this.reindexArticle(article.id);
    }

    console.log('[KnowledgeRetrieval] Embeddings initialization complete');
  }

  async getArticleCount(): Promise<number> {
    const result = await getDb().select({ count: sql<number>`count(*)` })
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.isActive, true));
    return Number(result[0]?.count || 0);
  }

  async getChunkCount(): Promise<number> {
    const result = await getDb().select({ count: sql<number>`count(*)` })
      .from(knowledgeChunks);
    return Number(result[0]?.count || 0);
  }

  clearCache(): void {
    this.embeddingCache = {
      embeddings: new Map(),
      lastUpdated: new Date()
    };
    
    if (fs.existsSync(this.cacheFile)) {
      fs.unlinkSync(this.cacheFile);
    }
    
    console.log('[KnowledgeRetrieval] Cache cleared');
  }
}

export const knowledgeRetrievalService = KnowledgeRetrievalService.getInstance();
