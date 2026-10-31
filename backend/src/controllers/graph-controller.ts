import { Request, Response } from 'express';
import { graphService } from '../graph/graph-service.js';
import { graphRAGService } from '../services/graphrag-retrieval-service.js';

export class GraphController {
  public async searchGraph(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id, query } = req.body;
      if (!patient_id) {
        res.status(400).json({ error: 'patient_id is required in request body.' });
        return;
      }
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'query string is required in request body.' });
        return;
      }

      const result = await graphService.searchPatientGraph(patient_id, query);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: `Graph search failed: ${err.message}` });
    }
  }

  public async unifiedSearch(req: Request, res: Response): Promise<void> {
    try {
      const { patient_id, query } = req.body;
      if (!patient_id || !query) {
        res.status(400).json({ error: 'Both patient_id and query are required.' });
        return;
      }

      const result = await graphRAGService.unifiedSearch(patient_id, query);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: `Unified GraphRAG search failed: ${err.message}` });
    }
  }

  public async getPatientSubgraph(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const graph = await graphService.getPatientGraph(patientId as string);
      res.json({ patient_id: patientId, ...graph });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve graph: ${err.message}` });
    }
  }

  public async getPatientMedications(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const medications = await graphService.getPatientMedications(patientId as string);
      res.json({ patient_id: patientId, medications });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve medications: ${err.message}` });
    }
  }

  public async getPatientLabs(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const testId = req.query.testId as string | undefined;
      const labs = await graphService.getPatientLabResults(patientId as string, testId);
      res.json({ patient_id: patientId, labs });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve labs: ${err.message}` });
    }
  }
}

export const graphController = new GraphController();
