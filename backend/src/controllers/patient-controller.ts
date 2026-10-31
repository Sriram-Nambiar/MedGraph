import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { graphService } from '../graph/graph-service.js';
import { timelineService } from '../services/timeline-service.js';
import { inMemoryGraph } from '../graph/in-memory-graph.js';
import { Patient } from '../schemas/types.js';

export class PatientController {
  public async getPatients(req: Request, res: Response): Promise<void> {
    try {
      const dataDir = path.resolve(process.cwd(), '../data/synthetic-patients');
      const patientsFile = path.join(dataDir, 'patients.json');

      if (fs.existsSync(patientsFile)) {
        const patients: Patient[] = JSON.parse(fs.readFileSync(patientsFile, 'utf-8'));
        res.json({ patients, count: patients.length });
        return;
      }

      // Fallback from graph
      const patients: Patient[] = [];
      const sub = inMemoryGraph.getPatientSubGraph('P001');
      res.json({ patients: [sub.nodes.find((n) => n.label === 'Patient')?.properties] });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve patients: ${err.message}` });
    }
  }

  public async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      if (!patientId) {
        res.status(400).json({ error: 'patientId parameter is required' });
        return;
      }

      const node = inMemoryGraph.getNode(patientId);
      if (!node || node.label !== 'Patient') {
        // Try file
        const pFile = path.resolve(process.cwd(), `../data/synthetic-patients/${patientId}.json`);
        if (fs.existsSync(pFile)) {
          const data = JSON.parse(fs.readFileSync(pFile, 'utf-8'));
          res.json({ patient: data.patient, details: data });
          return;
        }
        res.status(404).json({ error: `Patient with id "${patientId}" not found.` });
        return;
      }

      const conditions = await graphService.getPatientConditions(patientId);
      const admissions = await graphService.getPatientAdmissions(patientId);
      const medications = await graphService.getPatientMedications(patientId);
      const labResults = await graphService.getPatientLabResults(patientId);

      res.json({
        patient: node.properties,
        summary: {
          conditions,
          admissions,
          medications,
          labResults,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve patient: ${err.message}` });
    }
  }

  public async getPatientTimeline(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      if (!patientId) {
        res.status(400).json({ error: 'patientId parameter is required' });
        return;
      }

      const timeline = await timelineService.getPatientTimeline(patientId);
      res.json({
        patient_id: patientId,
        total_events: timeline.length,
        timeline,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve timeline: ${err.message}` });
    }
  }

  public async getPatientAdmissions(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      if (!patientId) {
        res.status(400).json({ error: 'patientId parameter is required' });
        return;
      }

      const admissions = await graphService.getPatientAdmissions(patientId);
      res.json({
        patient_id: patientId,
        count: admissions.length,
        admissions,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve admissions: ${err.message}` });
    }
  }

  public async getPatientGraph(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      if (!patientId) {
        res.status(400).json({ error: 'patientId parameter is required' });
        return;
      }

      const graph = await graphService.getPatientGraph(patientId);
      res.json({
        patient_id: patientId,
        nodes: graph.nodes,
        relationships: graph.relationships,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve patient graph: ${err.message}` });
    }
  }
}

export const patientController = new PatientController();
