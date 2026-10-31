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

export const HospitalNetworkView: React.FC<HospitalNetworkViewProps> = ({
  selectedPatient,
  theme = 'clinical',
}) => {
  const isClinical = theme === 'clinical';

  // State
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeHospitalId, setActiveHospitalId] = useState<string>('HOSP002'); // Default: Bengaluru City Medical Center (Hospital B)
  const [history, setHistory] = useState<CrossHospitalPatientHistory | null>(null);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [consentGrants, setConsentGrants] = useState<ConsentGrant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals & Inspection
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [requestPurpose, setRequestPurpose] = useState<string>('Longitudinal clinical assessment and cardiology record review');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'admissions',
    'medications',
    'lab_results',
    'clinical_notes',
  ]);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<CrossHospitalRecord | null>(null);
  const [fhirModalHospital, setFhirModalHospital] = useState<{ hospitalId: string; bundle: any } | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  // Load all interop data for the patient
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

  // Handle request submission
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

  // Handle patient approval
  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(true);
      await approveConsent(requestId, 7);
      setStatusMessage({
        type: 'success',
        text: 'Patient APPROVED access! Active consent grant generated. Cross-hospital records unlocked.',
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle patient rejection
  const handleReject = async (requestId: string) => {
    try {
      setActionLoading(true);
      await rejectConsent(requestId, 'Declined by patient via portal');
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

  // Handle revocation
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

  // Inspect FHIR Bundle
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
      <div className="flex items-center justify-center min-h-[500px] text-zinc-400">
        Please select a patient from the top bar to inspect cross-hospital records.
      </div>
    );
  }

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[1];
  const pendingRequests = consentRequests.filter((r) => r.status === 'PENDING');
  const activeGrants = consentGrants.filter((g) => g.status === 'ACTIVE');

  // Filter records
  const filteredTimeline = history?.timeline.filter((rec) => {
    if (activeCategoryFilter === 'ALL') return true;
    return rec.category.toUpperCase() === activeCategoryFilter;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Banner & Hospital Switcher */}
      <div
        className={`rounded-2xl p-6 border shadow-lg relative overflow-hidden ${
          isClinical
            ? 'bg-gradient-to-r from-[#162a56] to-[#1e3975] border-[#294a94] text-white'
            : 'bg-gradient-to-r from-zinc-950 to-zinc-900 border-zinc-800 text-zinc-100'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-['Outfit']">
                  Cross-Hospital Medical Record Interoperability
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ABDM R4 Sandbox
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-1">
                Patient-centric consent protocol bridging Hospital A (Apollo General) and Hospital B (Bengaluru City Medical Center).
              </p>
            </div>
          </div>

          {/* Active Hospital Context Selector */}
          <div className="flex items-center gap-2.5 bg-black/20 p-2 rounded-xl border border-white/10">
            <Building2 className="w-4 h-4 text-blue-300" />
            <div className="text-xs">
              <span className="text-white/60 block text-[10px] uppercase tracking-wider">
                Current Clinic / Provider:
              </span>
              <select
                value={activeHospitalId}
                onChange={(e) => setActiveHospitalId(e.target.value)}
                className="bg-transparent font-bold text-white cursor-pointer focus:outline-none"
              >
                <option value="HOSP002" className="bg-[#162a56] text-white">
                  Hospital B — Bengaluru City Medical Center (HOSP002)
                </option>
                <option value="HOSP001" className="bg-[#162a56] text-white">
                  Hospital A — Apollo General Hospital (HOSP001)
                </option>
              </select>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh Network Data"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`mt-4 px-3.5 py-2 rounded-lg text-xs flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                : 'bg-blue-500/20 text-blue-200 border border-blue-500/40'
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

      {/* 2. Participating Hospitals & Consent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals.map((hosp) => {
          const isCurrent = hosp.id === activeHospitalId;
          const participantInfo = history?.participating_hospitals.find(
            (p) => p.hospital_id === hosp.id
          );
          const consentStatus = participantInfo?.consent_status || (isCurrent ? 'NOT_REQUIRED' : 'NO_CONSENT');

          return (
            <div
              key={hosp.id}
              className={`p-5 rounded-2xl border transition-all ${
                isCurrent
                  ? isClinical
                    ? 'bg-[#1a3366]/80 border-blue-400 shadow-md ring-1 ring-blue-400/30'
                    : 'bg-zinc-900 border-zinc-600 shadow-md'
                  : isClinical
                  ? 'bg-[#132247]/60 border-[#22396d]'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      hosp.id === 'HOSP001'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {hosp.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      {hosp.name}
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                          Active Hospital
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {hosp.city}, {hosp.state} • {hosp.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleViewFHIR(hosp.id)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-400/30 flex items-center gap-1 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>FHIR R4</span>
                </button>
              </div>

              {/* Consent and Access Badge */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">
                    Patient Records:
                  </span>
                  <span className="font-semibold text-white">
                    {participantInfo?.records_count || 0} items available
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">
                    Access Permission:
                  </span>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Local (Full Access)
                    </span>
                  ) : consentStatus === 'ACTIVE_GRANT' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Consent Granted
                    </span>
                  ) : consentStatus === 'PENDING_REQUEST' ? (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Approval Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      Restricted (No Consent)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Patient Consent Action Center */}
      <div
        className={`rounded-2xl p-6 border ${
          isClinical ? 'bg-[#15274d] border-[#223d79]' : 'bg-zinc-900/90 border-zinc-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Patient Consent Action Center
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simulate patient approval, review active consent grants, or submit new cross-hospital requests for{' '}
              <strong className="text-white">{selectedPatient.name}</strong> ({selectedPatient.id}).
            </p>
          </div>

          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            Request External Records
          </button>
        </div>

        {/* Pending Consent Notification & Simulated Approval */}
        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.request_id}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-300">
                        Pending Access Request ({req.request_id})
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-200">
                        Awaiting Patient
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      <strong>{req.requesting_hospital_name}</strong> requests access to records held at{' '}
                      <strong>{req.source_hospital_name}</strong> for: <em>"{req.purpose}"</em>.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
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
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                  >
                    Patient Rejects
                  </button>
                  <button
                    onClick={() => handleApprove(req.request_id)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Simulate Patient Approval
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : activeGrants.length === 0 ? (
          <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 text-xs text-zinc-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-400" />
              No pending consent requests or active grants for this patient between {activeHospital.name} and external providers.
            </span>
            <button
              onClick={() => setShowRequestModal(true)}
              className="text-xs text-blue-300 hover:underline font-semibold"
            >
              Initiate Request &rarr;
            </button>
          </div>
        ) : null}

        {/* Active Grants List */}
        {activeGrants.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Active Consent Grants ({activeGrants.length})
            </h4>
            {activeGrants.map((grant) => (
              <div
                key={grant.grant_id}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">
                      {grant.grant_id} — Permitted: {grant.permitted_categories.join(', ')}
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Granted: {new Date(grant.granted_at).toLocaleDateString()} • Expires:{' '}
                      {new Date(grant.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(grant.grant_id)}
                  disabled={actionLoading}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Revoke Consent
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Cross-Hospital Records Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isClinical ? 'bg-[#15274d] border-[#223d79]' : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Unified Cross-Hospital Patient Timeline
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Consolidated medical record history from all authorized participating hospitals, sorted chronologically with provenance badges.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            {['ALL', 'ADMISSION', 'PRESCRIPTION', 'LAB_RESULT', 'CLINICAL_NOTE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeCategoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No records found for the selected filter or current consent scope.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`text-[11px] uppercase font-mono tracking-wider border-b ${
                  isClinical ? 'bg-[#101e3d] text-zinc-400 border-white/10' : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Originating Hospital</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTimeline.map((rec) => {
                  const isExternal = rec.is_external;
                  const isApollo = rec.hospital_id === 'HOSP001';

                  return (
                    <tr
                      key={rec.record_id}
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${
                        selectedRecordForDetail?.record_id === rec.record_id ? 'bg-blue-600/10' : ''
                      }`}
                      onClick={() => setSelectedRecordForDetail(rec)}
                    >
                      <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap">
                        {rec.timestamp ? new Date(rec.timestamp).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isApollo
                              ? 'bg-blue-500/15 text-blue-200 border-blue-400/30'
                              : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          {rec.hospital_name}
                          {isExternal && (
                            <span className="text-[9px] px-1 rounded bg-black/30 font-mono">
                              External
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase font-mono text-[10px] text-zinc-400">
                        {rec.category}
                      </td>
                      <td className="py-3 px-4 font-medium text-white max-w-md truncate">
                        {rec.title}
                        <span className="block text-zinc-400 text-[11px] truncate mt-0.5">
                          {rec.summary}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {rec.record_id}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordForDetail(rec);
                          }}
                          className="text-xs text-blue-300 hover:text-blue-100 font-semibold"
                        >
                          View Details &rarr;
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

      {/* 5. Compliance & Security Audit Logs */}
      <div
        className={`rounded-2xl p-5 border text-xs ${
          isClinical ? 'bg-[#15274d] border-[#223d79]' : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-300" />
            Cross-Hospital Compliance & Consent Audit Trail
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">Immutable Log Chain</span>
        </div>

        <div className="space-y-1.5">
          {auditLogs.slice(0, 5).map((log) => (
            <div
              key={log.log_id}
              className="p-2.5 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-400'
                      : log.status === 'DENIED'
                      ? 'bg-rose-400'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="text-zinc-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="text-white font-semibold">[{log.action}]</span>
                <span className="text-zinc-300">{log.details}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  log.status === 'SUCCESS'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Record Details */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-xl w-full rounded-2xl p-6 border shadow-2xl space-y-4 ${
              isClinical ? 'bg-[#162a56] border-[#2b4c96] text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {selectedRecordForDetail.category}
                </span>
                <h3 className="text-lg font-bold mt-1">{selectedRecordForDetail.title}</h3>
                <p className="text-xs text-zinc-400">
                  Origin: <strong>{selectedRecordForDetail.hospital_name}</strong> • Record ID:{' '}
                  {selectedRecordForDetail.record_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-2 text-xs">
              <div>
                <strong className="text-zinc-400 block text-[10px] uppercase font-mono">Summary:</strong>
                <p className="mt-0.5">{selectedRecordForDetail.summary}</p>
              </div>

              {selectedRecordForDetail.details && (
                <div className="mt-3">
                  <strong className="text-zinc-400 block text-[10px] uppercase font-mono">Clinical Details:</strong>
                  <pre className="mt-1 p-2 rounded bg-black/40 overflow-x-auto text-[11px] font-mono text-blue-200">
                    {JSON.stringify(selectedRecordForDetail.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Request Access */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl space-y-4 ${
              isClinical ? 'bg-[#162a56] border-[#2b4c96] text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-400" />
                  Request Cross-Hospital Records
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Requesting records from{' '}
                  <strong>{activeHospitalId === 'HOSP002' ? 'Apollo General Hospital' : 'Bengaluru City Medical Center'}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Clinical Purpose of Access:</label>
                <textarea
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl p-2.5 bg-black/30 border border-white/15 text-white focus:outline-none focus:border-blue-400"
                  placeholder="e.g. Evaluation of prior cardiovascular admission, medication washout, and allergy check"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Requested Categories:</label>
                <div className="grid grid-cols-2 gap-2">
                  {['admissions', 'medications', 'lab_results', 'clinical_notes'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer text-xs">
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
                        className="rounded accent-blue-600"
                      />
                      <span className="capitalize">{cat.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FHIR R4 Export Viewer */}
      {fhirModalHospital && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-3xl w-full rounded-2xl p-6 border shadow-2xl space-y-4 max-h-[85vh] flex flex-col ${
              isClinical ? 'bg-[#162a56] border-[#2b4c96] text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
            }`}
          >
            <div className="flex items-start justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  HL7 FHIR R4 Bundle
                </span>
                <h3 className="text-base font-bold mt-1">
                  FHIR Export — {fhirModalHospital.bundle.entry?.length || 0} Resources
                </h3>
                <p className="text-xs text-zinc-400">
                  Hospital: {fhirModalHospital.hospitalId} • Patient: {selectedPatient.name} ({selectedPatient.id})
                </p>
              </div>
              <button
                onClick={() => setFhirModalHospital(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-black/50 border border-white/10">
              <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap">
                {JSON.stringify(fhirModalHospital.bundle, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end shrink-0">
              <button
                onClick={() => setFhirModalHospital(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
