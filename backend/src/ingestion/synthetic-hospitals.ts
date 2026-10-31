import { Hospital } from '../schemas/types.js';

export const DEMO_HOSPITALS: Hospital[] = [
  {
    id: 'HOSP001',
    name: 'Apollo General Hospital',
    code: 'AGH',
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'Tertiary Care & Cardiovascular Center',
    connectedStatus: 'CONNECTED',
    activeRecordsCount: 28,
    contactEmail: 'interop@apollo-general.med',
  },
  {
    id: 'HOSP002',
    name: 'Bengaluru City Medical Center',
    code: 'BCMC',
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'Super Specialty & Acute Trauma Hospital',
    connectedStatus: 'CONNECTED',
    activeRecordsCount: 16,
    contactEmail: 'ehr-gateway@bengaluru-medical.org',
  },
];

export function getHospitalById(hospitalId: string): Hospital | undefined {
  return DEMO_HOSPITALS.find((h) => h.id === hospitalId);
}

export function getAllHospitals(): Hospital[] {
  return [...DEMO_HOSPITALS];
}
