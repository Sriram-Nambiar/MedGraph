import { ConsentRequest, ConsentGrant } from '../schemas/types.js';
import { auditService } from './audit-service.js';
import { getHospitalById } from '../ingestion/synthetic-hospitals.js';

export class ConsentService {
  private requests: Map<string, ConsentRequest> = new Map();
  private grants: Map<string, ConsentGrant> = new Map();

  constructor() {
    this.seedDemoConsents();
  }

  private seedDemoConsents(): void {
    // Demo 1: P002 Marcus Thorne has an existing active consent grant from Apollo General Hospital to BCMC
    const p2ReqId = 'REQ-P002-INIT';
    const p2GrantId = 'GRANT-P002-ACTIVE';
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    this.requests.set(p2ReqId, {
      request_id: p2ReqId,
      patient_id: 'P002',
      patient_name: 'Marcus Thorne',
      requesting_hospital_id: 'HOSP002',
      requesting_hospital_name: 'Bengaluru City Medical Center',
      source_hospital_id: 'HOSP001',
      source_hospital_name: 'Apollo General Hospital',
      purpose: 'Emergency GI bleeding stabilization and longitudinal anticoagulation timeline review',
      requested_categories: ['admissions', 'medications', 'lab_results', 'clinical_notes'],
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'APPROVED',
    });

    this.grants.set(p2GrantId, {
      grant_id: p2GrantId,
      request_id: p2ReqId,
      patient_id: 'P002',
      requesting_hospital_id: 'HOSP002',
      source_hospital_id: 'HOSP001',
      permitted_categories: ['admissions', 'medications', 'lab_results', 'clinical_notes'],
      granted_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      expires_at: expires.toISOString(),
      status: 'ACTIVE',
    });

    // Demo 2: P001 Eleanor Vance starts with a pending consent request so the user can demonstrate live approval!
    const p1ReqId = 'REQ-P001-PENDING';
    this.requests.set(p1ReqId, {
      request_id: p1ReqId,
      patient_id: 'P001',
      patient_name: 'Eleanor Vance',
      requesting_hospital_id: 'HOSP002',
      requesting_hospital_name: 'Bengaluru City Medical Center',
      source_hospital_id: 'HOSP001',
      source_hospital_name: 'Apollo General Hospital',
      purpose: 'Longitudinal outpatient cardiovascular management and hyperkalemia history investigation',
      requested_categories: ['admissions', 'medications', 'lab_results', 'clinical_notes'],
      created_at: new Date().toISOString(),
      status: 'PENDING',
    });
  }

  public createRequest(params: {
    patient_id: string;
    patient_name: string;
    requesting_hospital_id: string;
    source_hospital_id: string;
    purpose?: string;
    requested_categories?: string[];
  }): ConsentRequest {
    const reqHospital = getHospitalById(params.requesting_hospital_id);
    const srcHospital = getHospitalById(params.source_hospital_id);

    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const request: ConsentRequest = {
      request_id: requestId,
      patient_id: params.patient_id,
      patient_name: params.patient_name,
      requesting_hospital_id: params.requesting_hospital_id,
      requesting_hospital_name: reqHospital?.name || params.requesting_hospital_id,
      source_hospital_id: params.source_hospital_id,
      source_hospital_name: srcHospital?.name || params.source_hospital_id,
      purpose: params.purpose || 'Clinical care continuity and cross-hospital medical history review',
      requested_categories: params.requested_categories || ['admissions', 'medications', 'lab_results', 'clinical_notes'],
      created_at: new Date().toISOString(),
      status: 'PENDING',
    };

    this.requests.set(requestId, request);

    auditService.log({
      actor_id: params.requesting_hospital_id,
      actor_name: request.requesting_hospital_name,
      actor_hospital_id: params.requesting_hospital_id,
      action: 'CONSENT_REQUEST_CREATED',
      patient_id: params.patient_id,
      source_hospital_id: params.source_hospital_id,
      details: `Created consent request ${requestId} for patient ${params.patient_name} (${params.patient_id})`,
      status: 'SUCCESS',
    });

    return request;
  }

  public approveRequest(requestId: string, durationDays: number = 7): ConsentGrant {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Consent request ${requestId} not found`);
    }

    request.status = 'APPROVED';

    const now = new Date();
    const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const grantId = `GRANT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const grant: ConsentGrant = {
      grant_id: grantId,
      request_id: requestId,
      patient_id: request.patient_id,
      requesting_hospital_id: request.requesting_hospital_id,
      source_hospital_id: request.source_hospital_id,
      permitted_categories: request.requested_categories,
      granted_at: now.toISOString(),
      expires_at: expires.toISOString(),
      status: 'ACTIVE',
    };

    this.grants.set(grantId, grant);

    auditService.log({
      actor_id: request.patient_id,
      actor_name: request.patient_name,
      actor_hospital_id: request.requesting_hospital_id,
      action: 'CONSENT_APPROVED',
      patient_id: request.patient_id,
      source_hospital_id: request.source_hospital_id,
      details: `Patient approved consent grant ${grantId} for ${request.requesting_hospital_name} to access ${request.source_hospital_name} records`,
      status: 'SUCCESS',
    });

    return grant;
  }

  public rejectRequest(requestId: string, reason?: string): ConsentRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Consent request ${requestId} not found`);
    }

    request.status = 'REJECTED';

    auditService.log({
      actor_id: request.patient_id,
      actor_name: request.patient_name,
      actor_hospital_id: request.requesting_hospital_id,
      action: 'CONSENT_REJECTED',
      patient_id: request.patient_id,
      source_hospital_id: request.source_hospital_id,
      details: `Patient rejected consent request ${requestId}. Reason: ${reason || 'Patient declined'}`,
      status: 'SUCCESS',
    });

    return request;
  }

  public revokeGrant(grantId: string, actorId?: string): ConsentGrant {
    const grant = this.grants.get(grantId);
    if (!grant) {
      throw new Error(`Consent grant ${grantId} not found`);
    }

    grant.status = 'REVOKED';

    auditService.log({
      actor_id: actorId || grant.patient_id,
      actor_name: 'Patient/Authorizing Clinician',
      actor_hospital_id: grant.requesting_hospital_id,
      action: 'CONSENT_REVOKED',
      patient_id: grant.patient_id,
      source_hospital_id: grant.source_hospital_id,
      details: `Consent grant ${grantId} was explicitly revoked. Immediate termination of cross-hospital record access.`,
      status: 'SUCCESS',
    });

    return grant;
  }

  public isAuthorized(patientId: string, requestingHospitalId: string, sourceHospitalId: string): boolean {
    // Local records at the requesting hospital are always accessible
    if (requestingHospitalId === sourceHospitalId) {
      return true;
    }

    const grant = this.getActiveGrant(patientId, requestingHospitalId, sourceHospitalId);
    return !!grant;
  }

  public getActiveGrant(
    patientId: string,
    requestingHospitalId: string,
    sourceHospitalId: string
  ): ConsentGrant | undefined {
    const now = Date.now();
    for (const grant of this.grants.values()) {
      if (
        grant.patient_id === patientId &&
        grant.requesting_hospital_id === requestingHospitalId &&
        grant.source_hospital_id === sourceHospitalId
      ) {
        if (grant.status === 'ACTIVE') {
          if (new Date(grant.expires_at).getTime() < now) {
            grant.status = 'EXPIRED';
            return undefined;
          }
          return grant;
        }
      }
    }
    return undefined;
  }

  public getRequests(filter?: { patient_id?: string; requesting_hospital_id?: string; status?: string }): ConsentRequest[] {
    let list = Array.from(this.requests.values());
    if (filter?.patient_id) {
      list = list.filter((r) => r.patient_id === filter.patient_id);
    }
    if (filter?.requesting_hospital_id) {
      list = list.filter((r) => r.requesting_hospital_id === filter.requesting_hospital_id);
    }
    if (filter?.status) {
      list = list.filter((r) => r.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getGrants(filter?: { patient_id?: string; requesting_hospital_id?: string; status?: string }): ConsentGrant[] {
    let list = Array.from(this.grants.values());
    if (filter?.patient_id) {
      list = list.filter((g) => g.patient_id === filter.patient_id);
    }
    if (filter?.requesting_hospital_id) {
      list = list.filter((g) => g.requesting_hospital_id === filter.requesting_hospital_id);
    }
    if (filter?.status) {
      list = list.filter((g) => g.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime());
  }

  public clear(): void {
    this.requests.clear();
    this.grants.clear();
  }
}

export const consentService = new ConsentService();
