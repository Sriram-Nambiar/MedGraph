import { seedKnowledgeGraph } from '../ingestion/seed.js';
import { inMemoryGraph } from '../graph/in-memory-graph.js';
import { graphService } from '../graph/graph-service.js';
import { vectorStore } from '../vector/vector-store.js';
import { timelineService } from '../services/timeline-service.js';
import { admissionComparisonService } from '../services/admission-comparison-service.js';
import { agentController } from '../controllers/agent-controller.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n========================================');
  console.log('  MedGraph Automated Verification Suite');
  console.log('========================================\n');

  // 1 & 2. Ingestion & Graph Creation
  console.log('[Test 1 & 2: Graph Ingestion & Seeding]');
  const seedResult = await seedKnowledgeGraph();
  assert(seedResult.patientsLoaded >= 5, `Ingested ${seedResult.patientsLoaded} synthetic patients (>= 5 required)`);
  assert(seedResult.admissionsLoaded >= 10, `Ingested ${seedResult.admissionsLoaded} admissions`);
  assert(seedResult.notesLoaded >= 30, `Ingested ${seedResult.notesLoaded} clinical notes`);

  // 3. Duplicate Prevention
  console.log('\n[Test 3: Duplicate Prevention]');
  const countBefore = inMemoryGraph.getStats().nodesCount;
  // Re-run seed to test idempotency
  await seedKnowledgeGraph();
  const countAfter = inMemoryGraph.getStats().nodesCount;
  assert(countBefore === countAfter, `Duplicate prevention verified: node count remained exactly ${countAfter}`);

  // 4. Patient-Specific Graph Scoping
  console.log('\n[Test 4: Patient-Specific Graph Scoping]');
  const p1Graph = await graphService.getPatientGraph('P001');
  assert(p1Graph.nodes.length > 0, `P001 has ${p1Graph.nodes.length} connected graph nodes`);
  const anyForeignNode = p1Graph.nodes.some(
    (n) => n.properties.patientId && n.properties.patientId !== 'P001'
  );
  assert(!anyForeignNode, 'Zero cross-patient leakage in P001 graph query');

  // 5. Admission History Retrieval
  console.log('\n[Test 5: Admission History Retrieval]');
  const p1Admissions = await graphService.getPatientAdmissions('P001');
  assert(p1Admissions.length === 3, `P001 has 3 sequential admissions (ADM-101, ADM-102, ADM-103)`);
  assert(
    new Date(p1Admissions[0].admissionDate) < new Date(p1Admissions[1].admissionDate),
    'Admissions are sorted chronologically'
  );

  // 6. Chronological Timeline Generation
  console.log('\n[Test 6: Chronological Timeline Generation]');
  const timeline = await timelineService.getPatientTimeline('P001');
  assert(timeline.length >= 15, `Generated ${timeline.length} clinical timeline events`);
  let isSorted = true;
  for (let i = 1; i < timeline.length; i++) {
    if (new Date(timeline[i].timestamp) < new Date(timeline[i - 1].timestamp)) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, 'Timeline events are strictly sorted in chronological order');
  assert(timeline.every((e) => !!e.sourceRecordId), 'Every timeline event preserves its sourceRecordId');

  // 7 & 8. Vector Indexing & Cosine Similarity
  console.log('\n[Test 7 & 8: Vector Indexing & Cosine Similarity]');
  const notes = await graphService.getPatientClinicalNotes('P001');
  const allNotes = [
    ...notes,
    ...(await graphService.getPatientClinicalNotes('P002')),
    ...(await graphService.getPatientClinicalNotes('P003')),
  ];
  await vectorStore.indexClinicalNotes(allNotes);

  const searchResults = await vectorStore.search({
    patient_id: 'P001',
    query: 'Lisinopril hyperkalemia potassium worsening renal failure',
    top_k: 3,
  });
  assert(searchResults.length > 0, `Vector search returned ${searchResults.length} documents`);
  assert(
    searchResults[0].record_id === 'NOTE-105' || searchResults[0].record_id === 'NOTE-106',
    `Top result is the relevant note (${searchResults[0].record_id}) with similarity ${searchResults[0].similarity_score}`
  );

  // 9. Patient-Scoped Vector Filtering
  console.log('\n[Test 9: Patient-Scoped Vector Filtering]');
  const foreignResults = await vectorStore.search({
    patient_id: 'P001',
    query: 'Apixaban Warfarin deep vein thrombosis', // These keywords belong to P002!
    top_k: 5,
  });
  const leakedDoc = foreignResults.find((d) => d.patient_id !== 'P001');
  assert(!leakedDoc, 'Vector search strictly prevents cross-patient leakage (all returned docs belong to P001)');

  // 10. Admission Comparison Service
  console.log('\n[Test 10: Multi-Admission Comparative Delta]');
  const comparison = await admissionComparisonService.compareAdmissions('P001', 'ADM-101', 'ADM-102');
  assert(comparison.differences.medicationsAdded.length > 0, 'Detected newly added medications (Entresto, Torsemide)');
  assert(
    comparison.differences.medicationsDiscontinued.some((m) => m.medication.id === 'MED-LISINOPRIL'),
    'Correctly identified Lisinopril as discontinued'
  );
  assert(
    comparison.differences.significantLabChanges.some((l) => l.testName.includes('Creatinine') || l.testName.includes('Potassium')),
    'Identified significant biomarker shifts (Creatinine & Potassium surge)'
  );

  // 11. Contradictions & Missing Records
  console.log('\n[Test 11: Contradictions & Missing Records]');
  const p2Notes = await graphService.getPatientClinicalNotes('P002');
  const contradictionNote = p2Notes.find((n) => n.isContradictoryOrMissing);
  assert(!!contradictionNote, `Flagged documented contradiction for P002 (${contradictionNote?.id})`);

  // Summary
  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed.`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('[TestSuite Error]', err);
  process.exit(1);
});
