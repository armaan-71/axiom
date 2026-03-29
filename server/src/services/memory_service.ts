import 'dotenv/config';
import { Memory } from 'mem0ai/oss';
import axios from 'axios';
import pool from '../db.js';
import pg from 'pg';
import { URL } from 'url';

// GLOBAL MONKEY PATCH: Prevent "Client has already been connected" and "Connection terminated"
const originalConnect = pg.Client.prototype.connect;
pg.Client.prototype.connect = async function(callback?: (err: Error) => void) {
  if ((this as any)._connected || (this as any)._connecting) {
    if (callback) callback(null as any);
    return Promise.resolve();
  }
  return originalConnect.apply(this, [callback as any]);
};

export class MemoryService {
  private memory: Memory;
  private embeddingCache: Map<string, number[]> = new Map();
  private lastCallTime: number = 0;
  private voyageQueue: Promise<void> = Promise.resolve();

  constructor() {
    const dbUrl = new URL(process.env.DATABASE_URL!);
    const dbConfig = {
      user: dbUrl.username,
      password: decodeURIComponent(dbUrl.password),
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || '5432'),
      dbname: dbUrl.pathname.slice(1) || 'postgres',
    };

    this.memory = new Memory({
      llm: {
        provider: 'groq',
        config: {
          model: 'llama-3.3-70b-versatile',
          apiKey: process.env.GROQ_API_KEY,
        },
      },
      embedder: {
        provider: 'openai',
        config: {
          apiKey: process.env.VOYAGE_API_KEY,
          baseURL: 'https://api.voyageai.com/v1',
          model: 'voyage-code-3',
        },
      },
      vectorStore: {
        provider: 'pgvector',
        config: {
          ...dbConfig,
          collectionName: 'memories',
          embeddingModelDims: 1024,
        },
      },
      customPrompt: "Extract facts from the text as independent, short claims. Focus on technical features and project names. Return ONLY the claims.",
    });

    // REUSE CACHE AND ENFORCE 3 RPM LIMIT SEQUENTIALLY
    (this.memory as any).embedder = {
      embed: async (text: string) => this.queuedVoyageCall(text),
      embedBatch: async (texts: string[]) => {
        const results = [];
        for (const text of texts) {
          results.push(await this.queuedVoyageCall(text));
        }
        return results;
      },
    };
  }

  // Sequential execution and mandatory 20s cooldown between any two calls
  private async queuedVoyageCall(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.voyageQueue = this.voyageQueue.then(async () => {
        try {
          const result = await this.getVoyageEmbedding(text);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async processText(text: string, sourceUuid: string) {
    try {
      console.log('--- Starting Resilient Ingestion ---');
      const result = await this.memory.add(text, { userId: 'system_extractor' });
      console.log('mem0 result:', JSON.stringify(result, null, 2));

      const facts = result.results.map((item: any) => item.memory);
      if (facts.length === 0) return { message: 'No facts extracted.', facts: [] };

      const processedFacts = [];
      for (const fact of facts) {
        const embedding = await this.getVoyageEmbedding(fact);
        const insight = await this.storeInsight(fact, embedding, sourceUuid);
        processedFacts.push(insight);
      }

      return { message: 'Processing complete', facts: processedFacts };
    } catch (error: any) {
      console.error('In MemoryService.processText:', error.message || error);
      throw error;
    }
  }

  private async getVoyageEmbedding(text: string, attempt: number = 1): Promise<number[]> {
    if (this.embeddingCache.has(text)) return this.embeddingCache.get(text)!;

    // Enforce 20s interval between calls to stay well within 3 RPM
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < 20000) {
      const waitTime = 20000 - timeSinceLastCall;
      console.log(`Cooling down... waiting ${Math.ceil(waitTime/1000)}s to stay within 3 RPM.`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    console.log(`Calling Voyage AI: "${text.substring(0, 30)}..."`);
    try {
      this.lastCallTime = Date.now();
      const response = await axios.post(
        'https://api.voyageai.com/v1/embeddings',
        { input: text, model: 'voyage-code-3' },
        { headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` } }
      );
      const embedding = response.data.data[0].embedding;
      this.embeddingCache.set(text, embedding);
      return embedding;
    } catch (err: any) {
      if (err.response?.status === 429 && attempt < 3) {
        console.warn(`Rate limit hit despite cooldown. Waiting 30s and retrying...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        return this.getVoyageEmbedding(text, attempt + 1);
      }
      throw err;
    }
  }

  private async storeInsight(claim: string, embedding: number[], sourceUuid: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insightRes = await client.query(
        `INSERT INTO insights (claim, embedding, support_count, last_mention)
         VALUES ($1, $2, 1, NOW())
         ON CONFLICT (claim) DO UPDATE SET 
           support_count = insights.support_count + 1,
           last_mention = NOW(),
           embedding = EXCLUDED.embedding
         RETURNING id, claim`,
        [claim, `[${embedding.join(',')}]`]
      );
      const insightId = insightRes.rows[0].id;
      await client.query(
        `INSERT INTO evidence (insight_id, type, content, source_uuid)
         VALUES ($1, 'support', $2, $3)`,
        [insightId, claim, sourceUuid]
      );
      await client.query('COMMIT');
      return insightRes.rows[0];
    } finally {
      client.release();
    }
  }
}

export const memoryService = new MemoryService();
