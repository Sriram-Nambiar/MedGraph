import { VectorDocument, ClinicalNote } from '../schemas/types.js';
import { EmbeddingProvider, createEmbeddingProvider, cosineSimilarity } from './embedding-provider.js';

export interface VectorSearchParams {
  patient_id: string;
  query: string;
  top_k?: number;
  min_score?: number;
  encounter_id?: string;
  admission_id?: string;
  note_type?: string;
  start_date?: string;
  end_date?: string;
}

export class ClinicalNotesVectorStore {
  private documents: VectorDocument[] = [];
  private embeddingProvider: EmbeddingProvider;
  private isInitialized = false;

  constructor(provider?: EmbeddingProvider) {
    this.embeddingProvider = provider || createEmbeddingProvider();
  }

  public clear(): void {
    this.documents = [];
    this.isInitialized = false;
  }

  /**
   * Indexes an array of clinical notes. Computes vector embeddings and caches them.
   */
  public async indexClinicalNotes(notes: ClinicalNote[]): Promise<number> {
    console.log(`[VectorStore] Indexing ${notes.length} clinical notes with embeddings...`);

    const textsToEmbed = notes.map((n) => `${n.title}\n${n.noteType}\n${n.text}`);
    const embeddings = await this.embeddingProvider.embedDocuments(textsToEmbed);

    this.documents = notes.map((note, idx) => ({
      record_id: note.id,
      patient_id: note.patientId,
      encounter_id: note.encounterId,
      admission_id: note.admissionId,
      timestamp: note.timestamp,
      note_type: note.noteType,
      title: note.title,
      text: note.text,
      embedding: embeddings[idx],
    }));

    this.isInitialized = true;
    console.log(`[VectorStore] Successfully indexed ${this.documents.length} clinical notes.`);
    return this.documents.length;
  }

  /**
   * Search clinical notes using cosine similarity.
   * STRICTLY ENFORCES PATIENT-LEVEL FILTERING.
   */
  public async search(params: VectorSearchParams): Promise<VectorDocument[]> {
    const {
      patient_id,
      query,
      top_k = 5,
      min_score = 0.05,
      encounter_id,
      admission_id,
      note_type,
      start_date,
      end_date,
    } = params;

    if (!patient_id) {
      throw new Error('[VectorStore] patient_id is required. Patient isolation is strictly enforced.');
    }

    // Step 1: Enforce patient scoping and optional temporal/encounter filters
    const candidateDocs = this.documents.filter((doc) => {
      // Hard security check: strictly same patient
      if (doc.patient_id !== patient_id) return false;

      if (encounter_id && doc.encounter_id !== encounter_id) return false;
      if (admission_id && doc.admission_id !== admission_id) return false;
      if (note_type && doc.note_type.toLowerCase() !== note_type.toLowerCase()) return false;
      if (start_date && new Date(doc.timestamp) < new Date(start_date)) return false;
      if (end_date && new Date(doc.timestamp) > new Date(end_date)) return false;

      return true;
    });

    if (candidateDocs.length === 0) {
      return [];
    }

    // Step 2: Compute query embedding
    const queryVector = await this.embeddingProvider.embedQuery(query);

    // Step 3: Compute cosine similarity scores
    const scoredDocs: VectorDocument[] = candidateDocs.map((doc) => {
      const score = doc.embedding ? cosineSimilarity(queryVector, doc.embedding) : 0;
      return {
        ...doc,
        similarity_score: Math.round(score * 1000) / 1000,
      };
    });

    // Step 4: Filter by min score and rank descending
    return scoredDocs
      .filter((d) => (d.similarity_score ?? 0) >= min_score)
      .sort((a, b) => (b.similarity_score ?? 0) - (a.similarity_score ?? 0))
      .slice(0, top_k);
  }

  public getStats(): { totalIndexed: number; uniquePatients: number } {
    const patients = new Set(this.documents.map((d) => d.patient_id));
    return {
      totalIndexed: this.documents.length,
      uniquePatients: patients.size,
    };
  }

  public getDocumentByRecordId(patientId: string, recordId: string): VectorDocument | undefined {
    return this.documents.find((d) => d.patient_id === patientId && d.record_id === recordId);
  }
}

export const vectorStore = new ClinicalNotesVectorStore();
