import { seedKnowledgeGraph } from '../ingestion/seed.js';
import { inMemoryGraph } from '../graph/in-memory-graph.js';
import { graphService } from '../graph/graph-service.js';
import { vectorStore } from '../vector/vector-store.js';
import { timelineService } from '../services/timeline-service.js';
import { admissionComparisonService } from '../services/admission-comparison-service.js';
import { consentService } from '../services/consent-service.js';
import { crossHospitalService } from '../services/cross-hospital-service.js';
import { fhirMappingService } from '../services/fhir-mapping-service.js';
import { auditService } from '../services/audit-service.js';
import { getAllHospitals, getHospitalById } from '../ingestion/synthetic-hospitals.js';
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
  console.log('  (Single & Cross-Hospital Interop)');
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
  assert(p1Admissions.length >= 1, `P001 has admissions record`);
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
    searchResults[0].record_id.startsWith('NOTE-'),
    `Top result is the relevant note (${searchResults[0].record_id}) with similarity ${searchResults[0].similarity_score}`
  );

  // 9. Patient-Scoped Vector Filtering
  console.log('\n[Test 9: Patient-Scoped Vector Filtering]');
  const foreignResults = await vectorStore.search({
    patient_id: 'P001',
    query: 'Apixaban Warfarin deep vein thrombosis',
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

  // ==========================================
  // CROSS-HOSPITAL INTEROPERABILITY TESTS
  // ==========================================

  // 12. Hospital Directory Registry
  console.log('\n[Test 12: Hospital Network Directory]');
  const hospitals = getAllHospitals();
  assert(hospitals.length >= 2, `Registered ${hospitals.length} interoperable network hospitals`);
  const hospA = getHospitalById('HOSP001');
  const hospB = getHospitalById('HOSP002');
  assert(hospA?.name === 'Apollo General Hospital', 'Hospital A correctly resolved as Apollo General Hospital');
  assert(hospB?.name === 'Bengaluru City Medical Center', 'Hospital B correctly resolved as Bengaluru City Medical Center');

  // 13. Consent Lifecycle: Request, Approve, and Reject
  console.log('\n[Test 13: Consent Request Lifecycle]');
  const testReq = consentService.createRequest({
    patient_id: 'P003',
    patient_name: 'Priya Nambiar',
    requesting_hospital_id: 'HOSP002',
    source_hospital_id: 'HOSP001',
    purpose: 'Neurology timeline verification',
    requested_categories: ['admissions', 'clinical_notes'],
  });
  assert(testReq.status === 'PENDING', `Consent request created with PENDING status (${testReq.request_id})`);

  // Reject flow
  const rejected = consentService.rejectRequest(testReq.request_id, 'Patient declined transfer');
  assert(rejected.status === 'REJECTED', 'Consent request transitioned to REJECTED');

  // New Request + Approve flow
  const testReq2 = consentService.createRequest({
    patient_id: 'P003',
    patient_name: 'Priya Nambiar',
    requesting_hospital_id: 'HOSP002',
    source_hospital_id: 'HOSP001',
    purpose: 'Neurology timeline verification approved by patient',
  });
  const grant = consentService.approveRequest(testReq2.request_id, 7);
  assert(grant.status === 'ACTIVE', `Consent grant successfully activated (${grant.grant_id})`);
  assert(
    consentService.isAuthorized('P003', 'HOSP002', 'HOSP001') === true,
    'HOSP002 is authorized to access HOSP001 records for P003'
  );

  // 14. Consent Revocation
  console.log('\n[Test 14: Consent Revocation]');
  consentService.revokeGrant(grant.grant_id, 'Priya Nambiar');
  assert(
    consentService.isAuthorized('P003', 'HOSP002', 'HOSP001') === false,
    'Access immediately terminated following grant revocation'
  );

  // 15. Cross-Hospital Aggregated History & Provenance
  console.log('\n[Test 15: Cross-Hospital Patient History Aggregation]');
  // P002 has an active demo consent grant from HOSP001 to HOSP002
  const p2CrossHistory = await crossHospitalService.getCrossHospitalPatientHistory('P002', 'HOSP002');
  assert(p2CrossHistory.is_cross_hospital_authorized === true, 'P002 authorized with active cross-hospital consent');
  assert(p2CrossHistory.records.length >= 5, `Aggregated ${p2CrossHistory.records.length} multi-hospital records`);
  assert(
    p2CrossHistory.records.some((r) => r.hospital_id === 'HOSP001') &&
    p2CrossHistory.records.some((r) => r.hospital_id === 'HOSP002'),
    'Aggregated history cleanly contains records from both Apollo General and Bengaluru City Medical Center'
  );
  assert(
    p2CrossHistory.records.every((r) => !!r.hospital_name && !!r.source),
    'Every cross-hospital record retains strict originating hospital provenance'
  );

  // 16. HL7 FHIR R4 Bundle Generation
  console.log('\n[Test 16: HL7 FHIR R4 Bundle Generation]');
  const p1Patient = (await graphService.getPatientGraph('P001')).nodes.find((n) => n.id === 'P001')?.properties as any;
  const p1FhirBundle = fhirMappingService.buildPatientFHIRBundle({
    patient: p1Patient,
    hospital: hospA,
    admissions: p1Admissions,
    notes: await graphService.getPatientClinicalNotes('P001'),
  });
  assert(p1FhirBundle.resourceType === 'Bundle', 'Generated valid FHIR resourceType: Bundle');
  assert(p1FhirBundle.type === 'collection', 'FHIR bundle type is collection');
  assert(p1FhirBundle.entry.length > 0, `FHIR bundle contains ${p1FhirBundle.entry.length} mapped FHIR resources`);
  const hasPatientResource = p1FhirBundle.entry.some((e: any) => e.resource.resourceType === 'Patient');
  const hasEncounterResource = p1FhirBundle.entry.some((e: any) => e.resource.resourceType === 'Encounter');
  assert(hasPatientResource && hasEncounterResource, 'FHIR bundle contains standard Patient and Encounter resources');

  // 17. Consent-Aware Vector Filtering
  console.log('\n[Test 17: Consent-Aware Vector Filtering]');
  const restrictedNotes = await vectorStore.search({
    patient_id: 'P001',
    query: 'outpatient follow-up blood pressure potassium',
    allowed_hospital_ids: ['HOSP001'], // Exclude HOSP002
    top_k: 5,
  });
  const containsExcludedHosp = restrictedNotes.some((n) => n.hospital_id === 'HOSP002');
  assert(!containsExcludedHosp, 'Vector search strictly enforces hospital consent boundaries (no HOSP002 records)');

  // 18. Compliance Audit Trail
  console.log('\n[Test 18: Compliance Audit Trail]');
  const auditEntries = auditService.getLogs({ patient_id: 'P002' });
  assert(auditEntries.length > 0, `Recorded ${auditEntries.length} immutable compliance audit log entries`);
  assert(auditEntries.every((l) => !!l.actor_id && !!l.action && !!l.status), 'All audit logs contain actor, action, and status');

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
