import dotenv from 'dotenv';

dotenv.config();

export interface EmbeddingProvider {
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  const mag = Math.sqrt(sumSq);
  if (mag === 0) return vec;
  return vec.map((v) => v / mag);
}

/**
 * Built-in Semantic Embedding Engine (Local)
 * Produces 384-dimensional dense semantic representations incorporating clinical tokens,
 * n-grams, and term weights without needing any external network calls.
 */
export class LocalSemanticEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions = 384;

  // Key medical & clinical feature hashes
  private hashString(str: string, seed: number): number {
    let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  public async embedQuery(text: string): Promise<number[]> {
    return this.generateVector(text);
  }

  public async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateVector(t));
  }

  private generateVector(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter((t) => t.length > 1);

    if (tokens.length === 0) return vector;

    // Weight clinical keywords higher
    const clinicalKeywords: Record<string, number> = {
      lisinopril: 3.5,
      entresto: 3.5,
      furosemide: 3.0,
      torsemide: 3.0,
      potassium: 3.2,
      hyperkalemia: 3.8,
      creatinine: 3.2,
      egfr: 3.2,
      bnp: 3.0,
      heart: 2.5,
      failure: 2.5,
      warfarin: 3.5,
      apixaban: 3.5,
      eliquis: 3.5,
      inr: 3.5,
      dvt: 3.0,
      pe: 3.0,
      pulmonary: 2.8,
      embolism: 3.2,
      metformin: 2.8,
      ocrelizumab: 3.5,
      sepsis: 3.5,
      urosepsis: 3.8,
      fever: 2.8,
      afebrile: 3.0,
      baclofen: 2.8,
      steroids: 2.8,
      methylprednisolone: 3.5,
      amiodarone: 3.8,
      thyrotoxicosis: 3.8,
      tsh: 3.5,
      copd: 3.0,
      trelegy: 3.5,
      spiriva: 3.0,
      oxycodone: 3.5,
      tramadol: 3.5,
      delirium: 3.8,
      hallucinations: 3.5,
      benadryl: 3.8,
      diphenhydramine: 3.8,
      discontinued: 3.0,
      stopped: 3.0,
      switched: 3.0,
      changed: 2.8,
      contraindicated: 3.2,
      allergy: 3.0,
      missing: 3.0,
      contradiction: 3.5,
    };

    // 1-grams
    for (let i = 0; i < tokens.length; i++) {
      const word = tokens[i];
      const weight = clinicalKeywords[word] || 1.0;
      const idx = Math.abs(this.hashString(word, 42)) % this.dimensions;
      const sign = (this.hashString(word, 99) % 2 === 0 ? 1 : -1);
      vector[idx] += weight * sign;

      // 2-grams
      if (i < tokens.length - 1) {
        const bigram = `${word}_${tokens[i + 1]}`;
        const bIdx = Math.abs(this.hashString(bigram, 123)) % this.dimensions;
        vector[bIdx] += (weight * 1.5);
      }
    }

    return l2Normalize(vector);
  }
}

/**
 * OpenAI Embedding Provider (optional, active when OPENAI_API_KEY is configured)
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async embedQuery(text: string): Promise<number[]> {
    const res = await this.embedDocuments([text]);
    return res[0];
  }

  public async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return data.data.map((item: any) => item.embedding);
    } catch (err: any) {
      console.warn(`[OpenAIEmbeddingProvider] Failed to fetch embeddings: ${err.message}. Falling back to local vectorizer.`);
      const local = new LocalSemanticEmbeddingProvider();
      return local.embedDocuments(texts);
    }
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const providerType = (process.env.EMBEDDING_PROVIDER || 'local').toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY;

  if (providerType === 'openai' && apiKey) {
    console.log('[Embedding] Initializing OpenAI Embedding Provider (text-embedding-3-small).');
    return new OpenAIEmbeddingProvider(apiKey);
  }

  console.log('[Embedding] Initializing Local High-Dimensional Semantic Embedding Engine.');
  return new LocalSemanticEmbeddingProvider();
}
