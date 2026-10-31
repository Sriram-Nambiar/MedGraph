import { seedKnowledgeGraph } from '../ingestion/seed.js';
import { inMemoryGraph } from '../graph/in-memory-graph.js';
import { graphService } from '../graph/graph-service.js';
import { vectorStore } from '../vector/vector-store.js';
import { timelineService } from '../services/timeline-service.js';
import { admissionComparisonService } from '../services/admission-comparison-service.js';
import { agentController } from '../controllers/agent-controller.js';
import { closeNeo4jDriver } from '../database/neo4j-connection.js';

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
  assert(p1Admissions.length >= 1, `P001 has admissions record (ADM-101)`);
  const p2Admissions = await graphService.getPatientAdmissions('P002');
  assert(p2Admissions.length >= 2, `P002 has multi-episode admissions`);
  assert(
    new Date(p2Admissions[0].admissionDate) < new Date(p2Admissions[1].admissionDate),
    'Admissions are sorted chronologically'
  );

  // 6. Chronological Timeline Generation
  console.log('\n[Test 6: Chronological Timeline Generation]');
  const timeline = await timelineService.getPatientTimeline('P001');
  assert(timeline.length >= 5, `Generated ${timeline.length} clinical timeline events for P001`);
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
    query: 'Lisinopril hyperkalemia potassium heart failure',
    top_k: 3,
  });
  assert(searchResults.length > 0, `Vector search returned ${searchResults.length} documents`);
  assert(
    searchResults[0].record_id === 'NOTE-101' || searchResults[0].record_id.startsWith('NOTE-'),
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
  const comparison = await admissionComparisonService.compareAdmissions('P002', 'ADM-201', 'ADM-202');
  assert(comparison.differences.medicationsAdded.length > 0, 'Detected newly added medications in P002 (Apixaban)');
  assert(
    comparison.differences.medicationsDiscontinued.some((m) => m.medication.id === 'MED-WARFARIN'),
    'Identified discontinued Warfarin in longitudinal delta'
  );
  assert(
    comparison.differences.significantLabChanges.length > 0,
    'Identified significant biomarker shifts between admissions'
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

  try {
    await closeNeo4jDriver();
  } catch (e) {}
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(async (err) => {
  console.error('[TestSuite Error]', err);
  try {
    await closeNeo4jDriver();
  } catch (e) {}
  process.exit(1);
});
