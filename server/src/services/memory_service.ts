import 'dotenv/config';
import axios from 'axios';
import pool from '../db.js';
import { mutationEngine } from './mutation_engine.js';
import { Groq } from 'groq-sdk';

export class MemoryService {
  private embeddingCache: Map<string, number[]> = new Map();
  private lastCallTime: number = 0;
  private voyageQueue: Promise<void> = Promise.resolve();
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  // Sequential execution and mandatory 20s cooldown between any two calls to stay within Voyage AI free tier (3 RPM)
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

  /**
   * Main entry point for ingesting unstructured text.
   * Extracts facts and evolves the insight repository.
   */
  async processText(text: string, sourceUuid: string) {
    try {
      console.log('--- Starting Axiom Core Extraction ---');
      
      // 1. Extract Atomic Facts via Groq (Llama-3)
      const facts = await this.extractFacts(text);
      console.log('Extracted Facts:', facts);

      if (facts.length === 0) return { message: 'No insights extracted.', results: [] };

      // 2. Process each fact through the Mutation Engine
      const processedResults = [];
      for (const fact of facts) {
        // Enforce sequential embedding calls to respect rate limits
        const embedding = await this.queuedVoyageCall(fact);
        const mutationResult = await mutationEngine.mutate(fact, embedding, sourceUuid);
        processedResults.push({ fact, mutation: mutationResult });
      }

      return { 
        message: 'Processing complete', 
        insights_count: facts.length,
        results: processedResults 
      };
    } catch (error: any) {
      console.error('In MemoryService.processText:', error.message || error);
      throw error;
    }
  }

  private async extractFacts(text: string): Promise<string[]> {
    const prompt = `
      You are a Research Data Analyst. Your task is to extract atomic research insights from a transcript.
      An "Atomic Insight" is a short, independent claim about a technical feature, user behavior, or pain point.
      
      Instructions:
      - Break the text into individual claims.
      - Each claim must be a complete, stand-alone sentence.
      - Do NOT include filler words or conversational context.
      - Return the output as a JSON array of strings.
      
      Example Input: "The users were saying that the dashboard is too slow, but they really like the new dark mode toggle."
      Example Output: ["The dashboard is too slow.", "Users like the new dark mode toggle."]
      
      Input Text: "${text}"
      
      Output (JSON Array):`;

    const response = await this.groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '{}';
    try {
      // The model might return {"insights": [...]} or just the array.
      // Since I asked for a JSON object with response_format, I should ensure it's structured.
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.insights && Array.isArray(parsed.insights)) return parsed.insights;
      if (parsed.facts && Array.isArray(parsed.facts)) return parsed.facts;
      
      // Fallback: search for any array values
      for (const key in parsed) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
      
      return [];
    } catch (e) {
      console.error('Failed to parse Groq extraction result:', content);
      return [];
    }
  }

  private async getVoyageEmbedding(text: string, attempt: number = 1): Promise<number[]> {
    if (this.embeddingCache.has(text)) return this.embeddingCache.get(text)!;

    // Enforce 20s interval between calls to stay well within 3 RPM
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < 20000) {
      const waitTime = 20000 - timeSinceLastCall;
      console.log(`Cooling down embeddings... waiting ${Math.ceil(waitTime/1000)}s.`);
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
        console.warn(`Rate limit hit. Waiting 30s...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        return this.getVoyageEmbedding(text, attempt + 1);
      }
      throw err;
    }
  }
}

export const memoryService = new MemoryService();
