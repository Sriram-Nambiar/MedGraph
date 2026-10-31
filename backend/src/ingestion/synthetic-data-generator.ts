import fs from 'fs';
import path from 'path';
import {
  Patient,
  Doctor,
  Encounter,
  Admission,
  Condition,
  Medication,
  Prescription,
  LabTest,
  LabResult,
  ClinicalNote,
} from '../schemas/types.js';

// Doctors
export const doctors: Doctor[] = [
  { id: 'DOC-101', name: 'Dr. Gregory House', specialty: 'Internal Medicine', department: 'General Medicine' },
  { id: 'DOC-102', name: 'Dr. Cristina Yang', specialty: 'Cardiology', department: 'Cardiovascular Care' },
  { id: 'DOC-103', name: 'Dr. Robert Chase', specialty: 'Infectious Disease', department: 'Infectious Diseases' },
  { id: 'DOC-104', name: 'Dr. Allison Cameron', specialty: 'Immunology & Neurology', department: 'Neuroimmunology' },
  { id: 'DOC-105', name: 'Dr. Eric Foreman', specialty: 'Neurology', department: 'Neurology' },
  { id: 'DOC-106', name: 'Dr. James Wilson', specialty: 'Oncology & Palliative', department: 'Medical Oncology' },
  { id: 'DOC-107', name: 'Dr. Miranda Bailey', specialty: 'General Surgery & Trauma', department: 'Orthopedic Surgery' },
  { id: 'DOC-108', name: 'Dr. Lisa Cuddy', specialty: 'Endocrinology', department: 'Endocrinology & Metabolism' },
  { id: 'DOC-109', name: 'Dr. Maya Lin', specialty: 'Dermatology', department: 'Dermatology Clinic' },
];

// Lab Test Catalog
export const labTests: LabTest[] = [
  { id: 'TEST-CREAT', code: '2160-0', name: 'Serum Creatinine', category: 'Renal', unit: 'mg/dL', normalRangeLow: 0.6, normalRangeHigh: 1.2 },
  { id: 'TEST-EGFR', code: '33914-3', name: 'eGFR (CKD-EPI)', category: 'Renal', unit: 'mL/min/1.73m2', normalRangeLow: 60, normalRangeHigh: 120 },
  { id: 'TEST-BUN', code: '3094-0', name: 'Blood Urea Nitrogen', category: 'Renal', unit: 'mg/dL', normalRangeLow: 7, normalRangeHigh: 20 },
  { id: 'TEST-K', code: '2823-3', name: 'Potassium', category: 'Chemistry', unit: 'mEq/L', normalRangeLow: 3.5, normalRangeHigh: 5.1 },
  { id: 'TEST-NA', code: '2951-2', name: 'Sodium', category: 'Chemistry', unit: 'mEq/L', normalRangeLow: 135, normalRangeHigh: 145 },
  { id: 'TEST-BNP', code: '30934-4', name: 'B-type Natriuretic Peptide (BNP)', category: 'Cardiac', unit: 'pg/mL', normalRangeLow: 0, normalRangeHigh: 100 },
  { id: 'TEST-TROP', code: '49563-0', name: 'Troponin I (High Sensitivity)', category: 'Cardiac', unit: 'ng/L', normalRangeLow: 0, normalRangeHigh: 14 },
  { id: 'TEST-INR', code: '6301-6', name: 'Prothrombin Time / INR', category: 'Coagulation', unit: 'ratio', normalRangeLow: 0.9, normalRangeHigh: 1.2 },
  { id: 'TEST-WBC', code: '6690-2', name: 'White Blood Cell Count', category: 'Hematology', unit: 'x10^9/L', normalRangeLow: 4.5, normalRangeHigh: 11.0 },
  { id: 'TEST-HGB', code: '718-7', name: 'Hemoglobin', category: 'Hematology', unit: 'g/dL', normalRangeLow: 12.0, normalRangeHigh: 16.0 },
  { id: 'TEST-PLT', code: '777-3', name: 'Platelets', category: 'Hematology', unit: 'x10^9/L', normalRangeLow: 150, normalRangeHigh: 400 },
  { id: 'TEST-CRP', code: '1988-5', name: 'C-Reactive Protein', category: 'Chemistry', unit: 'mg/L', normalRangeLow: 0, normalRangeHigh: 5.0 },
  { id: 'TEST-HBA1C', code: '4548-4', name: 'Hemoglobin A1c', category: 'Endocrine', unit: '%', normalRangeLow: 4.0, normalRangeHigh: 5.6 },
  { id: 'TEST-TSH', code: '3016-3', name: 'Thyroid Stimulating Hormone', category: 'Endocrine', unit: 'uIU/mL', normalRangeLow: 0.45, normalRangeHigh: 4.5 },
  { id: 'TEST-FT4', code: '3024-7', name: 'Free T4', category: 'Endocrine', unit: 'ng/dL', normalRangeLow: 0.82, normalRangeHigh: 1.77 },
];

// Medications Catalog
export const medications: Medication[] = [
  { id: 'MED-LISINOPRIL', name: 'Lisinopril', genericName: 'Lisinopril', category: 'ACE Inhibitor', dosageForm: 'Oral Tablet' },
  { id: 'MED-FUROSEMIDE', name: 'Furosemide (Lasix)', genericName: 'Furosemide', category: 'Loop Diuretic', dosageForm: 'Oral Tablet' },
  { id: 'MED-TORSEMIDE', name: 'Torsemide (Demadex)', genericName: 'Torsemide', category: 'Loop Diuretic', dosageForm: 'Oral Tablet' },
  { id: 'MED-ENTRESTO', name: 'Sacubitril/Valsartan (Entresto)', genericName: 'Sacubitril/Valsartan', category: 'ARNI', dosageForm: 'Oral Tablet' },
  { id: 'MED-METFORMIN', name: 'Metformin', genericName: 'Metformin HCl', category: 'Biguanide', dosageForm: 'Oral Tablet' },
  { id: 'MED-JARDIANCE', name: 'Empagliflozin (Jardiance)', genericName: 'Empagliflozin', category: 'SGLT2 Inhibitor', dosageForm: 'Oral Tablet' },
  { id: 'MED-WARFARIN', name: 'Warfarin (Coumadin)', genericName: 'Warfarin Sodium', category: 'Vitamin K Antagonist', dosageForm: 'Oral Tablet' },
  { id: 'MED-ELIQUIS', name: 'Apixaban (Eliquis)', genericName: 'Apixaban', category: 'Direct Factor Xa Inhibitor (DOAC)', dosageForm: 'Oral Tablet' },
  { id: 'MED-OCRELIZUMAB', name: 'Ocrelizumab (Ocrevus)', genericName: 'Ocrelizumab', category: 'Anti-CD20 Monoclonal Antibody', dosageForm: 'IV Infusion' },
  { id: 'MED-BACLOFEN', name: 'Baclofen', genericName: 'Baclofen', category: 'GABA-B Agonist / Muscle Relaxant', dosageForm: 'Oral Tablet' },
  { id: 'MED-CEFTRIAXONE', name: 'Ceftriaxone', genericName: 'Ceftriaxone Sodium', category: 'Cephalosporin Antibiotic', dosageForm: 'IV Injection' },
  { id: 'MED-CIPRO', name: 'Ciprofloxacin', genericName: 'Ciprofloxacin HCl', category: 'Fluoroquinolone Antibiotic', dosageForm: 'Oral Tablet' },
  { id: 'MED-METHYLPRED', name: 'Methylprednisolone (Solu-Medrol)', genericName: 'Methylprednisolone Sodium Succinate', category: 'Corticosteroid', dosageForm: 'IV Solution' },
  { id: 'MED-PREDNISONE', name: 'Prednisone', genericName: 'Prednisone', category: 'Corticosteroid', dosageForm: 'Oral Tablet' },
  { id: 'MED-SPIRIVA', name: 'Tiotropium (Spiriva Respimat)', genericName: 'Tiotropium Bromide', category: 'Long-Acting Muscarinic Antagonist (LAMA)', dosageForm: 'Inhaler' },
  { id: 'MED-TRELEGY', name: 'Trelegy Ellipta', genericName: 'Fluticasone / Umeclidinium / Vilanterol', category: 'ICS / LAMA / LABA Triple Therapy', dosageForm: 'Inhaler' },
  { id: 'MED-AMIODARONE', name: 'Amiodarone (Cordarone)', genericName: 'Amiodarone HCl', category: 'Class III Antiarrhythmic', dosageForm: 'Oral Tablet' },
  { id: 'MED-METOPROLOL', name: 'Metoprolol Succinate', genericName: 'Metoprolol Succinate ER', category: 'Beta-1 Selective Blocker', dosageForm: 'Oral Tablet' },
  { id: 'MED-OXYCODONE', name: 'Oxycodone (Roxicodone)', genericName: 'Oxycodone HCl', category: 'Opioid Analgesic', dosageForm: 'Oral Tablet' },
  { id: 'MED-TRAMADOL', name: 'Tramadol (Ultram)', genericName: 'Tramadol HCl', category: 'Synthetic Opioid / SNRI', dosageForm: 'Oral Tablet' },
  { id: 'MED-ACETAMINOPHEN', name: 'Acetaminophen (Tylenol)', genericName: 'Acetaminophen', category: 'Analgesic / Antipyretic', dosageForm: 'Oral / IV' },
  { id: 'MED-BENADRYL', name: 'Diphenhydramine (Benadryl)', genericName: 'Diphenhydramine HCl', category: 'First-Gen Antihistamine', dosageForm: 'OTC Oral' },
  { id: 'MED-MELATONIN', name: 'Melatonin', genericName: 'Melatonin', category: 'Sleep Aid', dosageForm: 'Oral Tablet' },
  { id: 'MED-CLOBETASOL', name: 'Clobetasol Propionate 0.05%', genericName: 'Clobetasol Propionate', category: 'Topical Corticosteroid', dosageForm: 'Topical Cream' },
];

export function generateSyntheticDataset() {
  const patients: Patient[] = [
    {
      id: 'P001',
      mrn: 'MRN-847291',
      name: 'Eleanor Vance',
      age: 68,
      gender: 'Female',
      dateOfBirth: '1958-04-12',
      bloodType: 'A+',
      primaryDiagnosis: 'Heart Failure with Reduced Ejection Fraction (HFrEF) & Chronic Kidney Disease Stage 3b',
      allergies: ['Penicillin (Rash)', 'Sulfa drugs (Hives)'],
    },
    {
      id: 'P002',
      mrn: 'MRN-391824',
      name: 'Marcus Thorne',
      age: 54,
      gender: 'Male',
      dateOfBirth: '1972-08-25',
      bloodType: 'O+',
      primaryDiagnosis: 'Recurrent Deep Vein Thrombosis & Pulmonary Embolism on Anticoagulation',
      allergies: ['No Known Drug Allergies (NKDA)'],
    },
    {
      id: 'P003',
      mrn: 'MRN-582109',
      name: 'Sarah Chen',
      age: 42,
      gender: 'Female',
      dateOfBirth: '1984-11-03',
      bloodType: 'B-',
      primaryDiagnosis: 'Relapsing-Remitting Multiple Sclerosis (RRMS) with Severe Urosepsis',
      allergies: ['Latex (Contact Dermatitis)'],
    },
    {
      id: 'P004',
      mrn: 'MRN-204918',
      name: 'James Rodriguez',
      age: 71,
      gender: 'Male',
      dateOfBirth: '1955-01-19',
      bloodType: 'AB+',
      primaryDiagnosis: 'Severe COPD (GOLD 3) with Drug-Induced Amiodarone Thyrotoxicosis',
      allergies: ['Codeine (Nausea/Vomiting)'],
    },
    {
      id: 'P005',
      mrn: 'MRN-773012',
      name: 'Beatrice Kim',
      age: 80,
      gender: 'Female',
      dateOfBirth: '1946-06-30',
      bloodType: 'O-',
      primaryDiagnosis: 'Femoral Neck Fracture Post-Op Delirium & Anticholinergic Toxicity',
      allergies: ['Aspirin (Bronchospasm)'],
    },
  ];

  const conditions: Condition[] = [
    // P001 Conditions
    { id: 'COND-101', patientId: 'P001', code: 'I50.22', name: 'Chronic systolic heart failure (HFrEF, EF 32%)', category: 'Cardiovascular', status: 'Chronic', onsetDate: '2023-03-15' },
    { id: 'COND-102', patientId: 'P001', code: 'N18.32', name: 'Chronic kidney disease, stage 3b', category: 'Renal', status: 'Active', onsetDate: '2024-01-10' },
    { id: 'COND-103', patientId: 'P001', code: 'I10', name: 'Essential hypertension', category: 'Cardiovascular', status: 'Active', onsetDate: '2015-06-20' },
    { id: 'COND-104', patientId: 'P001', code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', category: 'Endocrine', status: 'Active', onsetDate: '2018-09-05' },

    // P002 Conditions
    { id: 'COND-201', patientId: 'P002', code: 'I82.41', name: 'Acute deep vein thrombosis of right popliteal vein', category: 'Hematology', status: 'Recurrent', onsetDate: '2025-07-08' },
    { id: 'COND-202', patientId: 'P002', code: 'I26.92', name: 'Saddle and subsegmental pulmonary embolism', category: 'Cardiovascular', status: 'Active', onsetDate: '2026-01-13' },
    { id: 'COND-203', patientId: 'P002', code: 'I48.0', name: 'Paroxysmal atrial fibrillation', category: 'Cardiovascular', status: 'Chronic', onsetDate: '2024-11-19' },
    { id: 'COND-204', patientId: 'P002', code: 'K62.5', name: 'Hemorrhage of anus and rectum (Lower GI Bleed)', category: 'Hematology', status: 'Resolved', onsetDate: '2026-09-02' },

    // P003 Conditions
    { id: 'COND-301', patientId: 'P003', code: 'G35', name: 'Multiple sclerosis, relapsing-remitting', category: 'Neurology', status: 'Chronic', onsetDate: '2019-02-14' },
    { id: 'COND-302', patientId: 'P003', code: 'A41.51', name: 'Sepsis due to Escherichia coli (Urosepsis)', category: 'Renal', status: 'Resolved', onsetDate: '2025-10-14' },
    { id: 'COND-303', patientId: 'P003', code: 'N31.9', name: 'Neuromuscular dysfunction of bladder (Neurogenic bladder)', category: 'Renal', status: 'Active', onsetDate: '2021-08-20' },

    // P004 Conditions
    { id: 'COND-401', patientId: 'P004', code: 'J44.1', name: 'Chronic obstructive pulmonary disease with acute exacerbation', category: 'Respiratory', status: 'Recurrent', onsetDate: '2020-04-10' },
    { id: 'COND-402', patientId: 'P004', code: 'I48.91', name: 'Unspecified atrial fibrillation with rapid ventricular response', category: 'Cardiovascular', status: 'Active', onsetDate: '2025-06-20' },
    { id: 'COND-403', patientId: 'P004', code: 'E05.90', name: 'Amiodarone-induced thyrotoxicosis (Type 2)', category: 'Endocrine', status: 'Active', onsetDate: '2026-03-08' },

    // P005 Conditions
    { id: 'COND-501', patientId: 'P005', code: 'S72.001A', name: 'Fracture of unspecified part of neck of right femur (Hip fracture)', category: 'Musculoskeletal', status: 'Resolved', onsetDate: '2025-08-01' },
    { id: 'COND-502', patientId: 'P005', code: 'F05', name: 'Delirium due to known physiological condition (Post-op / drug-induced)', category: 'Neurology', status: 'Recurrent', onsetDate: '2025-08-03' },
    { id: 'COND-503', patientId: 'P005', code: 'M81.0', name: 'Age-related osteoporosis without current pathological fracture', category: 'Musculoskeletal', status: 'Chronic', onsetDate: '2017-05-12' },
  ];

  const admissions: Admission[] = [
    // P001 Admissions
    {
      id: 'ADM-101',
      patientId: 'P001',
      hospitalId: 'HOSP001',
      hospitalName: 'Apollo General Hospital',
      admissionDate: '2025-09-12T08:30:00Z',
      dischargeDate: '2025-09-16T14:00:00Z',
      reason: 'Acute decompensated heart failure with progressive bilateral lower extremity edema and dyspnea',
      admissionType: 'Emergency',
      department: 'Cardiovascular Care',
      attendingDoctorId: 'DOC-102',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-101',
      dischargeSummaryId: 'NOTE-103',
    },
    {
      id: 'ADM-102',
      patientId: 'P001',
      admissionDate: '2026-02-05T10:15:00Z',
      dischargeDate: '2026-02-10T16:30:00Z',
      reason: 'Acute on chronic kidney injury and symptomatic hyperkalemia in setting of ACE-inhibitor therapy and heart failure',
      admissionType: 'Emergency',
      department: 'Cardiovascular Care',
      attendingDoctorId: 'DOC-102',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-102',
      dischargeSummaryId: 'NOTE-106',
    },
    {
      id: 'ADM-103',
      patientId: 'P001',
      admissionDate: '2026-08-18T11:45:00Z',
      dischargeDate: '2026-08-23T12:00:00Z',
      reason: 'Worsening congestive symptoms, orthopnea, and diuretic resistance requiring GDMT optimization',
      admissionType: 'Urgent',
      department: 'Cardiovascular Care',
      attendingDoctorId: 'DOC-102',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-101',
      dischargeSummaryId: 'NOTE-109',
    },

    // P002 Admissions
    {
      id: 'ADM-201',
      patientId: 'P002',
      admissionDate: '2025-07-10T13:00:00Z',
      dischargeDate: '2025-07-15T11:00:00Z',
      reason: 'Right lower extremity swelling and pain confirmed as extensive popliteal deep vein thrombosis',
      admissionType: 'Emergency',
      department: 'General Medicine',
      attendingDoctorId: 'DOC-101',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-201',
      dischargeSummaryId: 'NOTE-203',
    },
    {
      id: 'ADM-202',
      patientId: 'P002',
      admissionDate: '2026-01-14T09:20:00Z',
      dischargeDate: '2026-01-18T15:00:00Z',
      reason: 'Recurrent pleuritic chest pain and shortness of breath diagnosed as bilateral subsegmental pulmonary embolism',
      admissionType: 'Emergency',
      department: 'General Medicine',
      attendingDoctorId: 'DOC-101',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-202',
      dischargeSummaryId: 'NOTE-206',
    },
    {
      id: 'ADM-203',
      patientId: 'P002',
      hospitalId: 'HOSP002',
      hospitalName: 'Bengaluru City Medical Center',
      admissionDate: '2026-09-02T07:15:00Z',
      dischargeDate: '2026-09-06T13:30:00Z',
      reason: 'Acute lower gastrointestinal bleeding (hematochezia) with hemoglobin drop while on therapeutic anticoagulation',
      admissionType: 'Emergency',
      department: 'General Medicine',
      attendingDoctorId: 'DOC-101',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-204',
      dischargeSummaryId: 'NOTE-209',
    },

    // P003 Admissions
    {
      id: 'ADM-301',
      patientId: 'P003',
      admissionDate: '2025-10-14T17:40:00Z',
      dischargeDate: '2025-10-19T10:00:00Z',
      reason: 'Severe urosepsis with E. coli bacteremia and hemodynamic instability in patient on Ocrelizumab therapy',
      admissionType: 'Emergency',
      department: 'Infectious Diseases',
      attendingDoctorId: 'DOC-103',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-302',
      dischargeSummaryId: 'NOTE-304',
    },
    {
      id: 'ADM-302',
      patientId: 'P003',
      admissionDate: '2026-04-02T14:10:00Z',
      dischargeDate: '2026-04-07T11:45:00Z',
      reason: 'Acute neurological decline with left lower extremity paraparesis and ataxia (MS flare vs UTI pseudoexacerbation)',
      admissionType: 'Urgent',
      department: 'Neurology',
      attendingDoctorId: 'DOC-104',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-301',
      dischargeSummaryId: 'NOTE-307',
    },

    // P004 Admissions
    {
      id: 'ADM-401',
      patientId: 'P004',
      admissionDate: '2025-06-20T06:45:00Z',
      dischargeDate: '2025-06-25T14:30:00Z',
      reason: 'Severe acute exacerbation of COPD with new onset atrial fibrillation and rapid ventricular response',
      admissionType: 'Emergency',
      department: 'Cardiovascular Care',
      attendingDoctorId: 'DOC-102',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-401',
      dischargeSummaryId: undefined, // Missing discharge summary on purpose!
    },
    {
      id: 'ADM-402',
      patientId: 'P004',
      admissionDate: '2026-03-10T08:00:00Z',
      dischargeDate: '2026-03-15T15:15:00Z',
      reason: 'Palpitations, marked tremor, weight loss, and recurrent atrial fibrillation found to be Amiodarone-induced thyrotoxicosis',
      admissionType: 'Emergency',
      department: 'Endocrinology & Metabolism',
      attendingDoctorId: 'DOC-108',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-403',
      dischargeSummaryId: 'NOTE-406',
    },

    // P005 Admissions
    {
      id: 'ADM-501',
      patientId: 'P005',
      admissionDate: '2025-08-01T12:00:00Z',
      dischargeDate: '2025-08-07T16:00:00Z',
      reason: 'Mechanical fall resulting in displaced right femoral neck fracture status post right hemiarthroplasty',
      admissionType: 'Emergency',
      department: 'Orthopedic Surgery',
      attendingDoctorId: 'DOC-107',
      dischargeDisposition: 'Transferred to Rehab',
      primaryConditionId: 'COND-501',
      dischargeSummaryId: 'NOTE-506',
    },
    {
      id: 'ADM-502',
      patientId: 'P005',
      admissionDate: '2026-05-15T10:30:00Z',
      dischargeDate: '2026-05-20T11:00:00Z',
      reason: 'Acute delirium, urinary retention, and severe dry mucous membranes due to OTC diphenhydramine toxicity',
      admissionType: 'Emergency',
      department: 'General Medicine',
      attendingDoctorId: 'DOC-101',
      dischargeDisposition: 'Discharged Home',
      primaryConditionId: 'COND-502',
      dischargeSummaryId: 'NOTE-509',
    },
  ];

  const encounters: Encounter[] = [
    // P001 Encounters
    { id: 'ENC-101', patientId: 'P001', admissionId: 'ADM-101', type: 'inpatient_admission', date: '2025-09-12T08:30:00Z', department: 'Cardiovascular Care', doctorId: 'DOC-102', reason: 'Initial admission for acute heart failure decompensation' },
    { id: 'ENC-102', patientId: 'P001', type: 'outpatient_clinic', date: '2025-11-20T14:00:00Z', department: 'Cardiology Outpatient', doctorId: 'DOC-102', reason: 'Routine 2-month post-discharge heart failure follow-up' },
    { id: 'ENC-103', patientId: 'P001', admissionId: 'ADM-102', type: 'inpatient_admission', date: '2026-02-05T10:15:00Z', department: 'Cardiovascular Care', doctorId: 'DOC-102', reason: 'Admission for severe hyperkalemia and renal decompensation' },
    { id: 'ENC-104', patientId: 'P001', type: 'specialist_consult', date: '2026-04-14T09:30:00Z', department: 'Nephrology Outpatient', doctorId: 'DOC-101', reason: 'Renal function stabilization check post-Entresto initiation' },
    { id: 'ENC-105', patientId: 'P001', admissionId: 'ADM-103', type: 'inpatient_admission', date: '2026-08-18T11:45:00Z', department: 'Cardiovascular Care', doctorId: 'DOC-102', reason: 'Admission for GDMT step-up and volume overload management' },

    // P002 Encounters
    { id: 'ENC-201', patientId: 'P002', admissionId: 'ADM-201', type: 'inpatient_admission', date: '2025-07-10T13:00:00Z', department: 'General Medicine', doctorId: 'DOC-101', reason: 'Admission for right leg acute DVT anticoagulation initiation' },
    { id: 'ENC-202', patientId: 'P002', type: 'outpatient_clinic', date: '2025-08-22T10:00:00Z', department: 'Anticoagulation Clinic', doctorId: 'DOC-101', reason: 'Labile INR monitoring and Warfarin dosage adjustment' },
    { id: 'ENC-203', patientId: 'P002', admissionId: 'ADM-202', type: 'inpatient_admission', date: '2026-01-14T09:20:00Z', department: 'General Medicine', doctorId: 'DOC-101', reason: 'Emergency admission for bilateral pulmonary embolism on Warfarin' },
    { id: 'ENC-204', patientId: 'P002', type: 'outpatient_clinic', date: '2026-03-30T15:00:00Z', department: 'Primary Care', doctorId: 'DOC-101', reason: 'Follow-up on Apixaban therapy and glycemic control' },
    { id: 'ENC-205', patientId: 'P002', admissionId: 'ADM-203', type: 'inpatient_admission', date: '2026-09-02T07:15:00Z', department: 'General Medicine', doctorId: 'DOC-101', reason: 'Admission for hematochezia and acute drop in hemoglobin' },

    // P003 Encounters
    { id: 'ENC-301', patientId: 'P003', type: 'specialist_consult', date: '2025-05-10T11:00:00Z', department: 'Neuroimmunology', doctorId: 'DOC-104', reason: 'Routine MS monitoring and pre-infusion assessment' },
    { id: 'ENC-302', patientId: 'P003', admissionId: 'ADM-301', type: 'inpatient_admission', date: '2025-10-14T17:40:00Z', department: 'Infectious Diseases', doctorId: 'DOC-103', reason: 'Emergency admission for septic shock secondary to UTI' },
    { id: 'ENC-303', patientId: 'P003', type: 'outpatient_clinic', date: '2025-12-04T13:30:00Z', department: 'Infectious Diseases', doctorId: 'DOC-103', reason: 'Post-sepsis test of cure follow-up' },
    { id: 'ENC-304', patientId: 'P003', admissionId: 'ADM-302', type: 'inpatient_admission', date: '2026-04-02T14:10:00Z', department: 'Neurology', doctorId: 'DOC-105', reason: 'Admission for severe MS acute relapse management' },

    // P004 Encounters
    { id: 'ENC-401', patientId: 'P004', admissionId: 'ADM-401', type: 'inpatient_admission', date: '2025-06-20T06:45:00Z', department: 'Cardiovascular Care', doctorId: 'DOC-102', reason: 'Admission for acute COPD exacerbation and AF with rapid ventricular rate' },
    { id: 'ENC-402', patientId: 'P004', type: 'outpatient_clinic', date: '2025-11-12T10:15:00Z', department: 'Pulmonology Outpatient', doctorId: 'DOC-101', reason: 'Pulmonary function test and inhaler therapy escalation' },
    { id: 'ENC-403', patientId: 'P004', admissionId: 'ADM-402', type: 'inpatient_admission', date: '2026-03-10T08:00:00Z', department: 'Endocrinology & Metabolism', doctorId: 'DOC-108', reason: 'Admission for thyroid storm / severe thyrotoxicosis' },
    { id: 'ENC-404', patientId: 'P004', type: 'specialist_consult', date: '2026-07-22T14:00:00Z', department: 'Endocrinology Outpatient', doctorId: 'DOC-108', reason: 'Evaluation of thyroid function post-amiodarone cessation' },

    // P005 Encounters
    { id: 'ENC-501', patientId: 'P005', admissionId: 'ADM-501', type: 'inpatient_admission', date: '2025-08-01T12:00:00Z', department: 'Orthopedic Surgery', doctorId: 'DOC-107', reason: 'Trauma admission for surgical repair of right femoral neck fracture' },
    { id: 'ENC-502', patientId: 'P005', type: 'outpatient_clinic', date: '2025-10-18T11:00:00Z', department: 'Orthopedic Outpatient', doctorId: 'DOC-107', reason: 'Two-month post-hemiarthroplasty physical rehabilitation review' },
    { id: 'ENC-503', patientId: 'P005', admissionId: 'ADM-502', type: 'inpatient_admission', date: '2026-05-15T10:30:00Z', department: 'General Medicine', doctorId: 'DOC-101', reason: 'Admission for acute confusion, urinary retention, and agitation' },
  ];

  const prescriptions: Prescription[] = [
    // P001 Prescriptions across admissions
    {
      id: 'RX-101',
      patientId: 'P001',
      encounterId: 'ENC-101',
      admissionId: 'ADM-101',
      medicationId: 'MED-LISINOPRIL',
      dosage: '20 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2025-09-12',
      endDate: '2026-02-06',
      status: 'Discontinued',
      action: 'Initiated',
      reason: 'First-line afterload reduction and mortality benefit in HFrEF',
      sourceRecordId: 'NOTE-101',
    },
    {
      id: 'RX-102',
      patientId: 'P001',
      encounterId: 'ENC-101',
      admissionId: 'ADM-101',
      medicationId: 'MED-FUROSEMIDE',
      dosage: '40 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2025-09-12',
      endDate: '2026-02-09',
      status: 'Discontinued',
      action: 'Initiated',
      reason: 'Diuresis for peripheral volume overload and pulmonary congestion',
      sourceRecordId: 'NOTE-101',
    },
    {
      id: 'RX-103',
      patientId: 'P001',
      encounterId: 'ENC-101',
      admissionId: 'ADM-101',
      medicationId: 'MED-METFORMIN',
      dosage: '500 mg',
      frequency: 'Twice Daily',
      route: 'Oral',
      startDate: '2025-09-12',
      status: 'Active',
      action: 'Maintained',
      reason: 'Glycemic control for Type 2 Diabetes',
      sourceRecordId: 'NOTE-101',
    },
    {
      id: 'RX-104',
      patientId: 'P001',
      encounterId: 'ENC-103',
      admissionId: 'ADM-102',
      medicationId: 'MED-LISINOPRIL',
      dosage: '20 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2025-09-12',
      endDate: '2026-02-06',
      status: 'Discontinued',
      action: 'Discontinued',
      reason: 'Discontinued urgently due to acute hyperkalemia (Potassium 5.7 mEq/L) and acute creatinine rise from 1.2 to 2.1 mg/dL',
      sourceRecordId: 'NOTE-105',
    },
    {
      id: 'RX-105',
      patientId: 'P001',
      encounterId: 'ENC-103',
      admissionId: 'ADM-102',
      medicationId: 'MED-ENTRESTO',
      dosage: '24/26 mg',
      frequency: 'Twice Daily',
      route: 'Oral',
      startDate: '2026-02-08',
      endDate: '2026-08-20',
      status: 'Adjusted',
      action: 'Initiated',
      reason: 'Initiated starting dose of ARNI after 36-hour Lisinopril washout and potassium stabilization (< 5.0 mEq/L)',
      sourceRecordId: 'NOTE-106',
    },
    {
      id: 'RX-106',
      patientId: 'P001',
      encounterId: 'ENC-103',
      admissionId: 'ADM-102',
      medicationId: 'MED-TORSEMIDE',
      dosage: '20 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2026-02-09',
      status: 'Active',
      action: 'Initiated',
      reason: 'Switched from oral Furosemide to Torsemide for superior bioavailability and reliable diuretic action in CKD 3b',
      sourceRecordId: 'NOTE-106',
    },
    {
      id: 'RX-107',
      patientId: 'P001',
      encounterId: 'ENC-105',
      admissionId: 'ADM-103',
      medicationId: 'MED-ENTRESTO',
      dosage: '49/51 mg',
      frequency: 'Twice Daily',
      route: 'Oral',
      startDate: '2026-08-20',
      status: 'Active',
      action: 'Dose Increased',
      reason: 'Titrated up Entresto toward target guideline-directed medical therapy dose with stable renal indices',
      sourceRecordId: 'NOTE-108',
    },
    {
      id: 'RX-108',
      patientId: 'P001',
      encounterId: 'ENC-105',
      admissionId: 'ADM-103',
      medicationId: 'MED-JARDIANCE',
      dosage: '10 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2026-08-22',
      status: 'Active',
      action: 'Initiated',
      reason: 'Added SGLT2 inhibitor for quadruple GDMT therapy in chronic HFrEF with renal protection benefit',
      sourceRecordId: 'NOTE-109',
    },

    // P002 Prescriptions
    {
      id: 'RX-201',
      patientId: 'P002',
      encounterId: 'ENC-201',
      admissionId: 'ADM-201',
      medicationId: 'MED-WARFARIN',
      dosage: '5 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2025-07-12',
      endDate: '2026-01-14',
      status: 'Discontinued',
      action: 'Initiated',
      reason: 'Anticoagulation for acute popliteal DVT with target INR 2.0 - 3.0',
      sourceRecordId: 'NOTE-202',
    },
    {
      id: 'RX-202',
      patientId: 'P002',
      encounterId: 'ENC-201',
      admissionId: 'ADM-201',
      medicationId: 'MED-METFORMIN',
      dosage: '1000 mg',
      frequency: 'Twice Daily',
      route: 'Oral',
      startDate: '2025-07-10',
      status: 'Active',
      action: 'Maintained',
      reason: 'Type 2 Diabetes glycemic control',
      sourceRecordId: 'NOTE-201',
    },
    {
      id: 'RX-203',
      patientId: 'P002',
      encounterId: 'ENC-203',
      admissionId: 'ADM-202',
      medicationId: 'MED-WARFARIN',
      dosage: '5 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2025-07-12',
      endDate: '2026-01-14',
      status: 'Discontinued',
      action: 'Discontinued',
      reason: 'Warfarin failure evidenced by breakthrough pulmonary embolism and erratic INR control',
      sourceRecordId: 'NOTE-205',
    },
    {
      id: 'RX-204',
      patientId: 'P002',
      encounterId: 'ENC-203',
      admissionId: 'ADM-202',
      medicationId: 'MED-ELIQUIS',
      dosage: '10 mg',
      frequency: 'Twice Daily x 7 days, then 5 mg BID',
      route: 'Oral',
      startDate: '2026-01-14',
      endDate: '2026-09-02',
      status: 'Adjusted',
      action: 'Initiated',
      reason: 'Direct Factor Xa inhibitor initiated for acute treatment and secondary prevention of pulmonary embolism',
      sourceRecordId: 'NOTE-205',
    },
    {
      id: 'RX-205',
      patientId: 'P002',
      encounterId: 'ENC-205',
      admissionId: 'ADM-203',
      medicationId: 'MED-ELIQUIS',
      dosage: '2.5 mg',
      frequency: 'Twice Daily',
      route: 'Oral',
      startDate: '2026-09-05',
      status: 'Active',
      action: 'Dose Decreased',
      reason: 'Resumed at reduced dose following lower GI bleed stabilization and colonoscopy hemostasis',
      sourceRecordId: 'NOTE-209',
    },

    // P003 Prescriptions
    {
      id: 'RX-301',
      patientId: 'P003',
      encounterId: 'ENC-301',
      medicationId: 'MED-OCRELIZUMAB',
      dosage: '600 mg',
      frequency: 'Every 6 Months',
      route: 'IV Infusion',
      startDate: '2023-01-15',
      status: 'Active',
      action: 'Maintained',
      reason: 'Disease-modifying therapy for Relapsing-Remitting Multiple Sclerosis',
      sourceRecordId: 'NOTE-301',
    },
    {
      id: 'RX-302',
      patientId: 'P003',
      encounterId: 'ENC-301',
      medicationId: 'MED-BACLOFEN',
      dosage: '10 mg',
      frequency: 'Three Times Daily',
      route: 'Oral',
      startDate: '2024-05-10',
      status: 'Active',
      action: 'Maintained',
      reason: 'Symptomatic management of lower extremity muscular spasticity',
      sourceRecordId: 'NOTE-301',
    },
    {
      id: 'RX-303',
      patientId: 'P003',
      encounterId: 'ENC-302',
      admissionId: 'ADM-301',
      medicationId: 'MED-CEFTRIAXONE',
      dosage: '2 g',
      frequency: 'Every 24 Hours',
      route: 'IV Injection',
      startDate: '2025-10-14',
      endDate: '2025-10-18',
      status: 'Completed',
      action: 'Initiated',
      reason: 'Empiric broad-spectrum antibiotic coverage for severe urosepsis',
      sourceRecordId: 'NOTE-302',
    },
    {
      id: 'RX-304',
      patientId: 'P003',
      encounterId: 'ENC-302',
      admissionId: 'ADM-301',
      medicationId: 'MED-CIPRO',
      dosage: '500 mg',
      frequency: 'Twice Daily x 7 days',
      route: 'Oral',
      startDate: '2025-10-18',
      endDate: '2025-10-25',
      status: 'Completed',
      action: 'Initiated',
      reason: 'Step-down oral antibiotic course for confirmed susceptible E. coli urinary tract infection',
      sourceRecordId: 'NOTE-304',
    },
    {
      id: 'RX-305',
      patientId: 'P003',
      encounterId: 'ENC-304',
      admissionId: 'ADM-302',
      medicationId: 'MED-METHYLPRED',
      dosage: '1000 mg',
      frequency: 'Once Daily x 3 days',
      route: 'IV Solution',
      startDate: '2026-04-02',
      endDate: '2026-04-05',
      status: 'Completed',
      action: 'Initiated',
      reason: 'High-dose pulse corticosteroid therapy for acute multiple sclerosis relapse with paraparesis',
      sourceRecordId: 'NOTE-306',
    },

    // P004 Prescriptions
    {
      id: 'RX-401',
      patientId: 'P004',
      encounterId: 'ENC-401',
      admissionId: 'ADM-401',
      medicationId: 'MED-SPIRIVA',
      dosage: '18 mcg',
      frequency: 'Once Daily',
      route: 'Inhalation',
      startDate: '2023-08-10',
      endDate: '2025-11-12',
      status: 'Discontinued',
      action: 'Maintained',
      reason: 'Maintenance bronchodilation for severe COPD',
      sourceRecordId: 'NOTE-401',
    },
    {
      id: 'RX-402',
      patientId: 'P004',
      encounterId: 'ENC-401',
      admissionId: 'ADM-401',
      medicationId: 'MED-AMIODARONE',
      dosage: '200 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2025-06-22',
      endDate: '2026-03-11',
      status: 'Discontinued',
      action: 'Initiated',
      reason: 'Rhythm and rate control for acute new onset atrial fibrillation with RVR in presence of structural lung disease',
      sourceRecordId: 'NOTE-402',
    },
    {
      id: 'RX-403',
      patientId: 'P004',
      encounterId: 'ENC-402',
      medicationId: 'MED-TRELEGY',
      dosage: '100/62.5/25 mcg',
      frequency: 'Once Daily',
      route: 'Inhalation',
      startDate: '2025-11-12',
      status: 'Active',
      action: 'Initiated',
      reason: 'Escalated to triple inhaler therapy (ICS/LAMA/LABA) due to recurrent severe COPD hospital admissions',
      sourceRecordId: 'NOTE-403',
    },
    {
      id: 'RX-404',
      patientId: 'P004',
      encounterId: 'ENC-403',
      admissionId: 'ADM-402',
      medicationId: 'MED-AMIODARONE',
      dosage: '200 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2025-06-22',
      endDate: '2026-03-11',
      status: 'Discontinued',
      action: 'Discontinued',
      reason: 'Urgently discontinued secondary to documented severe Amiodarone-Induced Thyrotoxicosis (TSH < 0.01)',
      sourceRecordId: 'NOTE-405',
    },
    {
      id: 'RX-405',
      patientId: 'P004',
      encounterId: 'ENC-403',
      admissionId: 'ADM-402',
      medicationId: 'MED-METOPROLOL',
      dosage: '50 mg',
      frequency: 'Once Daily',
      route: 'Oral',
      startDate: '2026-03-11',
      status: 'Active',
      action: 'Initiated',
      reason: 'Rate control for atrial fibrillation replacing amiodarone, titrated cautiously for airway safety',
      sourceRecordId: 'NOTE-405',
    },

    // P005 Prescriptions
    {
      id: 'RX-501',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      medicationId: 'MED-OXYCODONE',
      dosage: '5 - 10 mg',
      frequency: 'Every 4 Hours PRN Pain',
      route: 'Oral',
      startDate: '2025-08-01',
      endDate: '2025-08-04',
      status: 'Discontinued',
      action: 'Discontinued',
      reason: 'Discontinued due to acute severe opioid-induced neurotoxicity, auditory/visual hallucinations, and combativeness',
      sourceRecordId: 'NOTE-504',
    },
    {
      id: 'RX-502',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      medicationId: 'MED-TRAMADOL',
      dosage: '25 mg',
      frequency: 'Every 6 Hours PRN Pain',
      route: 'Oral',
      startDate: '2025-08-04',
      endDate: '2025-08-15',
      status: 'Completed',
      action: 'Initiated',
      reason: 'Substituted for oxycodone at low dose for postoperative orthopedic pain with reduced psychotropic burden',
      sourceRecordId: 'NOTE-505',
    },
    {
      id: 'RX-503',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      medicationId: 'MED-ACETAMINOPHEN',
      dosage: '650 mg',
      frequency: 'Every 6 Hours Scheduled',
      route: 'Oral',
      startDate: '2025-08-01',
      status: 'Active',
      action: 'Maintained',
      reason: 'Baseline non-opioid multimodal analgesia for joint pain and surgical recovery',
      sourceRecordId: 'NOTE-501',
    },
    {
      id: 'RX-504',
      patientId: 'P005',
      encounterId: 'ENC-503',
      admissionId: 'ADM-502',
      medicationId: 'MED-BENADRYL',
      dosage: '50 mg',
      frequency: 'Nightly at bedtime (Self-Administered OTC)',
      route: 'Oral',
      startDate: '2026-05-01',
      endDate: '2026-05-15',
      status: 'Discontinued',
      action: 'Discontinued',
      reason: 'Discontinued immediately: OTC anticholinergic toxicity causing urinary retention and acute confusional state',
      sourceRecordId: 'NOTE-508',
    },
    {
      id: 'RX-505',
      patientId: 'P005',
      encounterId: 'ENC-503',
      admissionId: 'ADM-502',
      medicationId: 'MED-MELATONIN',
      dosage: '3 mg',
      frequency: 'Nightly at bedtime',
      route: 'Oral',
      startDate: '2026-05-16',
      status: 'Active',
      action: 'Initiated',
      reason: 'Non-pharmacologic sleep architecture support replacing anticholinergic sleep aids in elderly patient',
      sourceRecordId: 'NOTE-509',
    },
  ];

  const labResults: LabResult[] = [
    // P001 Labs
    { id: 'LAB-101', patientId: 'P001', encounterId: 'ENC-101', testId: 'TEST-CREAT', date: '2025-09-12T09:15:00Z', value: 1.2, unit: 'mg/dL', flag: 'Normal', sourceRecordId: 'NOTE-101' },
    { id: 'LAB-102', patientId: 'P001', encounterId: 'ENC-101', testId: 'TEST-EGFR', date: '2025-09-12T09:15:00Z', value: 58.0, unit: 'mL/min/1.73m2', flag: 'Low', sourceRecordId: 'NOTE-101' },
    { id: 'LAB-103', patientId: 'P001', encounterId: 'ENC-101', testId: 'TEST-K', date: '2025-09-12T09:15:00Z', value: 4.3, unit: 'mEq/L', flag: 'Normal', sourceRecordId: 'NOTE-101' },
    { id: 'LAB-104', patientId: 'P001', encounterId: 'ENC-101', testId: 'TEST-BNP', date: '2025-09-12T09:15:00Z', value: 980.0, unit: 'pg/mL', flag: 'Critical High', sourceRecordId: 'NOTE-101' },
    { id: 'LAB-105', patientId: 'P001', encounterId: 'ENC-102', testId: 'TEST-CREAT', date: '2025-11-20T14:30:00Z', value: 1.3, unit: 'mg/dL', flag: 'High', sourceRecordId: 'NOTE-104' },
    { id: 'LAB-106', patientId: 'P001', encounterId: 'ENC-102', testId: 'TEST-BNP', date: '2025-11-20T14:30:00Z', value: 620.0, unit: 'pg/mL', flag: 'High', sourceRecordId: 'NOTE-104' },
    { id: 'LAB-107', patientId: 'P001', encounterId: 'ENC-103', testId: 'TEST-CREAT', date: '2026-02-05T11:00:00Z', value: 2.1, unit: 'mg/dL', flag: 'Critical High', sourceRecordId: 'NOTE-105' },
    { id: 'LAB-108', patientId: 'P001', encounterId: 'ENC-103', testId: 'TEST-EGFR', date: '2026-02-05T11:00:00Z', value: 31.0, unit: 'mL/min/1.73m2', flag: 'Critical Low', sourceRecordId: 'NOTE-105' },
    { id: 'LAB-109', patientId: 'P001', encounterId: 'ENC-103', testId: 'TEST-K', date: '2026-02-05T11:00:00Z', value: 5.7, unit: 'mEq/L', flag: 'Critical High', sourceRecordId: 'NOTE-105' },
    { id: 'LAB-110', patientId: 'P001', encounterId: 'ENC-103', testId: 'TEST-BNP', date: '2026-02-05T11:00:00Z', value: 1450.0, unit: 'pg/mL', flag: 'Critical High', sourceRecordId: 'NOTE-105' },
    { id: 'LAB-111', patientId: 'P001', encounterId: 'ENC-103', testId: 'TEST-K', date: '2026-02-08T08:00:00Z', value: 4.6, unit: 'mEq/L', flag: 'Normal', sourceRecordId: 'NOTE-106' },
    { id: 'LAB-112', patientId: 'P001', encounterId: 'ENC-104', testId: 'TEST-CREAT', date: '2026-04-14T10:00:00Z', value: 1.7, unit: 'mg/dL', flag: 'High', sourceRecordId: 'NOTE-107' },
    { id: 'LAB-113', patientId: 'P001', encounterId: 'ENC-104', testId: 'TEST-EGFR', date: '2026-04-14T10:00:00Z', value: 42.0, unit: 'mL/min/1.73m2', flag: 'Low', sourceRecordId: 'NOTE-107' },
    { id: 'LAB-114', patientId: 'P001', encounterId: 'ENC-105', testId: 'TEST-CREAT', date: '2026-08-18T12:30:00Z', value: 1.6, unit: 'mg/dL', flag: 'High', sourceRecordId: 'NOTE-108' },
    { id: 'LAB-115', patientId: 'P001', encounterId: 'ENC-105', testId: 'TEST-K', date: '2026-08-18T12:30:00Z', value: 4.4, unit: 'mEq/L', flag: 'Normal', sourceRecordId: 'NOTE-108' },
    { id: 'LAB-116', patientId: 'P001', encounterId: 'ENC-105', testId: 'TEST-BNP', date: '2026-08-18T12:30:00Z', value: 890.0, unit: 'pg/mL', flag: 'Critical High', sourceRecordId: 'NOTE-108' },

    // P002 Labs
    { id: 'LAB-201', patientId: 'P002', encounterId: 'ENC-201', testId: 'TEST-INR', date: '2025-07-10T13:45:00Z', value: 1.0, unit: 'ratio', flag: 'Normal', sourceRecordId: 'NOTE-201' },
    { id: 'LAB-202', patientId: 'P002', encounterId: 'ENC-201', testId: 'TEST-PLT', date: '2025-07-10T13:45:00Z', value: 240.0, unit: 'x10^9/L', flag: 'Normal', sourceRecordId: 'NOTE-201' },
    { id: 'LAB-203', patientId: 'P002', encounterId: 'ENC-201', testId: 'TEST-INR', date: '2025-07-15T09:00:00Z', value: 2.1, unit: 'ratio', flag: 'Normal', sourceRecordId: 'NOTE-203' },
    { id: 'LAB-204', patientId: 'P002', encounterId: 'ENC-202', testId: 'TEST-INR', date: '2025-08-22T10:30:00Z', value: 1.4, unit: 'ratio', flag: 'Low', sourceRecordId: 'NOTE-204' },
    // CONTRADICTORY LAB RESULT: Recorded as 2.8 in lab system, but Note NOTE-205 states "INR critically low at 1.5"!
    { id: 'LAB-205', patientId: 'P002', encounterId: 'ENC-203', testId: 'TEST-INR', date: '2026-01-14T10:00:00Z', value: 2.8, unit: 'ratio', flag: 'High', sourceRecordId: 'NOTE-205', notes: 'Electronic lab analyzer output shows INR 2.8; however attending physician chart note NOTE-205 explicitly documents INR as 1.5.' },
    { id: 'LAB-206', patientId: 'P002', encounterId: 'ENC-203', testId: 'TEST-CREAT', date: '2026-01-14T10:00:00Z', value: 1.5, unit: 'mg/dL', flag: 'High', sourceRecordId: 'NOTE-205' },
    { id: 'LAB-207', patientId: 'P002', encounterId: 'ENC-204', testId: 'TEST-HBA1C', date: '2026-03-30T15:20:00Z', value: 7.8, unit: '%', flag: 'High', sourceRecordId: 'NOTE-207' },
    { id: 'LAB-208', patientId: 'P002', encounterId: 'ENC-205', testId: 'TEST-HGB', date: '2026-09-02T08:00:00Z', value: 8.4, unit: 'g/dL', flag: 'Critical Low', sourceRecordId: 'NOTE-208' },
    { id: 'LAB-209', patientId: 'P002', encounterId: 'ENC-205', testId: 'TEST-HGB', date: '2026-09-05T10:00:00Z', value: 10.1, unit: 'g/dL', flag: 'Low', sourceRecordId: 'NOTE-209' },

    // P003 Labs
    { id: 'LAB-301', patientId: 'P003', encounterId: 'ENC-302', testId: 'TEST-WBC', date: '2025-10-14T18:00:00Z', value: 16.4, unit: 'x10^9/L', flag: 'Critical High', sourceRecordId: 'NOTE-302' },
    { id: 'LAB-302', patientId: 'P003', encounterId: 'ENC-302', testId: 'TEST-CRP', date: '2025-10-14T18:00:00Z', value: 85.0, unit: 'mg/L', flag: 'Critical High', sourceRecordId: 'NOTE-302' },
    { id: 'LAB-303', patientId: 'P003', encounterId: 'ENC-302', testId: 'TEST-CREAT', date: '2025-10-14T18:00:00Z', value: 1.4, unit: 'mg/dL', flag: 'High', sourceRecordId: 'NOTE-302' },
    { id: 'LAB-304', patientId: 'P003', encounterId: 'ENC-302', testId: 'TEST-WBC', date: '2025-10-18T07:30:00Z', value: 7.2, unit: 'x10^9/L', flag: 'Normal', sourceRecordId: 'NOTE-304' },
    { id: 'LAB-305', patientId: 'P003', encounterId: 'ENC-304', testId: 'TEST-WBC', date: '2026-04-02T15:00:00Z', value: 8.1, unit: 'x10^9/L', flag: 'Normal', sourceRecordId: 'NOTE-305' },
    { id: 'LAB-306', patientId: 'P003', encounterId: 'ENC-304', testId: 'TEST-CRP', date: '2026-04-02T15:00:00Z', value: 4.2, unit: 'mg/L', flag: 'Normal', sourceRecordId: 'NOTE-305' },

    // P004 Labs
    { id: 'LAB-401', patientId: 'P004', encounterId: 'ENC-401', testId: 'TEST-TSH', date: '2025-06-20T07:30:00Z', value: 2.4, unit: 'uIU/mL', flag: 'Normal', sourceRecordId: 'NOTE-401' },
    { id: 'LAB-402', patientId: 'P004', encounterId: 'ENC-401', testId: 'TEST-TROP', date: '2025-06-20T07:30:00Z', value: 8.0, unit: 'ng/L', flag: 'Normal', sourceRecordId: 'NOTE-401' },
    { id: 'LAB-403', patientId: 'P004', encounterId: 'ENC-403', testId: 'TEST-TSH', date: '2026-03-10T09:00:00Z', value: 0.01, unit: 'uIU/mL', flag: 'Critical Low', sourceRecordId: 'NOTE-404' },
    { id: 'LAB-404', patientId: 'P004', encounterId: 'ENC-403', testId: 'TEST-FT4', date: '2026-03-10T09:00:00Z', value: 3.8, unit: 'ng/dL', flag: 'Critical High', sourceRecordId: 'NOTE-404' },
    { id: 'LAB-405', patientId: 'P004', encounterId: 'ENC-404', testId: 'TEST-TSH', date: '2026-07-22T14:30:00Z', value: 0.85, unit: 'uIU/mL', flag: 'Normal', sourceRecordId: 'NOTE-407' },

    // P005 Labs
    { id: 'LAB-501', patientId: 'P005', encounterId: 'ENC-501', testId: 'TEST-HGB', date: '2025-08-01T13:00:00Z', value: 11.2, unit: 'g/dL', flag: 'Low', sourceRecordId: 'NOTE-501' },
    { id: 'LAB-502', patientId: 'P005', encounterId: 'ENC-501', testId: 'TEST-HGB', date: '2025-08-02T06:00:00Z', value: 9.1, unit: 'g/dL', flag: 'Low', sourceRecordId: 'NOTE-502' },
    { id: 'LAB-503', patientId: 'P005', encounterId: 'ENC-503', testId: 'TEST-NA', date: '2026-05-15T11:15:00Z', value: 138.0, unit: 'mEq/L', flag: 'Normal', sourceRecordId: 'NOTE-507' },
    { id: 'LAB-504', patientId: 'P005', encounterId: 'ENC-503', testId: 'TEST-BUN', date: '2026-05-15T11:15:00Z', value: 24.0, unit: 'mg/dL', flag: 'High', sourceRecordId: 'NOTE-507' },
    { id: 'LAB-505', patientId: 'P005', encounterId: 'ENC-503', testId: 'TEST-CREAT', date: '2026-05-15T11:15:00Z', value: 1.1, unit: 'mg/dL', flag: 'Normal', sourceRecordId: 'NOTE-507' },
  ];

  const clinicalNotes: ClinicalNote[] = [
    // P001 Notes
    {
      id: 'NOTE-101',
      patientId: 'P001',
      encounterId: 'ENC-101',
      admissionId: 'ADM-101',
      timestamp: '2025-09-12T10:00:00Z',
      noteType: 'Admission Note',
      title: 'H&P: Acute Decompensated Heart Failure Exacerbation',
      authorId: 'DOC-102',
      text: `HISTORY OF PRESENT ILLNESS:
Mrs. Eleanor Vance is a 68-year-old female with known history of HFrEF (ejection fraction 32%), hypertension, and CKD Stage 3a who presents with a 5-day history of progressively worsening shortness of breath, 2-pillow orthopnea, and 3+ bilateral pitting pedal edema up to mid-shin. She admits to dietary indiscretion with high sodium intake over the holiday weekend.

PHYSICAL EXAMINATION:
Vitals: BP 152/88 mmHg, HR 88 bpm, RR 22 bpm, SpO2 93% on room air.
Cardiovascular: Tachycardic, regular rhythm, S3 gallop audible at apex, JVD 8 cm above sternal angle.
Pulmonary: Bibasilar crackles extending to mid-lung fields.
Extremities: 3+ pitting edema bilaterally to mid-calf.

ASSESSMENT & PLAN:
1. Acute Decompensated Heart Failure (HFrEF): Volume overload secondary to dietary indiscretion.
   - IV Furosemide 40 mg BID for aggressive diuresis.
   - Initiate oral Lisinopril 20 mg daily for afterload reduction.
   - Monitor daily weights, strict ins and outs, daily basic metabolic panel.
2. Chronic Kidney Disease Stage 3a: Baseline creatinine 1.2 mg/dL, eGFR 58 mL/min.
3. Diabetes Mellitus Type 2: Continue Metformin 500 mg BID.`,
      sourceRecordId: 'REC-P001-001',
    },
    {
      id: 'NOTE-102',
      patientId: 'P001',
      encounterId: 'ENC-101',
      admissionId: 'ADM-101',
      timestamp: '2025-09-14T11:00:00Z',
      noteType: 'Progress Note',
      title: 'Cardiology Inpatient Progress Note - Day 3',
      authorId: 'DOC-102',
      text: `SUBJECTIVE:
Patient breathing much more comfortably. Denies orthopnea last night. Net negative 3.2 liters over 48 hours. Notes a mild, dry intermittent cough that began after Lisinopril initiation, but lungs are clearing.

OBJECTIVE:
BP 128/76 mmHg, HR 72 bpm. Trace ankle edema only. Creatinine 1.25 mg/dL, Potassium 4.4 mEq/L.

PLAN:
Transition IV diuresis to oral Furosemide 40 mg daily. Continue Lisinopril 20 mg daily. Prepare for discharge in 48 hours.`,
      sourceRecordId: 'REC-P001-002',
      metaAnnotation: 'Documents initial mild dry cough with Lisinopril.',
    },
    {
      id: 'NOTE-103',
      patientId: 'P001',
      encounterId: 'ENC-101',
      admissionId: 'ADM-101',
      timestamp: '2025-09-16T13:30:00Z',
      noteType: 'Discharge Summary',
      title: 'Cardiovascular Discharge Summary - ADM-101',
      authorId: 'DOC-102',
      text: `DISCHARGE SUMMARY:
ADMIT DATE: 2025-09-12 | DISCHARGE DATE: 2025-09-16
PRINCIPAL DIAGNOSIS: Acute decompensated systolic heart failure (resolved).
SECONDARY DIAGNOSES: Essential hypertension, Type 2 diabetes, CKD stage 3a.

HOSPITAL COURSE:
Patient responded briskly to intravenous loop diuresis with total weight loss of 4.5 kg. Successfully transitioned to oral regimen. Discharged on Lisinopril 20 mg daily, Furosemide 40 mg daily, and Metformin 500 mg BID.

FOLLOW-UP:
Follow-up scheduled in Cardiology Outpatient Clinic in 8-10 weeks with repeat renal panel and BNP.`,
      sourceRecordId: 'REC-P001-003',
    },
    {
      id: 'NOTE-104',
      patientId: 'P001',
      encounterId: 'ENC-102',
      timestamp: '2025-11-20T14:45:00Z',
      noteType: 'Consultation Note',
      title: 'Cardiology Outpatient Follow-up Note',
      authorId: 'DOC-102',
      text: `CLINICAL SUMMARY:
Mrs. Vance returns for routine follow-up. Weight has remained relatively stable (64.2 kg).
CONTRADICTION: Note states: "Patient specifically denies any ACE-inhibitor cough, angioedema, or lightheadedness on Lisinopril." (Note: In earlier inpatient note NOTE-102, a mild dry cough was clearly documented).
Labs today: Creatinine 1.3 mg/dL, BNP 620 pg/mL.
Plan: Continue current regimen. Emphasize low sodium diet (< 2g/day).`,
      sourceRecordId: 'REC-P001-004',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Contradiction: Claims patient denies ACEi cough, contrary to NOTE-102.',
    },
    {
      id: 'NOTE-105',
      patientId: 'P001',
      encounterId: 'ENC-103',
      admissionId: 'ADM-102',
      timestamp: '2026-02-05T12:00:00Z',
      noteType: 'Admission Note',
      title: 'H&P: Acute Hyperkalemia and Renal Decompensation',
      authorId: 'DOC-102',
      text: `REASON FOR ADMISSION:
Patient presents to the emergency department with profound generalized weakness, malaise, and bradycardia.
Urgent blood work reveals:
- Serum Creatinine: 2.1 mg/dL (Baseline 1.2 mg/dL - significant acute kidney injury)
- eGFR: 31 mL/min/1.73m2
- Serum Potassium: 5.7 mEq/L (Critical hyperkalemia)
- BNP: 1450 pg/mL

MEDICATION ACTION:
Lisinopril 20 mg is STOPPED IMMEDIATELY. Lisinopril is discontinued due to severe hyperkalemia and acute worsening renal failure. Administered oral Lokelma (sodium zirconium cyclosilicate) 10g and IV calcium gluconate for cardiac membrane stabilization. IV dextrose and insulin administered. Furosemide held temporarily until volume status re-assessed.`,
      sourceRecordId: 'REC-P001-005',
      metaAnnotation: 'Key evidence explaining immediate Lisinopril discontinuation.',
    },
    {
      id: 'NOTE-106',
      patientId: 'P001',
      encounterId: 'ENC-103',
      admissionId: 'ADM-102',
      timestamp: '2026-02-10T15:00:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary: Medication Transition (Lisinopril to Entresto / Furosemide to Torsemide)',
      authorId: 'DOC-102',
      text: `DISCHARGE SUMMARY: ADM-102
HOSPITAL COURSE & MEDICATION CHANGES:
1. Lisinopril was permanently discontinued due to ACE-inhibitor induced hyperkalemia (5.7 mEq/L) and renal hypoperfusion.
2. Following 36-hour washout and normalization of potassium to 4.6 mEq/L, patient was initiated on low-dose Angiotensin Receptor-Neprilysin Inhibitor (ARNI): Sacubitril/Valsartan (Entresto) 24/26 mg BID.
3. Due to variable oral absorption of Furosemide in the presence of gut wall edema and advancing CKD (Stage 3b), Furosemide was discontinued and patient was switched to Torsemide 20 mg daily for its predictable 80-90% oral bioavailability.
Creatinine improved to 1.7 mg/dL at discharge.`,
      sourceRecordId: 'REC-P001-006',
      metaAnnotation: 'Direct documentary evidence comparing and justifying medication changes between ADM-101 and ADM-102.',
    },
    {
      id: 'NOTE-107',
      patientId: 'P001',
      encounterId: 'ENC-104',
      timestamp: '2026-04-14T10:30:00Z',
      noteType: 'Consultation Note',
      title: 'Nephrology Outpatient Evaluation',
      authorId: 'DOC-101',
      text: `NEPHROLOGY CONSULTATION:
Evaluating patient post-Entresto initiation.
Renal Function: Creatinine has stabilized at 1.7 mg/dL with eGFR 42 mL/min. Serum potassium is 4.8 mEq/L.
Patient tolerating Torsemide well without symptomatic orthostasis.
Plan: Entresto may be carefully uptitrated by cardiology as long as serum creatinine remains below 2.2 and potassium < 5.2.`,
      sourceRecordId: 'REC-P001-007',
    },
    {
      id: 'NOTE-108',
      patientId: 'P001',
      encounterId: 'ENC-105',
      admissionId: 'ADM-103',
      timestamp: '2026-08-18T14:00:00Z',
      noteType: 'Admission Note',
      title: 'Inpatient Cardiology Note - Admission ADM-103',
      authorId: 'DOC-102',
      text: `ADMISSION H&P:
Patient admitted for worsening exertional dyspnea and NYHA Class III symptoms.
MISSING EVIDENCE RECORD: The attending note mentions: "Baseline transthoracic echocardiogram from June 2025 reportedly showed ejection fraction of 28% with severe apical hypokinesis." However, no formal echocardiogram report or imaging study exists in the electronic medical system for June 2025.
Plan: Uptitrate Sacubitril/Valsartan from 24/26 mg to 49/51 mg BID. Add Empagliflozin (Jardiance) 10 mg daily for SGLT2 inhibitor GDMT guideline compliance.`,
      sourceRecordId: 'REC-P001-008',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Missing record: Mentions June 2025 echo which is absent from medical records.',
    },
    {
      id: 'NOTE-109',
      patientId: 'P001',
      encounterId: 'ENC-105',
      admissionId: 'ADM-103',
      timestamp: '2026-08-23T11:00:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-103 Optimization',
      authorId: 'DOC-102',
      text: `DISCHARGE SUMMARY:
Patient achieved euvolemic state. Discharged on optimal guideline-directed medical therapy:
1. Sacubitril/Valsartan 49/51 mg BID (titrated up from 24/26 mg BID).
2. Torsemide 20 mg daily.
3. Empagliflozin 10 mg daily (newly initiated).
4. Metformin 500 mg BID.
Discharge labs: Creatinine 1.6 mg/dL, Potassium 4.4 mEq/L, BNP 890 pg/mL.`,
      sourceRecordId: 'REC-P001-009',
    },

    // P002 Notes (Marcus Thorne - DVT / PE / Warfarin to Eliquis / Contradictory INR)
    {
      id: 'NOTE-201',
      patientId: 'P002',
      encounterId: 'ENC-201',
      admissionId: 'ADM-201',
      timestamp: '2025-07-10T14:30:00Z',
      noteType: 'Admission Note',
      title: 'Emergency H&P: Acute Popliteal DVT',
      authorId: 'DOC-101',
      text: `Marcus Thorne is a 54-year-old male presenting with painful swelling of the right calf and popliteal fossa following a 14-hour international flight.
Venous Doppler ultrasound confirms extensive occlusive thrombus in the right popliteal and posterior tibial veins.
Baseline labs: INR 1.0, Platelets 240k.
Started on Enoxaparin 1 mg/kg BID bridge and Warfarin 5 mg daily.`,
      sourceRecordId: 'REC-P002-001',
    },
    {
      id: 'NOTE-202',
      patientId: 'P002',
      encounterId: 'ENC-201',
      admissionId: 'ADM-201',
      timestamp: '2025-07-12T10:00:00Z',
      noteType: 'Progress Note',
      title: 'Inpatient Medicine Progress Note',
      authorId: 'DOC-101',
      text: `Patient ambulatory with compression stockings. Warfarin dose maintained at 5 mg daily. INR today is 1.4. Continuing Lovenox bridging.`,
      sourceRecordId: 'REC-P002-002',
    },
    {
      id: 'NOTE-203',
      patientId: 'P002',
      encounterId: 'ENC-201',
      admissionId: 'ADM-201',
      timestamp: '2025-07-15T10:30:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-201 DVT Initiation',
      authorId: 'DOC-101',
      text: `Patient discharged with INR 2.1. Lovenox discontinued. Instructions provided for weekly INR monitoring at Anticoagulation Clinic. Maintain Warfarin 5 mg daily.`,
      sourceRecordId: 'REC-P002-003',
    },
    {
      id: 'NOTE-204',
      patientId: 'P002',
      encounterId: 'ENC-202',
      timestamp: '2025-08-22T11:00:00Z',
      noteType: 'Consultation Note',
      title: 'Anticoagulation Clinic Note: Subtherapeutic INR',
      authorId: 'DOC-101',
      text: `INR check today reveals subtherapeutic result: 1.4. Patient reports missing two doses last week due to work travel and increased dietary vitamin K (green salads).
Warfarin dose adjusted to 7.5 mg on Mondays/Thursdays, 5 mg other days. Recheck INR in 10 days.`,
      sourceRecordId: 'REC-P002-004',
    },
    {
      id: 'NOTE-205',
      patientId: 'P002',
      encounterId: 'ENC-203',
      admissionId: 'ADM-202',
      timestamp: '2026-01-14T11:00:00Z',
      noteType: 'Admission Note',
      title: 'H&P: Bilateral Pulmonary Embolism & Warfarin Failure',
      authorId: 'DOC-101',
      text: `CLINICAL EVALUATION:
Patient presents with sudden-onset sharp right-sided pleuritic chest pain and shortness of breath.
CT Pulmonary Angiogram shows bilateral subsegmental pulmonary emboli.
CONTRADICTION IN RECORD:
Attending Physician Dr. House writes: "Patient has suffered recurrent venous thromboembolism while supposedly on anticoagulation. Laboratory testing shows INR is critically subtherapeutic at 1.5, demonstrating failure and unreliability of Warfarin therapy."
(NOTE: Electronic Laboratory result LAB-205 from the exact same morning shows INR 2.8!).
PLAN:
Permanently discontinue Warfarin. Switch to Direct Oral Anticoagulant: Apixaban (Eliquis) 10 mg BID x 7 days followed by 5 mg BID maintenance. Metformin held temporarily due to iodinated CT contrast exposure.`,
      sourceRecordId: 'REC-P002-005',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Severe contradiction: Physician writes INR is 1.5, but official lab LAB-205 reports INR 2.8.',
    },
    {
      id: 'NOTE-206',
      patientId: 'P002',
      encounterId: 'ENC-203',
      admissionId: 'ADM-202',
      timestamp: '2026-01-18T14:00:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-202 Switch to Apixaban',
      authorId: 'DOC-101',
      text: `Patient chest pain fully resolved. Oxygen saturation 98% room air.
Discharged on Apixaban 5 mg BID (following 7-day loading phase).
Warfarin discontinued. Metformin resumed at 1000 mg BID as creatinine normalized to 1.1 mg/dL.`,
      sourceRecordId: 'REC-P002-006',
    },
    {
      id: 'NOTE-207',
      patientId: 'P002',
      encounterId: 'ENC-204',
      timestamp: '2026-03-30T15:30:00Z',
      noteType: 'Progress Note',
      title: 'Outpatient Follow-Up: Apixaban Tolerance',
      authorId: 'DOC-101',
      text: `Patient reports excellent compliance with Apixaban 5 mg BID. No recurrent leg swelling or dyspnea. No bruising or bleeding noted. HbA1c 7.8%.`,
      sourceRecordId: 'REC-P002-007',
    },
    {
      id: 'NOTE-208',
      patientId: 'P002',
      encounterId: 'ENC-205',
      admissionId: 'ADM-203',
      timestamp: '2026-09-02T09:00:00Z',
      noteType: 'Admission Note',
      title: 'H&P: Lower GI Bleed on Apixaban',
      authorId: 'DOC-101',
      text: `Patient woke with lightheadedness and passed two large maroon stools with clots (hematochezia).
Admission Hemoglobin: 8.4 g/dL (down from baseline 14.2 g/dL).
Apixaban immediately held. Transfused 1 unit packed red blood cells. Urgent gastroenterology consult requested.`,
      sourceRecordId: 'REC-P002-008',
    },
    {
      id: 'NOTE-209',
      patientId: 'P002',
      encounterId: 'ENC-205',
      admissionId: 'ADM-203',
      timestamp: '2026-09-06T12:00:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-203 Bleed Resolution',
      authorId: 'DOC-101',
      text: `Colonoscopy revealed diverticular hemorrhage in sigmoid colon, successfully treated with endoscopic hemoclips. Hemoglobin stable at 10.1 g/dL without further transfusion.
Given unprovoked PE history 8 months ago, anticoagulation cannot be completely stopped. Multi-disciplinary team consensus decided to resume Apixaban at a reduced dose of 2.5 mg BID with close monitoring.`,
      sourceRecordId: 'REC-P002-009',
      metaAnnotation: 'Explains dose reduction of Apixaban from 5mg BID to 2.5mg BID.',
    },

    // P003 Notes (Sarah Chen - Multiple Sclerosis / Urosepsis / Held Ocrelizumab / Fever Contradiction)
    {
      id: 'NOTE-301',
      patientId: 'P003',
      encounterId: 'ENC-301',
      timestamp: '2025-05-10T11:30:00Z',
      noteType: 'Consultation Note',
      title: 'Neuroimmunology Semi-Annual MS Review',
      authorId: 'DOC-104',
      text: `Sarah Chen is a 42-year-old female with RRMS diagnosed in 2019. EDSS score is stable at 2.5.
Currently receiving Ocrelizumab 600 mg IV every 6 months, next infusion scheduled for late October 2025.
Taking Baclofen 10 mg TID for spasticity. Uses intermittent self-catheterization for neurogenic bladder.`,
      sourceRecordId: 'REC-P003-001',
    },
    {
      id: 'NOTE-302',
      patientId: 'P003',
      encounterId: 'ENC-302',
      admissionId: 'ADM-301',
      timestamp: '2025-10-14T19:00:00Z',
      noteType: 'Admission Note',
      title: 'Inpatient Medicine H&P: Severe Sepsis Secondary to UTI',
      authorId: 'DOC-103',
      text: `Patient brought to ED with shivering rigors, severe flank pain, confusion, and hypotension (BP 82/50 mmHg).
CONTRADICTION IN VITALS & RECORD:
Triage nurse record lists emergency entrance temperature as 39.4°C (102.9°F) with heart rate 128 bpm.
However, attending physician Dr. Chase notes in the assessment: "Patient has remained entirely afebrile throughout presentation (max temp 37.1°C), likely blunted by immunosuppression."
Labs show WBC 16.4 x 10^9/L with 88% neutrophils, CRP 85 mg/L.
Urine analysis strongly positive for nitrites and leukocyte esterase.
Diagnosis: Urosepsis with septic shock.
ACTION: Upcoming scheduled Ocrelizumab infusion is CANCELLED AND HELD due to severe life-threatening active bacterial infection.
Initiated IV Ceftriaxone 2g daily and aggressive fluid resuscitation.`,
      sourceRecordId: 'REC-P003-002',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Contradiction: Triage temp 39.4°C vs Doctor Chase note claiming patient was afebrile at 37.1°C.',
    },
    {
      id: 'NOTE-303',
      patientId: 'P003',
      encounterId: 'ENC-302',
      admissionId: 'ADM-301',
      timestamp: '2025-10-16T10:00:00Z',
      noteType: 'Progress Note',
      title: 'Infectious Disease Progress Note - Missing Blood Culture Panel',
      authorId: 'DOC-103',
      text: `Blood cultures grew Escherichia coli.
MISSING RECORD: The attending note states: "Specific antibiotic minimum inhibitory concentration (MIC) sensitivities are attached to the chart." However, no microbiology sensitivity report is present in the electronic document repository.
Empirically responding well to Ceftriaxone. Afebrile for 24 hours.`,
      sourceRecordId: 'REC-P003-003',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Missing record: MIC sensitivity report referenced but absent.',
    },
    {
      id: 'NOTE-304',
      patientId: 'P003',
      encounterId: 'ENC-302',
      admissionId: 'ADM-301',
      timestamp: '2025-10-19T09:30:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-301 Sepsis Resolution',
      authorId: 'DOC-103',
      text: `Urosepsis resolved. WBC down to 7.2.
Discharged on oral Ciprofloxacin 500 mg BID x 7 days.
IMPORTANT: Ocrelizumab infusion remains on hold. Patient advised not to receive anti-CD20 immunosuppression until cleared by neurology and infectious disease in at least 6 weeks.`,
      sourceRecordId: 'REC-P003-004',
    },
    {
      id: 'NOTE-305',
      patientId: 'P003',
      encounterId: 'ENC-304',
      admissionId: 'ADM-302',
      timestamp: '2026-04-02T16:00:00Z',
      noteType: 'Admission Note',
      title: 'Neurology H&P: Acute MS Relapse',
      authorId: 'DOC-105',
      text: `Patient admitted with 3-day history of worsening lower extremity weakness, numbness from T10 dermatome down, and inability to ambulate without assistance.
Infection workup is negative: WBC normal (8.1), CRP normal (4.2), urinalysis negative.
Brain and spine MRI demonstrates an active new gadolinium-enhancing demyelinating plaque in the thoracic spinal cord (T8).
Impression: True acute MS relapse in setting of delayed disease-modifying therapy.
Plan: IV Methylprednisolone (Solu-Medrol) 1000 mg daily x 3 days followed by oral prednisone taper.`,
      sourceRecordId: 'REC-P003-005',
    },
    {
      id: 'NOTE-306',
      patientId: 'P003',
      encounterId: 'ENC-304',
      admissionId: 'ADM-302',
      timestamp: '2026-04-05T11:00:00Z',
      noteType: 'Progress Note',
      title: 'Neurology Progress Note: High-Dose Steroid Response',
      authorId: 'DOC-105',
      text: `Completed 3-day course of IV Solu-Medrol 1g daily. Strength in left lower extremity significantly improved from 2/5 to 4/5. Ambulation restored with walker. Plan discharge on oral taper.`,
      sourceRecordId: 'REC-P003-006',
    },
    {
      id: 'NOTE-307',
      patientId: 'P003',
      encounterId: 'ENC-304',
      admissionId: 'ADM-302',
      timestamp: '2026-04-07T11:00:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-302 MS Flare',
      authorId: 'DOC-105',
      text: `Acute relapse treated successfully. Ocrelizumab therapy cleared to resume in 4 weeks given absence of active infection and urgent need to prevent further neurological accrual.`,
      sourceRecordId: 'REC-P003-007',
    },

    // P004 Notes (James Rodriguez - COPD / Amiodarone Thyrotoxicosis / Missing ADM-401 Discharge Summary)
    {
      id: 'NOTE-401',
      patientId: 'P004',
      encounterId: 'ENC-401',
      admissionId: 'ADM-401',
      timestamp: '2025-06-20T08:00:00Z',
      noteType: 'Admission Note',
      title: 'H&P: Acute COPD Exacerbation & New Atrial Fibrillation',
      authorId: 'DOC-102',
      text: `71-year-old male with severe COPD on Spiriva who presents with severe wheezing and productive cough.
CONTRADICTION IN SOCIAL HISTORY:
Intake record states: "Patient has an active 45 pack-year smoking history, currently smoking 0.5 packs per day."
ECG demonstrates rapid atrial fibrillation with heart rate 145 bpm.
Baseline TSH is normal at 2.4 uIU/mL.
Started on IV Solu-Medrol, Duonebs, and oral Amiodarone 200 mg daily for rate and rhythm control.`,
      sourceRecordId: 'REC-P004-001',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Documents active smoking history (contradicts later note NOTE-405). Baseline normal TSH.',
    },
    {
      id: 'NOTE-402',
      patientId: 'P004',
      encounterId: 'ENC-401',
      admissionId: 'ADM-401',
      timestamp: '2025-06-23T10:00:00Z',
      noteType: 'Progress Note',
      title: 'Cardiology Progress Note: Amiodarone Rhythm Control',
      authorId: 'DOC-102',
      text: `Patient converted to sinus rhythm with rate 78 bpm on Amiodarone 200 mg daily. Wheezing markedly improved.
MISSING SUMMARY: Note mentions patient will be discharged on June 25, 2025; however NO DISCHARGE SUMMARY was ever filed for this admission (ADM-401).`,
      sourceRecordId: 'REC-P004-002',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Missing document: ADM-401 has no filed discharge summary.',
    },
    {
      id: 'NOTE-403',
      patientId: 'P004',
      encounterId: 'ENC-402',
      timestamp: '2025-11-12T11:00:00Z',
      noteType: 'Consultation Note',
      title: 'Pulmonology Outpatient Visit: Inhaler Step-Up',
      authorId: 'DOC-101',
      text: `Spirometry demonstrates persistent severe obstruction (FEV1 44% predicted). Given two exacerbations in the past 12 months, Spiriva monotherapy is insufficient.
Discontinuing Spiriva. Starting triple therapy with Trelegy Ellipta (Fluticasone furoate/Umeclidinium/Vilanterol) 100/62.5/25 mcg once daily. Continue Amiodarone as prescribed by cardiology.`,
      sourceRecordId: 'REC-P004-003',
      metaAnnotation: 'Explains medication change from Spiriva to Trelegy Ellipta.',
    },
    {
      id: 'NOTE-404',
      patientId: 'P004',
      encounterId: 'ENC-403',
      admissionId: 'ADM-402',
      timestamp: '2026-03-10T10:00:00Z',
      noteType: 'Admission Note',
      title: 'Emergency H&P: Severe Thyrotoxicosis / Thyroid Storm',
      authorId: 'DOC-108',
      text: `Patient admitted with severe heat intolerance, fine bilateral hand tremor, 15 lb unintentional weight loss, and palpitations with recurrent rapid atrial fibrillation (HR 138 bpm).
Endocrine labs:
- TSH: < 0.01 uIU/mL (severely suppressed, down from baseline 2.4)
- Free T4: 3.8 ng/dL (markedly elevated)
Diagnosis: Amiodarone-Induced Thyrotoxicosis (AIT), likely Type 2 destructive thyroiditis from chronic iodine load of Amiodarone therapy.`,
      sourceRecordId: 'REC-P004-004',
    },
    {
      id: 'NOTE-405',
      patientId: 'P004',
      encounterId: 'ENC-403',
      admissionId: 'ADM-402',
      timestamp: '2026-03-12T14:00:00Z',
      noteType: 'Progress Note',
      title: 'Endocrinology & Cardiology Progress Note: Medication Reversal',
      authorId: 'DOC-108',
      text: `CONTRADICTION IN SOCIAL HISTORY:
Chart note states: "Patient is a lifelong non-smoker for over 20 years." (Directly contradicts NOTE-401 documenting active smoking).
MEDICATION CHANGES:
1. Amiodarone is STOPPED IMMEDIATELY. It is contraindicated in active destructive thyroiditis.
2. Initiated Metoprolol Succinate 50 mg daily for rate control.
3. Started oral Prednisone 40 mg daily for treatment of Type 2 AIT.`,
      sourceRecordId: 'REC-P004-005',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Contradiction in smoking history. Documents Amiodarone discontinuation and switch to Metoprolol.',
    },
    {
      id: 'NOTE-406',
      patientId: 'P004',
      encounterId: 'ENC-403',
      admissionId: 'ADM-402',
      timestamp: '2026-03-15T14:30:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-402 Thyrotoxicosis',
      authorId: 'DOC-108',
      text: `Tremor improved, resting heart rate controlled at 76 bpm on Metoprolol 50 mg daily.
Amiodarone is permanently added to patient's allergy/intolerance list.
Continue Prednisone taper over 6 weeks. Trelegy Ellipta continued for COPD.`,
      sourceRecordId: 'REC-P004-006',
    },
    {
      id: 'NOTE-407',
      patientId: 'P004',
      encounterId: 'ENC-404',
      timestamp: '2026-07-22T15:00:00Z',
      noteType: 'Consultation Note',
      title: 'Endocrinology Follow-Up: Thyrotoxicosis Resolution',
      authorId: 'DOC-108',
      text: `TSH has normalized to 0.85 uIU/mL. Free T4 is 1.1 ng/dL. Patient is off steroids. Metoprolol maintains rate control in sinus rhythm.`,
      sourceRecordId: 'REC-P004-007',
    },

    // P005 Notes (Beatrice Kim - Hip Fracture / Delirium / Opioid Change / Benadryl Toxicity)
    {
      id: 'NOTE-501',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      timestamp: '2025-08-01T13:30:00Z',
      noteType: 'Admission Note',
      title: 'Orthopedic Trauma H&P: Right Femoral Neck Fracture',
      authorId: 'DOC-107',
      text: `80-year-old female tripped over a rug sustaining right hip pain and inability to bear weight.
Radiographs show subcapital displaced right femoral neck fracture.
Scheduled for urgent right cemented hemiarthroplasty. Scheduled Acetaminophen 650 mg q6h. Oxycodone 5-10 mg q4h PRN prescribed for post-op severe breakthrough pain.`,
      sourceRecordId: 'REC-P005-001',
    },
    {
      id: 'NOTE-502',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      timestamp: '2025-08-02T16:00:00Z',
      noteType: 'Progress Note',
      title: 'Operative & Post-Op Day 1 Note',
      authorId: 'DOC-107',
      text: `Right hemiarthroplasty completed without surgical complications. Hemoglobin 9.1 g/dL. Pain controlled with Oxycodone 10 mg every 4 hours.`,
      sourceRecordId: 'REC-P005-002',
    },
    {
      id: 'NOTE-503',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      timestamp: '2025-08-03T21:00:00Z',
      noteType: 'Nursing Note',
      title: 'Nursing Shift Note: Acute Delirium & Agitation',
      authorId: 'DOC-101',
      text: `CONTRADICTORY RECORD:
Nurse reports: "Patient acutely confused, thrashing in bed, attempting to climb out of bed, pulling at Foley catheter and IV line. Screaming that spiders and insects are crawling across the ceiling. Visual hallucinations present. CAM-ICU positive for delirium."`,
      sourceRecordId: 'REC-P005-003',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Contradiction: Nursing documents acute hallucinations and severe delirium.',
    },
    {
      id: 'NOTE-504',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      timestamp: '2025-08-03T21:45:00Z',
      noteType: 'Progress Note',
      title: 'Surgical Resident / Physician Cross-Cover Note',
      authorId: 'DOC-107',
      text: `CONTRADICTORY RECORD:
Physician writes 45 minutes later: "Patient is resting quietly in bed, alert and oriented x 3, pleasant and cooperative, answering all questions appropriately with zero evidence of agitation or confusion."
(NOTE: Striking clinical discrepancy with nursing report NOTE-503).`,
      sourceRecordId: 'REC-P005-004',
      isContradictoryOrMissing: true,
      metaAnnotation: 'Severe contradiction: Physician claims patient is alert x3 with zero confusion 45m after nursing reports hallucinations.',
    },
    {
      id: 'NOTE-505',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      timestamp: '2025-08-04T09:00:00Z',
      noteType: 'Consultation Note',
      title: 'Geriatric Medicine Consultation: Delirium & Analgesic Adjustment',
      authorId: 'DOC-101',
      text: `Geriatrics consulted for post-operative delirium.
Assessment: Opioid-induced delirium / hallucinations likely exacerbated by full mu-opioid agonist Oxycodone in an elderly patient with borderline cognitive reserve.
MEDICATION CHANGE:
1. Oxycodone is completely DISCONTINUED.
2. Switched to low-dose Tramadol 25 mg q6h PRN only for severe breakthrough pain.
3. Maximize scheduled Acetaminophen 650 mg q6h. Implement delirium precautions, daytime sunlight exposure, family presence.`,
      sourceRecordId: 'REC-P005-005',
      metaAnnotation: 'Explains discontinuation of Oxycodone and switch to low-dose Tramadol.',
    },
    {
      id: 'NOTE-506',
      patientId: 'P005',
      encounterId: 'ENC-501',
      admissionId: 'ADM-501',
      timestamp: '2025-08-07T14:00:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-501 Hip Repair & Rehab Transfer',
      authorId: 'DOC-107',
      text: `Delirium cleared completely following Oxycodone discontinuation. Mentation at baseline.
Transferred to Subacute Rehabilitation facility for physical therapy.`,
      sourceRecordId: 'REC-P005-006',
    },
    {
      id: 'NOTE-507',
      patientId: 'P005',
      encounterId: 'ENC-503',
      admissionId: 'ADM-502',
      timestamp: '2026-05-15T12:00:00Z',
      noteType: 'Admission Note',
      title: 'H&P: Acute Anticholinergic Toxicity & Urinary Retention',
      authorId: 'DOC-101',
      text: `Patient brought to emergency department by daughter for acute confusion, speech stumbling, dilated pupils, dry flushed skin, and lower abdominal distension.
Bladder scan reveals 850 mL acute urinary retention. Foley catheter placed with immediate relief.
Medication reconciliation reveals patient was self-administering over-the-counter Diphenhydramine (Benadryl) 50 mg every night for severe insomnia over the past 2 weeks.
Diagnosis: Anticholinergic toxidrome and urinary retention secondary to Diphenhydramine in high-risk elderly patient.`,
      sourceRecordId: 'REC-P005-007',
    },
    {
      id: 'NOTE-508',
      patientId: 'P005',
      encounterId: 'ENC-503',
      admissionId: 'ADM-502',
      timestamp: '2026-05-16T10:00:00Z',
      noteType: 'Progress Note',
      title: 'Medicine Progress Note: Anticholinergic Washout',
      authorId: 'DOC-101',
      text: `Benadryl discontinued immediately. Cognitive symptoms and confusion resolving rapidly as anticholinergic clears. Foley removed, voiding spontaneously. Initiated Melatonin 3 mg at bedtime for non-anticholinergic insomnia management.`,
      sourceRecordId: 'REC-P005-008',
    },
    {
      id: 'NOTE-509',
      patientId: 'P005',
      encounterId: 'ENC-503',
      admissionId: 'ADM-502',
      timestamp: '2026-05-20T10:30:00Z',
      noteType: 'Discharge Summary',
      title: 'Discharge Summary - ADM-502 Benadryl Discontinuation',
      authorId: 'DOC-101',
      text: `Patient discharged home in stable condition. Daughter educated on Beers Criteria medications and dangerous anticholinergics (Benadryl, dimenhydrinate) to strictly avoid in elderly patients.`,
      sourceRecordId: 'REC-P005-009',
    },
  ];

  return {
    patients,
    doctors,
    conditions,
    admissions,
    encounters,
    prescriptions,
    labTests,
    labResults,
    clinicalNotes,
  };
}

export function writeDatasetToDisk(outputDir: string) {
  const data = generateSyntheticDataset();
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, 'patients.json'), JSON.stringify(data.patients, null, 2));
  fs.writeFileSync(path.join(outputDir, 'doctors.json'), JSON.stringify(data.doctors, null, 2));
  fs.writeFileSync(path.join(outputDir, 'conditions.json'), JSON.stringify(data.conditions, null, 2));
  fs.writeFileSync(path.join(outputDir, 'admissions.json'), JSON.stringify(data.admissions, null, 2));
  fs.writeFileSync(path.join(outputDir, 'encounters.json'), JSON.stringify(data.encounters, null, 2));
  fs.writeFileSync(path.join(outputDir, 'prescriptions.json'), JSON.stringify(data.prescriptions, null, 2));
  fs.writeFileSync(path.join(outputDir, 'lab_tests.json'), JSON.stringify(data.labTests, null, 2));
  fs.writeFileSync(path.join(outputDir, 'lab_results.json'), JSON.stringify(data.labResults, null, 2));
  fs.writeFileSync(path.join(outputDir, 'clinical_notes.json'), JSON.stringify(data.clinicalNotes, null, 2));

  // Also write patient-keyed composite records for instant indexing
  const compositeByPatient: Record<string, any> = {};
  for (const patient of data.patients) {
    compositeByPatient[patient.id] = {
      patient,
      conditions: data.conditions.filter((c) => c.patientId === patient.id),
      admissions: data.admissions.filter((a) => a.patientId === patient.id),
      encounters: data.encounters.filter((e) => e.patientId === patient.id),
      prescriptions: data.prescriptions.filter((p) => p.patientId === patient.id),
      labResults: data.labResults.filter((l) => l.patientId === patient.id),
      clinicalNotes: data.clinicalNotes.filter((n) => n.patientId === patient.id),
    };

    // Also write individual patient file
    fs.writeFileSync(
      path.join(outputDir, `${patient.id}.json`),
      JSON.stringify(compositeByPatient[patient.id], null, 2)
    );
  }

  fs.writeFileSync(
    path.join(outputDir, 'patient_records.json'),
    JSON.stringify(compositeByPatient, null, 2)
  );

  console.log(`[MedGraph Synthetic Data] Successfully generated and wrote synthetic dataset to ${outputDir}`);
  return data;
}

// If executed directly
if (process.argv[1]?.endsWith('synthetic-data-generator.ts') || process.argv[1]?.endsWith('synthetic-data-generator.js')) {
  const targetDir = path.resolve(process.cwd(), '../data/synthetic-patients');
  writeDatasetToDisk(targetDir);
}
