import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  RotateCcw,
  Send,
  Lock,
  Unlock,
  Share2,
  RefreshCw,
  ExternalLink,
  FileText,
  Activity,
  Calendar,
  Pill,
  Stethoscope,
  Info,
  X,
} from 'lucide-react';
import {
  Patient,
  Hospital,
  ConsentRequest,
  ConsentGrant,
  CrossHospitalPatientHistory,
  CrossHospitalRecord,
  AuditLog,
} from '../../types';
import {
  fetchHospitals,
  fetchConsentRequests,
  createConsentRequest,
  approveConsent,
  rejectConsent,
  revokeConsent,
  fetchConsentGrants,
  fetchCrossHospitalHistory,
  fetchFHIRBundle,
  fetchAuditLogs,
} from '../../services/api';

interface HospitalNetworkViewProps {
  selectedPatient: Patient | null;
  theme?: 'clinical' | 'dark';
}

interface NormalizedRecord {
  record_id: string;
  patient_id: string;
  hospital_id: string;
  hospital_name: string;
  category: string;
  timestamp: string;
  created_at: string;
  summary: string;
  title: string;
  is_external: boolean;
  raw: any;
}

export const HospitalNetworkView: React.FC<HospitalNetworkViewProps> = ({
  selectedPatient,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeHospitalId, setActiveHospitalId] = useState<string>('HOSP002'); // Default: Bengaluru City Medical Center
  const [history, setHistory] = useState<CrossHospitalPatientHistory | null>(null);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [consentGrants, setConsentGrants] = useState<ConsentGrant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals & Inspection
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [requestPurpose, setRequestPurpose] = useState<string>('Longitudinal clinical assessment and cross-hospital cardiology review');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'admissions',
    'medications',
    'lab_results',
    'clinical_notes',
  ]);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<NormalizedRecord | null>(null);
  const [fhirModalHospital, setFhirModalHospital] = useState<{ hospitalId: string; bundle: any } | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  const loadData = async () => {
    if (!selectedPatient) return;
    try {
      setLoading(true);
      const [hospList, reqList, grantList, hist, logs] = await Promise.all([
        fetchHospitals(),
        fetchConsentRequests({ patient_id: selectedPatient.id }),
        fetchConsentGrants({ patient_id: selectedPatient.id }),
        fetchCrossHospitalHistory(selectedPatient.id, activeHospitalId),
        fetchAuditLogs({ patient_id: selectedPatient.id, limit: 15 }),
      ]);
      setHospitals(hospList);
      setConsentRequests(reqList);
      setConsentGrants(grantList);
      setHistory(hist);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Failed to load interoperability data:', err);
      setStatusMessage({ type: 'error', text: `Failed to load interop data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPatient?.id, activeHospitalId]);

  const handleCreateRequest = async () => {
    if (!selectedPatient) return;
    try {
      setActionLoading(true);
      const sourceHospitalId = activeHospitalId === 'HOSP002' ? 'HOSP001' : 'HOSP002';
      await createConsentRequest({
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.name,
        requesting_hospital_id: activeHospitalId,
        source_hospital_id: sourceHospitalId,
        purpose: requestPurpose,
        requested_categories: selectedCategories,
      });
      setShowRequestModal(false);
      setStatusMessage({
        type: 'success',
        text: `Consent request submitted to ${sourceHospitalId === 'HOSP001' ? 'Apollo General Hospital' : 'Bengaluru City Medical Center'}. Awaiting patient approval.`,
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(true);
      await approveConsent(requestId, 7);
      setStatusMessage({
        type: 'success',
        text: 'Simulated patient approval granted. External records are now unlocked and indexed in MedGraph.',
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setActionLoading(true);
      await rejectConsent(requestId, 'Patient declined authorization');
      setStatusMessage({
        type: 'info',
        text: 'Consent request REJECTED by patient. External records remain restricted.',
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (grantId: string) => {
    try {
      setActionLoading(true);
      await revokeConsent(grantId, selectedPatient?.name || 'Patient');
      setStatusMessage({
        type: 'info',
        text: 'Consent grant REVOKED. Cross-hospital access immediately terminated.',
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewFHIR = async (hospId: string) => {
    if (!selectedPatient) return;
    try {
      setActionLoading(true);
      const bundle = await fetchFHIRBundle(hospId, selectedPatient.id);
      setFhirModalHospital({ hospitalId: hospId, bundle });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `FHIR export error: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  if (!selectedPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-[#829590]">
        Please select a patient from the top bar to inspect cross-hospital records.
      </div>
    );
  }

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[1] || {
    id: 'HOSP002',
    name: 'Bengaluru City Medical Center',
    code: 'BCMC',
  };
  const pendingRequests = (consentRequests || []).filter((r) => r && r.status === 'PENDING');
  const activeGrants = (consentGrants || []).filter((g) => g && g.status === 'ACTIVE');

  // Support both history.records and history.timeline shapes safely
  const rawRecords = (history as any)?.records || (history as any)?.timeline || [];
  const normalizedRecords: NormalizedRecord[] = rawRecords.map((r: any): NormalizedRecord => {
    const dateStr = r.created_at || r.timestamp || r.date || '2026-02-18T00:00:00Z';
    const cat = (r.record_type || r.category || 'record').toUpperCase();
    const title = r.title || r.summary?.split(':')[0] || r.record_id || 'Clinical Record';
    const summary = r.summary || r.content?.text || r.content?.notes || title;
    return {
      record_id: r.record_id || r.id,
      patient_id: r.patient_id || selectedPatient.id,
      hospital_id: r.hospital_id,
      hospital_name: r.hospital_name || (r.hospital_id === 'HOSP001' ? 'Apollo General Hospital' : 'Bengaluru City Medical Center'),
      category: cat,
      timestamp: dateStr,
      created_at: dateStr,
      summary,
      title,
      is_external: r.is_external !== undefined ? r.is_external : r.hospital_id !== activeHospitalId,
      raw: r,
    };
  });

  const filteredTimeline: NormalizedRecord[] = normalizedRecords.filter((rec: NormalizedRecord) => {
    if (activeCategoryFilter === 'ALL') return true;
    return rec.category === activeCategoryFilter.toUpperCase();
  });

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. Header Banner & Demonstration Disclaimer Notice
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-[#E6F4ED] border border-[#B5E4D3] text-[#174F55]">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#173F43] font-['Outfit']">
                  Cross-Hospital Medical Record Interoperability
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E6F4ED] text-[#174F55] border border-[#B5E4D3] font-bold">
                  FHIR R4 Protocol
                </span>
              </div>
              <p className="text-xs text-[#657C78] mt-1">
                Patient-centric consent protocol bridging Hospital A (Apollo General) and Hospital B (Bengaluru City Medical Center).
              </p>
            </div>
          </div>

          {/* Active Hospital Context Selector */}
          <div className="flex items-center gap-2.5 bg-[#FBFAF4] p-2.5 rounded-2xl border border-[#E1EAE3]">
            <Building2 className="w-4 h-4 text-[#287B80]" />
            <div className="text-xs">
              <span className="text-[#829590] block text-[10px] uppercase font-mono font-bold">
                Requesting Institution:
              </span>
              <select
                value={activeHospitalId}
                onChange={(e) => setActiveHospitalId(e.target.value)}
                className="bg-transparent font-bold text-[#173F43] cursor-pointer focus:outline-none text-xs"
              >
                <option value="HOSP002">Hospital B — Bengaluru City Medical Center (HOSP002)</option>
                <option value="HOSP001">Hospital A — Apollo General Hospital (HOSP001)</option>
              </select>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh Network Data"
              className="p-1.5 rounded-xl hover:bg-[#EEF3EE] text-[#657C78] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Clear Demonstration Data Notice */}
        <div className="p-3 rounded-2xl bg-[#F0FAF9] border border-[#BCE5E1] text-xs text-[#21666C] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#3D9698] shrink-0" />
            <span>
              <strong>Demonstration Data:</strong> Multi-Hospital Federated Clinical Exchange.
              Simulated patient consent protocol and FHIR R4 interoperability between demonstration nodes.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-[#DDF3F1] px-2 py-0.5 rounded border border-[#91D2D0]">
            Simulated Sandbox
          </span>
        </div>

        {/* Status Toast Notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center justify-between border ${
              statusMessage.type === 'success'
                ? 'bg-[#F0FBF5] text-[#1B4F3A] border-[#8BD4A9]'
                : statusMessage.type === 'error'
                ? 'bg-[#FFF3F2] text-[#702D2D] border-[#FDD9D5]'
                : 'bg-[#F0FAF9] text-[#21666C] border-[#BCE5E1]'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold hover:opacity-80 ml-4"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Participating Hospitals Cards
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals.map((hosp) => {
          const isCurrent = hosp.id === activeHospitalId;
          const involvedList = (history as any)?.hospitals_involved || (history as any)?.participating_hospitals || [];
          const participantInfo = involvedList.find((p: any) => p.id === hosp.id || p.hospital_id === hosp.id);
          const recordsCount = participantInfo?.record_count ?? participantInfo?.records_count ?? 0;
          const rawConsent = participantInfo?.access_status || participantInfo?.consent_status;
          const consentStatus = rawConsent || (isCurrent ? 'LOCAL' : 'CONSENT_REQUIRED');

          return (
            <div
              key={hosp.id}
              className={`p-5 rounded-3xl border transition-all ${
                isCurrent
                  ? 'bg-[#E6F4ED] border-[#91D5BE] shadow-xs'
                  : 'bg-[#FFFEFB] border-[#E1EAE3]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFFEFB] border border-[#CAD8D1] flex items-center justify-center font-bold text-sm text-[#173F43] shadow-2xs">
                    {hosp.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#173F43] flex items-center gap-2">
                      {hosp.name}
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D1EEE3] text-[#174F55] border border-[#91D5BE]">
                          Active Context
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#657C78]">
                      {hosp.city}, {hosp.state} • {hosp.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleViewFHIR(hosp.id)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-[#FFFEFB] hover:bg-[#EEF3EE] text-[#173F43] border border-[#CAD8D1] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#4FA58D]" />
                  <span>FHIR R4</span>
                </button>
              </div>

              {/* Consent and Access Badge */}
              <div className="mt-4 pt-3 border-t border-[#CAD8D1]/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#829590] block text-[10px] uppercase font-mono">
                    Patient Records:
                  </span>
                  <span className="font-semibold text-[#173F43]">
                    {recordsCount} items available
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[#829590] block text-[10px] uppercase font-mono">
                    Access Permission:
                  </span>
                  {isCurrent || consentStatus === 'LOCAL' ? (
                    <span className="inline-flex items-center gap-1 text-[#1B4F3A] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4EA77B]" />
                      Local (Full Access)
                    </span>
                  ) : consentStatus === 'CONSENT_GRANTED' || consentStatus === 'ACTIVE_GRANT' ? (
                    <span className="inline-flex items-center gap-1 text-[#1B4F3A] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4EA77B]" />
                      Consent Granted
                    </span>
                  ) : consentStatus === 'PENDING_REQUEST' ? (
                    <span className="inline-flex items-center gap-1 text-[#996B1F] font-semibold">
                      <Clock className="w-3.5 h-3.5 text-[#D99E32]" />
                      Approval Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#A83D3A] font-semibold">
                      <Lock className="w-3.5 h-3.5 text-[#D95C55]" />
                      Restricted (No Consent)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. Patient Consent Action Center
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#173F43] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4FA58D]" />
              Patient Consent Action Center
            </h2>
            <p className="text-xs text-[#657C78] mt-0.5">
              Review active consent grants, simulate patient approval, or submit new cross-hospital requests for{' '}
              <strong className="text-[#173F43]">{selectedPatient.name}</strong> ({selectedPatient.id}).
            </p>
          </div>

          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#173F43] hover:bg-[#24665F] text-white shadow-2xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5 text-[#91D5BE]" />
            Request External Records
          </button>
        </div>

        {/* Pending Consent Notification */}
        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.request_id}
                className="p-4 rounded-2xl bg-[#FFF9EA] border border-[#F5D47D] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#D99E32] shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#674617]">
                        Pending Access Request ({req.request_id})
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-white text-[#996B1F] border border-[#F5D47D]">
                        Awaiting Patient
                      </span>
                    </div>
                    <p className="text-xs text-[#173F43] mt-1">
                      <strong>{req.requesting_hospital_name}</strong> requests access to records held at{' '}
                      <strong>{req.source_hospital_name}</strong> for: <em>"{req.purpose}"</em>.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#829590]">
                      <span>Requested: {req.requested_categories.join(', ')}</span>
                      <span>•</span>
                      <span>{new Date(req.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => handleReject(req.request_id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFF3F2] text-[#A83D3A] border border-[#FDD9D5] hover:bg-[#FDD9D5] transition-colors"
                  >
                    Patient Rejects
                  </button>
                  <button
                    onClick={() => handleApprove(req.request_id)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#173F43] hover:bg-[#24665F] text-white shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#91D5BE]" />
                    Simulate Patient Approval
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : activeGrants.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#E1EAE3] text-xs text-[#657C78] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#829590]" />
              No pending consent requests between {activeHospital.name} and external providers.
            </span>
            <button
              onClick={() => setShowRequestModal(true)}
              className="text-xs text-[#24665F] hover:underline font-bold"
            >
              Initiate Request &rarr;
            </button>
          </div>
        ) : null}

        {/* Active Grants List */}
        {activeGrants.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#EEF3EE] space-y-2">
            <h4 className="text-xs font-bold text-[#173F43] uppercase tracking-wider font-mono">
              Active Consent Grants ({activeGrants.length})
            </h4>
            {activeGrants.map((grant) => (
              <div
                key={grant.grant_id}
                className="p-3 rounded-2xl bg-[#F0FBF5] border border-[#8BD4A9] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#4EA77B] shrink-0" />
                  <div>
                    <span className="font-semibold text-[#1B4F3A]">
                      {grant.grant_id} — Permitted: {grant.permitted_categories.join(', ')}
                    </span>
                    <p className="text-[11px] text-[#287653]">
                      Granted: {new Date(grant.granted_at).toLocaleDateString()} • Expires:{' '}
                      {new Date(grant.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(grant.grant_id)}
                  disabled={actionLoading}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#A83D3A] border border-[#FDD9D5] hover:bg-[#FFF3F2] transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Revoke Consent
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. Cross-Hospital Records Table
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E1EAE3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#173F43] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#287B80]" />
              Unified Cross-Hospital Patient Timeline
            </h2>
            <p className="text-xs text-[#657C78] mt-0.5">
              Consolidated medical record history from authorized participating hospitals with provenance badges.
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs">
            {['ALL', 'ADMISSION', 'PRESCRIPTION', 'LAB_RESULT', 'CLINICAL_NOTE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                  activeCategoryFilter === cat
                    ? 'bg-[#173F43] text-white shadow-2xs'
                    : 'text-[#657C78] hover:text-[#173F43] hover:bg-[#EEF3EE]'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#829590]">
            No records found for the selected filter or current consent scope.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-mono tracking-wider border-b bg-[#FBFAF4] text-[#657C78] border-[#E1EAE3]">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Originating Hospital</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3EE]">
                {filteredTimeline.map((rec) => {
                  const isExternal = rec.is_external;
                  const isApollo = rec.hospital_id === 'HOSP001';

                  return (
                    <tr
                      key={rec.record_id}
                      className="hover:bg-[#FBFAF4] transition-colors cursor-pointer"
                      onClick={() => setSelectedRecordForDetail(rec)}
                    >
                      <td className="py-3 px-4 font-mono text-[#657C78]">
                        {rec.timestamp.split('T')[0]}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                            isApollo
                              ? 'bg-[#DDF3F1] text-[#21666C] border-[#91D2D0]'
                              : 'bg-[#E6F4ED] text-[#174F55] border-[#B5E4D3]'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>{rec.hospital_name}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold uppercase text-[#173F43] bg-[#EEF3EE] px-2 py-0.5 rounded-md">
                          {rec.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-bold text-[#173F43]">{rec.title}</div>
                        <div className="text-[11px] text-[#657C78] line-clamp-1">{rec.summary}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#829590]">
                        {rec.record_id}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordForDetail(rec);
                          }}
                          className="text-[#4FA58D] hover:text-[#174F55] font-bold text-xs"
                        >
                          Details &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFEFB] border border-[#E1EAE3] w-full max-w-xl rounded-3xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1EAE3] pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E6F4ED] text-[#174F55] border border-[#B5E4D3] font-bold">
                  {selectedRecordForDetail.hospital_name}
                </span>
                <h3 className="font-extrabold text-base text-[#173F43] mt-1">
                  {selectedRecordForDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1 rounded-lg text-[#657C78] hover:bg-[#EEF3EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#657C78]">
              <p className="text-[#173F43] leading-relaxed">
                {selectedRecordForDetail.summary}
              </p>
              <div className="bg-[#FBFAF4] p-3 rounded-2xl border border-[#E1EAE3] font-mono text-[11px] space-y-1">
                <div>Record ID: {selectedRecordForDetail.record_id}</div>
                <div>Timestamp: {(selectedRecordForDetail as any).timestamp || (selectedRecordForDetail as any).created_at || 'N/A'}</div>
                <div>Category: {(selectedRecordForDetail as any).category || (selectedRecordForDetail as any).record_type || 'N/A'}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 bg-[#173F43] text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FHIR Bundle Modal */}
      {fhirModalHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFEFB] border border-[#E1EAE3] w-full max-w-2xl rounded-3xl shadow-xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E1EAE3] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#4FA58D]" />
                <h3 className="font-extrabold text-base text-[#173F43]">
                  HL7 FHIR R4 Bundle Export ({fhirModalHospital.hospitalId})
                </h3>
              </div>
              <button
                onClick={() => setFhirModalHospital(null)}
                className="p-1 rounded-lg text-[#657C78] hover:bg-[#EEF3EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#FBFAF4] p-4 rounded-2xl border border-[#E1EAE3] font-mono text-xs text-[#173F43] whitespace-pre-wrap select-text">
              {JSON.stringify(fhirModalHospital.bundle, null, 2)}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setFhirModalHospital(null)}
                className="px-4 py-2 bg-[#173F43] text-white text-xs font-bold rounded-xl"
              >
                Close FHIR Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request External Records Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFEFB] border border-[#E1EAE3] w-full max-w-lg rounded-3xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1EAE3] pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#287B80]" />
                <h3 className="font-extrabold text-base text-[#173F43]">
                  Initiate Cross-Hospital Consent Request
                </h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 rounded-lg text-[#657C78] hover:bg-[#EEF3EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-mono uppercase font-bold text-[#829590] text-[10px] block mb-1">
                  Clinical Purpose:
                </label>
                <input
                  type="text"
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  className="w-full bg-[#FBFAF4] border border-[#E1EAE3] text-xs p-3 rounded-xl text-[#173F43] focus:outline-none focus:ring-2 focus:ring-[#91D5BE]"
                />
              </div>

              <div>
                <label className="font-mono uppercase font-bold text-[#829590] text-[10px] block mb-1">
                  Requested Clinical Categories:
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {['admissions', 'medications', 'lab_results', 'clinical_notes'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2 font-mono text-[11px] text-[#173F43]">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat]);
                          } else {
                            setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                          }
                        }}
                        className="rounded accent-[#173F43]"
                      />
                      <span>{cat.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E1EAE3] flex justify-end gap-2">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 bg-[#FBFAF4] text-[#657C78] border border-[#E1EAE3] text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#173F43] hover:bg-[#24665F] text-white text-xs font-bold rounded-xl shadow-2xs"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
