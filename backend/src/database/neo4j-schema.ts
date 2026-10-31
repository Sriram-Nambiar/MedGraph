import { getNeo4jSession } from './neo4j-connection.js';

export async function setupNeo4jSchema(): Promise<void> {
  const session = getNeo4jSession();
  if (!session) {
    console.warn('[Neo4j Schema] Skipped schema creation (database not connected).');
    return;
  }

  const constraintQueries = [
    // Unique Constraints
    'CREATE CONSTRAINT patient_id_unique IF NOT EXISTS FOR (p:Patient) REQUIRE p.id IS UNIQUE;',
    'CREATE CONSTRAINT encounter_id_unique IF NOT EXISTS FOR (e:Encounter) REQUIRE e.id IS UNIQUE;',
    'CREATE CONSTRAINT admission_id_unique IF NOT EXISTS FOR (a:Admission) REQUIRE a.id IS UNIQUE;',
    'CREATE CONSTRAINT note_id_unique IF NOT EXISTS FOR (n:ClinicalNote) REQUIRE n.id IS UNIQUE;',
    'CREATE CONSTRAINT medication_id_unique IF NOT EXISTS FOR (m:Medication) REQUIRE m.id IS UNIQUE;',
    'CREATE CONSTRAINT condition_id_unique IF NOT EXISTS FOR (c:Condition) REQUIRE c.id IS UNIQUE;',
    'CREATE CONSTRAINT labtest_id_unique IF NOT EXISTS FOR (t:LabTest) REQUIRE t.id IS UNIQUE;',
    'CREATE CONSTRAINT labresult_id_unique IF NOT EXISTS FOR (r:LabResult) REQUIRE r.id IS UNIQUE;',
    'CREATE CONSTRAINT prescription_id_unique IF NOT EXISTS FOR (rx:Prescription) REQUIRE rx.id IS UNIQUE;',
    'CREATE CONSTRAINT doctor_id_unique IF NOT EXISTS FOR (d:Doctor) REQUIRE d.id IS UNIQUE;',

    // Performance Indexes for fast patient-scoped retrieval
    'CREATE INDEX patient_encounter_idx IF NOT EXISTS FOR (e:Encounter) ON (e.patientId);',
    'CREATE INDEX patient_admission_idx IF NOT EXISTS FOR (a:Admission) ON (a.patientId);',
    'CREATE INDEX patient_note_idx IF NOT EXISTS FOR (n:ClinicalNote) ON (n.patientId);',
    'CREATE INDEX patient_prescription_idx IF NOT EXISTS FOR (rx:Prescription) ON (rx.patientId);',
    'CREATE INDEX patient_labresult_idx IF NOT EXISTS FOR (r:LabResult) ON (r.patientId);',
    'CREATE INDEX patient_condition_idx IF NOT EXISTS FOR (c:Condition) ON (c.patientId);',
  ];

  try {
    for (const query of constraintQueries) {
      await session.run(query);
    }
    console.log('[Neo4j Schema] Successfully initialized unique constraints and performance indexes.');
  } catch (error: any) {
    console.error(`[Neo4j Schema] Error initializing constraints: ${error.message}`);
  } finally {
    await session.close();
  }
}
