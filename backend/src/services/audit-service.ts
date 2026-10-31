import { AuditLog } from '../schemas/types.js';

export class AuditService {
  private logs: AuditLog[] = [];

  constructor() {
    // Seed initial demo audit entries
    this.log({
      actor_id: 'DOC-110-BCMC',
      actor_name: 'Dr. Ananya Sen',
      actor_hospital_id: 'HOSP002',
      action: 'RECORDS_ACCESSED',
      patient_id: 'P001',
      source_hospital_id: 'HOSP002',
      details: 'Accessed local BCMC outpatient encounter records for Eleanor Vance',
      status: 'SUCCESS',
    });
  }

  public log(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.unshift(newLog); // Prepend so newest is first
    return newLog;
  }

  public getLogs(filter?: {
    patient_id?: string;
    actor_hospital_id?: string;
    action?: string;
    limit?: number;
  }): AuditLog[] {
    let result = [...this.logs];
    if (filter?.patient_id) {
      result = result.filter((l) => l.patient_id === filter.patient_id);
    }
    if (filter?.actor_hospital_id) {
      result = result.filter((l) => l.actor_hospital_id === filter.actor_hospital_id);
    }
    if (filter?.action) {
      result = result.filter((l) => l.action === filter.action);
    }
    return result.slice(0, filter?.limit || 50);
  }

  public clear(): void {
    this.logs = [];
  }
}

export const auditService = new AuditService();
