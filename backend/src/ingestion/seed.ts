import fs from 'fs';
import path from 'path';
import { inMemoryGraph } from '../graph/in-memory-graph.js';
import { testNeo4jConnection, getNeo4jSession } from '../database/neo4j-connection.js';
import { setupNeo4jSchema } from '../database/neo4j-schema.js';
import { generateSyntheticDataset, writeDatasetToDisk } from './synthetic-data-generator.js';
import {
  Patient,
  Doctor,
  Admission,
  Encounter,
  Condition,
  Medication,
  Prescription,
  LabTest,
  LabResult,
  ClinicalNote,
} from '../schemas/types.js';

export async function seedKnowledgeGraph(dataPath?: string): Promise<{
  patientsLoaded: number;
  admissionsLoaded: number;
  encountersLoaded: number;
  prescriptionsLoaded: number;
  notesLoaded: number;
  neo4jSynced: boolean;
}> {
  const dir = dataPath || path.resolve(process.cwd(), '../data/synthetic-patients');

  let dataset: {
    patients: Patient[];
    doctors: Doctor[];
    conditions: Condition[];
    admissions: Admission[];
    encounters: Encounter[];
    prescriptions: Prescription[];
    labTests: LabTest[];
    labResults: LabResult[];
    clinicalNotes: ClinicalNote[];
  };

  if (!fs.existsSync(path.join(dir, 'patients.json'))) {
    console.log('[Seed] Generating synthetic dataset to disk...');
    dataset = writeDatasetToDisk(dir);
  } else {
    dataset = {
      patients: JSON.parse(fs.readFileSync(path.join(dir, 'patients.json'), 'utf-8')),
      doctors: JSON.parse(fs.readFileSync(path.join(dir, 'doctors.json'), 'utf-8')),
      conditions: JSON.parse(fs.readFileSync(path.join(dir, 'conditions.json'), 'utf-8')),
      admissions: JSON.parse(fs.readFileSync(path.join(dir, 'admissions.json'), 'utf-8')),
      encounters: JSON.parse(fs.readFileSync(path.join(dir, 'encounters.json'), 'utf-8')),
      prescriptions: JSON.parse(fs.readFileSync(path.join(dir, 'prescriptions.json'), 'utf-8')),
      labTests: JSON.parse(fs.readFileSync(path.join(dir, 'lab_tests.json'), 'utf-8')),
      labResults: JSON.parse(fs.readFileSync(path.join(dir, 'lab_results.json'), 'utf-8')),
      clinicalNotes: JSON.parse(fs.readFileSync(path.join(dir, 'clinical_notes.json'), 'utf-8')),
    };
  }

  // 1. Populate In-Memory Graph
  inMemoryGraph.clear();

  // Add Doctors
  for (const doc of dataset.doctors) {
    inMemoryGraph.addNode(doc.id, 'Doctor', doc);
  }

  // Add Lab Tests
  for (const test of dataset.labTests) {
    inMemoryGraph.addNode(test.id, 'LabTest', test);
  }

  // Add Medications
  const medicationMap = new Map<string, Medication>();
  for (const rx of dataset.prescriptions) {
    if (!medicationMap.has(rx.medicationId)) {
      medicationMap.set(rx.medicationId, {
        id: rx.medicationId,
        name: rx.medicationId.replace('MED-', ''),
        genericName: rx.medicationId.replace('MED-', ''),
        category: 'Pharmaceutical',
        dosageForm: 'Oral / IV',
      });
    }
  }

  for (const med of medicationMap.values()) {
    inMemoryGraph.addNode(med.id, 'Medication', med);
  }

  // Add Patients and their domain graph
  for (const p of dataset.patients) {
    inMemoryGraph.addNode(p.id, 'Patient', p, p.id);
  }

  for (const a of dataset.admissions) {
    inMemoryGraph.addNode(a.id, 'Admission', a, a.patientId);
    inMemoryGraph.addRelationship(`rel-${a.patientId}-${a.id}`, a.patientId, a.id, 'HAS_ADMISSION', {}, a.patientId);
  }

  for (const e of dataset.encounters) {
    inMemoryGraph.addNode(e.id, 'Encounter', e, e.patientId);
    inMemoryGraph.addRelationship(`rel-${e.patientId}-${e.id}`, e.patientId, e.id, 'HAS_ENCOUNTER', {}, e.patientId);

    if (e.admissionId) {
      inMemoryGraph.addRelationship(`rel-${e.admissionId}-${e.id}`, e.admissionId, e.id, 'INCLUDES_ENCOUNTER', {}, e.patientId);
    }
    if (e.doctorId) {
      inMemoryGraph.addRelationship(`rel-${e.id}-${e.doctorId}`, e.id, e.doctorId, 'ATTENDED_BY', {}, e.patientId);
    }
  }

  for (const c of dataset.conditions) {
    inMemoryGraph.addNode(c.id, 'Condition', c, c.patientId);
    const encs = dataset.encounters.filter((e) => e.patientId === c.patientId);
    if (encs.length > 0) {
      inMemoryGraph.addRelationship(`rel-${encs[0].id}-${c.id}`, encs[0].id, c.id, 'DOCUMENTS', {}, c.patientId);
    }
  }

  for (const rx of dataset.prescriptions) {
    inMemoryGraph.addNode(rx.id, 'Prescription', rx, rx.patientId);
    inMemoryGraph.addRelationship(`rel-${rx.encounterId}-${rx.id}`, rx.encounterId, rx.id, 'HAS_PRESCRIPTION', {}, rx.patientId);
    inMemoryGraph.addRelationship(`rel-${rx.id}-${rx.medicationId}`, rx.id, rx.medicationId, 'PRESCRIBES', {}, rx.patientId);
  }

  for (const lr of dataset.labResults) {
    inMemoryGraph.addNode(lr.id, 'LabResult', lr, lr.patientId);
    inMemoryGraph.addRelationship(`rel-${lr.encounterId}-${lr.id}`, lr.encounterId, lr.id, 'HAS_LAB_RESULT', {}, lr.patientId);
    inMemoryGraph.addRelationship(`rel-${lr.id}-${lr.testId}`, lr.id, lr.testId, 'OF_TEST', {}, lr.patientId);
  }

  for (const cn of dataset.clinicalNotes) {
    inMemoryGraph.addNode(cn.id, 'ClinicalNote', cn, cn.patientId);
    inMemoryGraph.addRelationship(`rel-${cn.encounterId}-${cn.id}`, cn.encounterId, cn.id, 'HAS_NOTE', {}, cn.patientId);
  }

  console.log(`[Seed] In-Memory Graph populated: ${inMemoryGraph.getStats().nodesCount} nodes, ${inMemoryGraph.getStats().edgesCount} edges.`);

  // 2. Neo4j Sync (if active)
  let neo4jSynced = false;
  const isConnected = await testNeo4jConnection();
  if (isConnected) {
    console.log('[Seed] Syncing knowledge graph to Neo4j...');
    await setupNeo4jSchema();
    const session = getNeo4jSession();
    if (session) {
      try {
        // Ingest Patients
        await session.run(
          `UNWIND $patients AS p
           MERGE (node:Patient {id: p.id})
           SET node += p`,
          { patients: dataset.patients }
        );

        // Ingest Admissions
        await session.run(
          `UNWIND $admissions AS a
           MERGE (node:Admission {id: a.id})
           SET node += a
           WITH node, a
           MATCH (p:Patient {id: a.patientId})
           MERGE (p)-[:HAS_ADMISSION]->(node)`,
          { admissions: dataset.admissions }
        );

        // Ingest Encounters
        await session.run(
          `UNWIND $encounters AS e
           MERGE (node:Encounter {id: e.id})
           SET node += e
           WITH node, e
           MATCH (p:Patient {id: e.patientId})
           MERGE (p)-[:HAS_ENCOUNTER]->(node)`,
          { encounters: dataset.encounters }
        );

        // Ingest Prescriptions & Medications
        await session.run(
          `UNWIND $prescriptions AS rx
           MERGE (node:Prescription {id: rx.id})
           SET node += rx
           MERGE (med:Medication {id: rx.medicationId})
           ON CREATE SET med.name = rx.medicationId
           MERGE (node)-[:PRESCRIBES]->(med)
           WITH node, rx
           MATCH (e:Encounter {id: rx.encounterId})
           MERGE (e)-[:HAS_PRESCRIPTION]->(node)`,
          { prescriptions: dataset.prescriptions }
        );

        // Ingest Lab Results & Tests
        await session.run(
          `UNWIND $labResults AS lr
           MERGE (node:LabResult {id: lr.id})
           SET node += lr
           MERGE (test:LabTest {id: lr.testId})
           MERGE (node)-[:OF_TEST]->(test)
           WITH node, lr
           MATCH (e:Encounter {id: lr.encounterId})
           MERGE (e)-[:HAS_LAB_RESULT]->(node)`,
          { labResults: dataset.labResults }
        );

        // Ingest Clinical Notes
        await session.run(
          `UNWIND $notes AS cn
           MERGE (node:ClinicalNote {id: cn.id})
           SET node += cn
           WITH node, cn
           MATCH (e:Encounter {id: cn.encounterId})
           MERGE (e)-[:HAS_NOTE]->(node)`,
          { notes: dataset.clinicalNotes }
        );

        neo4jSynced = true;
        console.log('[Seed] Knowledge graph successfully ingested into Neo4j.');
      } catch (err: any) {
        console.error(`[Seed] Error during Neo4j ingestion: ${err.message}`);
      } finally {
        await session.close();
      }
    }
  } else {
    console.log('[Seed] Neo4j is offline. Using In-Memory Knowledge Graph Engine for all graph queries.');
  }

  return {
    patientsLoaded: dataset.patients.length,
    admissionsLoaded: dataset.admissions.length,
    encountersLoaded: dataset.encounters.length,
    prescriptionsLoaded: dataset.prescriptions.length,
    notesLoaded: dataset.clinicalNotes.length,
    neo4jSynced,
  };
}

// Standalone execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedKnowledgeGraph().then((res) => {
    console.log('[Seed Completed]', res);
    process.exit(0);
  });
}
