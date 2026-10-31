import { Request, Response } from 'express';
import { vectorStore } from '../vector/vector-store.js';

export class VectorController {
  public async searchNotes(req: Request, res: Response): Promise<void> {
    try {
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
      } = req.body;

      if (!patient_id) {
        res.status(400).json({
          error: 'patient_id is required. Patient-level security boundary is strictly enforced.',
        });
        return;
      }

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'query string is required.' });
        return;
      }

      const results = await vectorStore.search({
        patient_id,
        query,
        top_k: Number(top_k),
        min_score: Number(min_score),
        encounter_id,
        admission_id,
        note_type,
        start_date,
        end_date,
      });

      // Format response exactly as specified
      const formattedResults = results.map((doc) => ({
        record_id: doc.record_id,
        patient_id: doc.patient_id,
        encounter_id: doc.encounter_id,
        admission_id: doc.admission_id,
        timestamp: doc.timestamp,
        note_type: doc.note_type,
        title: doc.title,
        text: doc.text,
        similarity_score: doc.similarity_score,
      }));

      res.json({
        patient_id,
        query,
        total_matched: formattedResults.length,
        results: formattedResults,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Vector search failed: ${err.message}` });
    }
  }

  public async getNoteByRecordId(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, recordId } = req.params;
      const note = vectorStore.getDocumentByRecordId(patientId, recordId);
      if (!note) {
        res.status(404).json({ error: `Clinical note record "${recordId}" not found for patient "${patientId}".` });
        return;
      }
      res.json({ note });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve note: ${err.message}` });
    }
  }
}

export const vectorController = new VectorController();
