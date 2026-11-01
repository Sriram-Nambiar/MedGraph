import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { graphService } from '../graph/graph-service.js';
import { timelineService } from '../services/timeline-service.js';
import { inMemoryGraph } from '../graph/in-memory-graph.js';
import { Patient } from '../schemas/types.js';

function getSyntheticDataDir(): string {
  const candidates = [
    path.resolve(process.cwd(), '../data/synthetic-patients'),
    path.resolve(process.cwd(), 'data/synthetic-patients'),
    path.resolve(__dirname, '../../data/synthetic-patients'),
    path.resolve(__dirname, '../../../data/synthetic-patients'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

export class PatientController {
  public async getPatients(req: Request, res: Response): Promise<void> {
    try {
      const dataDir = getSyntheticDataDir();
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

      const pId = patientId as string;
      const node = inMemoryGraph.getNode(pId);
      if (!node || node.label !== 'Patient') {
        // Try file
        const pFile = path.join(getSyntheticDataDir(), `${pId}.json`);
        if (fs.existsSync(pFile)) {
          const data = JSON.parse(fs.readFileSync(pFile, 'utf-8'));
          res.json({ patient: data.patient, details: data });
          return;
        }
        res.status(404).json({ error: `Patient with id "${pId}" not found.` });
        return;
      }

      const conditions = await graphService.getPatientConditions(pId);
      const admissions = await graphService.getPatientAdmissions(pId);
      const medications = await graphService.getPatientMedications(pId);
      const labResults = await graphService.getPatientLabResults(pId);

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

      const timeline = await timelineService.getPatientTimeline(patientId as string);
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

      const admissions = await graphService.getPatientAdmissions(patientId as string);
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

      const graph = await graphService.getPatientGraph(patientId as string);
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
