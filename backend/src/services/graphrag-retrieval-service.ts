import { graphService } from '../graph/graph-service.js';
import { vectorStore, VectorSearchParams } from '../vector/vector-store.js';
import { timelineService } from './timeline-service.js';
import { admissionComparisonService } from './admission-comparison-service.js';
import {
  GraphSearchResult,
  VectorDocument,
  Admission,
  TimelineEvent,
  AdmissionComparisonResult,
} from '../schemas/types.js';

export interface UnifiedRetrievalResult {
  patient_id: string;
  query: string;
  timestamp: string;
  structured_graph: GraphSearchResult;
  unstructured_notes: Array<{
    record_id: string;
    encounter_id: string;
    admission_id?: string;
    timestamp: string;
    note_type: string;
    title: string;
    snippet: string;
    full_text: string;
    similarity_score?: number;
  }>;
  retrieved_citations: Array<{
    record_id: string;
    type: 'graph_entity' | 'clinical_note';
    timestamp: string;
    summary: string;
  }>;
}

export class GraphRAGRetrievalService {
  /**
   * Controlled structured graph retrieval
   */
  public async searchPatientGraph(patientId: string, query: string): Promise<GraphSearchResult> {
    return graphService.searchPatientGraph(patientId, query);
  }

  /**
   * Unstructured clinical note vector search with strict patient scoping
   */
  public async searchClinicalNotes(patientId: string, query: string, options: Partial<VectorSearchParams> = {}): Promise<VectorDocument[]> {
    return vectorStore.search({
      patient_id: patientId,
      query,
      top_k: options.top_k || 5,
      min_score: options.min_score || 0.05,
      encounter_id: options.encounter_id,
      admission_id: options.admission_id,
      note_type: options.note_type,
      start_date: options.start_date,
      end_date: options.end_date,
    });
  }

  /**
   * Unified GraphRAG Search:
   * Combines structured knowledge graph facts and semantic note passages.
   */
  public async unifiedSearch(patientId: string, query: string): Promise<UnifiedRetrievalResult> {
    const [graphResult, noteResults] = await Promise.all([
      this.searchPatientGraph(patientId, query),
      this.searchClinicalNotes(patientId, query, { top_k: 5 }),
    ]);

    const citations: Array<{
      record_id: string;
      type: 'graph_entity' | 'clinical_note';
      timestamp: string;
      summary: string;
    }> = [];

    // Add note citations
    for (const note of noteResults) {
      citations.push({
        record_id: note.record_id,
        type: 'clinical_note',
        timestamp: note.timestamp,
        summary: `[${note.note_type}] ${note.title}`,
      });
    }

    // Add graph findings citations
    for (const finding of graphResult.findings) {
      for (const recId of finding.source_records) {
        if (!citations.some((c) => c.record_id === recId)) {
          citations.push({
            record_id: recId,
            type: 'graph_entity',
            timestamp: new Date().toISOString(),
            summary: finding.description,
          });
        }
      }
    }

    return {
      patient_id: patientId,
      query,
      timestamp: new Date().toISOString(),
      structured_graph: graphResult,
      unstructured_notes: noteResults.map((n) => ({
        record_id: n.record_id,
        encounter_id: n.encounter_id,
        admission_id: n.admission_id,
        timestamp: n.timestamp,
        note_type: n.note_type,
        title: n.title,
        snippet: n.text.slice(0, 300) + (n.text.length > 300 ? '...' : ''),
        full_text: n.text,
        similarity_score: n.similarity_score,
      })),
      retrieved_citations: citations,
    };
  }

  /**
   * Retrieves admission history for a patient with context
   */
  public async getAdmissionHistory(patientId: string): Promise<Admission[]> {
    return graphService.getPatientAdmissions(patientId);
  }

  /**
   * Retrieves chronological patient timeline
   */
  public async getPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
    return timelineService.getPatientTimeline(patientId);
  }

  /**
   * Compares two admissions for a patient
   */
  public async compareAdmissions(
    patientId: string,
    admissionId1: string,
    admissionId2: string
  ): Promise<AdmissionComparisonResult> {
    return admissionComparisonService.compareAdmissions(patientId, admissionId1, admissionId2);
  }
}

export const graphRAGService = new GraphRAGRetrievalService();
