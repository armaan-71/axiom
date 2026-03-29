import 'dotenv/config';
import pool from '../db.js';
import { Groq } from 'groq-sdk';

export class DecisionService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  /**
   * Fetches an insight and all its historical evidence, then uses Groq to
   * synthesize a strategic decision.
   */
  async getDecision(insightId: string) {
    try {
      // 1. Fetch Insight and Evidence in parallel
      const [insightResult, evidenceResult] = await Promise.all([
        pool.query('SELECT * FROM insights WHERE id = $1', [insightId]),
        pool.query('SELECT * FROM evidence WHERE insight_id = $1 ORDER BY created_at DESC', [insightId])
      ]);

      if (insightResult.rows.length === 0) {
        throw new Error('Insight not found');
      }

      const insight = insightResult.rows[0];
      const evidence = evidenceResult.rows;

      // 2. Prepare the evidence list text for the prompt
      const evidenceListText = evidence.map((e: any) => 
        `- [${e.type.toUpperCase()}] ${e.content} (Source: ${e.source_uuid})`
      ).join('\n');

      // 3. Construct the Groq prompt
      const prompt = `
Act as a seniority-level Product Strategy Lead. Your task is to analyze a "Contested" or "Verified" research insight and provide actionable evidence-backed hypotheses.

Insight Claim: "${insight.claim}"
Current Support Count: ${insight.support_count}
Current Conflict Count: ${insight.conflict_count}
Status: ${insight.status}

Full Evidence List (Supporting & Conflicting):
${evidenceListText}

Synthesize this data into:
1. IMPLICATION: How does this impact the business/KPIs? (e.g., "High risk to Q3 retention")
2. SUGGESTED ACTION: A concrete product or marketing experiment (e.g., "A/B test a simplified 2-step onboarding")
3. CONFIDENCE SCORE (0-100): Based on the support-to-conflict ratio and recency.

Output ONLY as a JSON object: { "implication": "...", "suggested_action": "...", "confidence": 0 }
      `.trim();

      // 4. Call Groq
      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{}';
      const synthesis = JSON.parse(content);

      return {
        ...synthesis,
        evidence: evidence.map((e: any) => ({
          type: e.type,
          content: e.content,
          source_uuid: e.source_uuid,
          created_at: e.created_at
        }))
      };

    } catch (error: any) {
      console.error('In DecisionService.getDecision:', error.message || error);
      throw error;
    }
  }
}

export const decisionService = new DecisionService();
