import React from 'react';
import { User, ShieldAlert, HeartPulse, Pill, Calendar, Building2, Stethoscope, ArrowRight, FileText } from 'lucide-react';
import { Patient, Condition, Admission, Prescription, Medication, LabResult } from '../../types';

interface PatientOverviewProps {
  patient: Patient;
  conditions: Condition[];
  admissions: Admission[];
  medications: Array<{ prescription: Prescription; medication: Medication }>;
  labResults: LabResult[];
  onOpenEvidence: (recordId: string) => void;
  onNavigateToInvestigate: (sampleQuestion?: string) => void;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({
  patient,
  conditions,
  admissions,
  medications,
  onOpenEvidence,
  onNavigateToInvestigate,
}) => {
  return (
    <div className="space-y-6">
      {/* Patient Demographic Profile Banner */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-mono text-lg font-bold">
              {patient.id}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white tracking-tight">{patient.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                  {patient.mrn}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 font-medium">
                  {patient.age} yrs • {patient.gender}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  Blood: {patient.bloodType}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-medium flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-zinc-200">{patient.primaryDiagnosis}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToInvestigate('What changed between the last two admissions?')}
            className="self-start md:self-auto px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <span>Investigate Clinical Changes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Allergies bar */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-2 text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-zinc-400 font-mono uppercase text-[10px]">Documented Allergies:</span>
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[11px] rounded bg-amber-950/40 text-amber-300 border border-amber-800/60 font-medium"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Conditions & Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medical Conditions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              Documented Conditions ({conditions.length})
            </h2>
          </div>
          <div className="space-y-2.5">
            {conditions.map((cond) => (
              <div
                key={cond.id}
                className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100">{cond.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                      {cond.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-3">
                    <span>Category: {cond.category}</span>
                    <span>Onset: {cond.onsetDate}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    cond.status === 'Active'
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-800/60'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {cond.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Admissions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Hospital Admissions ({admissions.length})
            </h2>
          </div>
          <div className="space-y-3">
            {admissions.map((adm, idx) => (
              <div
                key={adm.id}
                className="p-3.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono bg-zinc-800 px-2 py-0.5 rounded">
                      {adm.id}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {adm.admissionDate.split('T')[0]} → {adm.dischargeDate.split('T')[0]}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                    {adm.admissionType}
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-medium leading-relaxed">{adm.reason}</p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400 border-t border-zinc-800/60">
                  <span>Dept: {adm.department}</span>
                  {adm.dischargeSummaryId && (
                    <button
                      onClick={() => onOpenEvidence(adm.dischargeSummaryId!)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                    >
                      <FileText className="w-3 h-3" />
                      <span>View Discharge Summary ({adm.dischargeSummaryId})</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medication History */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <Pill className="w-4 h-4 text-emerald-400" />
            Medication History & Interventions ({medications.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Medication</th>
                <th className="py-2.5 px-3">Dosage & Route</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Timeline</th>
                <th className="py-2.5 px-3">Documented Reason</th>
                <th className="py-2.5 px-3 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {medications.map((item) => {
                const rx = item.prescription;
                const med = item.medication;
                const isDiscontinued = rx.action === 'Discontinued' || rx.status === 'Discontinued';
                return (
                  <tr key={rx.id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-zinc-100">{med.name}</div>
                      <div className="text-[10px] text-zinc-400">{med.category}</div>
                    </td>
                    <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">
                      {rx.dosage} • {rx.frequency} ({rx.route})
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          isDiscontinued
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                            : rx.action === 'Dose Increased'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                            : rx.action === 'Initiated'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {rx.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                      {rx.startDate} {rx.endDate ? `→ ${rx.endDate}` : '→ Active'}
                    </td>
                    <td className="py-3 px-3 text-zinc-300 max-w-xs">{rx.reason}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      <button
                        onClick={() => onOpenEvidence(rx.sourceRecordId)}
                        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 text-[11px]"
                      >
                        [{rx.sourceRecordId}]
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
