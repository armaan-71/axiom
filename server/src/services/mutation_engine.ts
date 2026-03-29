import { Groq } from 'groq-sdk';
import pool from '../db.js';

export class MutationEngine {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  /**
   * Evolves an insight state based on new evidence.
   * @param content The fact/claim string.
   * @param embedding The vector embedding of the claim.
   * @param sourceUuid Identifier for the source of this evidence.
   */
  async mutate(content: string, embedding: number[], sourceUuid: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Query for similar insights using cosine distance (<=>)
      // Vector similarity threshold > 0.85 means distance < 0.15
      const similarityRes = await client.query(
        `SELECT id, claim, support_count, conflict_count, status, (embedding <=> $1) as distance
         FROM insights
         ORDER BY distance ASC
         LIMIT 1`,
        [`[${embedding.join(',')}]`]
      );

      const match = similarityRes.rows[0];
      const isMatch = match && match.distance < 0.15;

      if (!isMatch) {
        // No match found: Create a new insight
        const newInsightRes = await client.query(
          `INSERT INTO insights (claim, embedding, support_count, last_mention, status)
           VALUES ($1, $2, 1, NOW(), 'verified')
           RETURNING id, claim`,
          [content, `[${embedding.join(',')}]`]
        );
        
        const insightId = newInsightRes.rows[0].id;

        // Add evidence
        await client.query(
          `INSERT INTO evidence (insight_id, type, content, source_uuid)
           VALUES ($1, 'support', $2, $3)`,
          [insightId, content, sourceUuid]
        );

        await client.query('COMMIT');
        return { action: 'created', insight: newInsightRes.rows[0] };
      } else {
        // Match found: Determine sentiment via Groq
        const existingInsight = match;
        const sentiment = await this.determineSentiment(existingInsight.claim, content);

        let { support_count, conflict_count } = existingInsight;
        if (sentiment === 'support') {
          support_count++;
        } else {
          conflict_count++;
        }

        // Check if status should evolve to 'contested'
        const total = support_count + conflict_count;
        let status = existingInsight.status;
        if (conflict_count / total > 0.3) {
          status = 'contested';
        }

        // Update insight
        await client.query(
          `UPDATE insights SET 
            support_count = $1, 
            conflict_count = $2, 
            status = $3, 
            last_mention = NOW(),
            embedding = $4
           WHERE id = $5`,
          [support_count, conflict_count, status, `[${embedding.join(',')}]`, existingInsight.id]
        );

        // Add evidence
        await client.query(
          `INSERT INTO evidence (insight_id, type, content, source_uuid)
           VALUES ($1, $2, $3, $4)`,
          [existingInsight.id, sentiment, content, sourceUuid]
        );

        await client.query('COMMIT');
        return { 
          action: 'updated', 
          insightId: existingInsight.id, 
          sentiment, 
          status 
        };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Mutation Engine Error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async determineSentiment(existingClaim: string, newEvidence: string): Promise<'support' | 'conflict'> {
    const prompt = `
      Compare the following two technical claims and determine if the new evidence supports or conflicts with the existing insight.
      
      Existing Insight: "${existingClaim}"
      New Evidence: "${newEvidence}"
      
      Instructions:
      - Reply with ONLY the word "support" or "conflict".
      - "support" means the new evidence confirms, elaborates on, or is consistent with the existing insight.
      - "conflict" means the new evidence contradicts, denies, or presents a significant counter-point to the existing insight.
      
      Sentiment:`;

    const response = await this.groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
    });

    const result = response.choices[0]?.message?.content?.trim().toLowerCase();
    
    if (result?.includes('support')) return 'support';
    if (result?.includes('conflict')) return 'conflict';
    
    // Default to support if ambiguous (conservative approach)
    return 'support';
  }
}

export const mutationEngine = new MutationEngine();
