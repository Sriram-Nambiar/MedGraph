import React from 'react';
import { ArrowRight, FileText, HeartPulse, Building2, Pill, AlertTriangle } from 'lucide-react';
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
      {/* Patient Header Strip */}
      <div className="bg-white dark:bg-zinc-900/40 border-2 border-[#bfdbfe] dark:border-zinc-800/80 rounded-2xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] dark:text-white tracking-tight font-['Outfit']">
                {patient.name}
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#eff6ff] dark:bg-zinc-800/80 text-[#1e3a8a] dark:text-zinc-300 border border-[#bfdbfe] dark:border-zinc-750">
                {patient.id}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono font-semibold">
                MRN: {patient.mrn}
              </span>
              <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {patient.age} years • {patient.gender} • Blood {patient.bloodType}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 font-medium">
              Primary Diagnosis: <span className="text-[#0f172a] dark:text-zinc-200 font-bold">{patient.primaryDiagnosis}</span>
            </p>
          </div>

          <button
            onClick={() => onNavigateToInvestigate("What changed between the patient's last two admissions?")}
            className="self-start md:self-auto px-4 py-2 bg-[#1e3a8a] hover:bg-[#152347] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm transform hover:-translate-y-0.5"
          >
            <span>Investigate History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Documented Allergies */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center gap-2 text-xs">
            <span className="text-rose-700 font-mono uppercase text-[10px] font-bold">ALLERGIES:</span>
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 text-[11px] rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-mono font-semibold"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Documented Conditions & Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conditions */}
        <div className="bg-white dark:bg-zinc-900/30 border-2 border-[#bfdbfe] dark:border-zinc-800/80 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0f172a] dark:text-zinc-400">
                Documented Conditions ({conditions.length})
              </h2>
            </div>
          </div>
          <div className="space-y-2">
            {conditions.map((cond) => (
              <div
                key={cond.id}
                className="p-3 rounded-xl bg-[#f8faff] dark:bg-zinc-950/60 border border-[#bfdbfe] dark:border-zinc-850 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0f172a] dark:text-zinc-200">{cond.name}</span>
                    <span className="font-mono text-[10px] text-[#2563eb] dark:text-zinc-500 font-bold">[{cond.code}]</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-500 mt-0.5 font-medium">
                    Onset: {cond.onsetDate} • Category: {cond.category}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-800 dark:text-zinc-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 font-bold">
                  {cond.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admissions */}
        <div className="bg-white dark:bg-zinc-900/30 border-2 border-[#bfdbfe] dark:border-zinc-800/80 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#4f46e5]" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0f172a] dark:text-zinc-400">
                Hospital Admissions ({admissions.length})
              </h2>
            </div>
          </div>
          <div className="space-y-2.5">
            {admissions.map((adm) => (
              <div
                key={adm.id}
                className="p-3.5 rounded-xl bg-[#f8faff] dark:bg-zinc-950/60 border border-[#bfdbfe] dark:border-zinc-850 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#1e3a8a] text-[11px] bg-blue-100 px-2 py-0.5 rounded">
                      {adm.id}
                    </span>
                    <span className="text-slate-600 dark:text-zinc-400 text-[11px] font-mono font-semibold">
                      {adm.admissionDate.split('T')[0]} → {adm.dischargeDate.split('T')[0]}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                    {adm.admissionType}
                  </span>
                </div>
                <p className="text-slate-800 dark:text-zinc-300 text-xs font-medium leading-relaxed">{adm.reason}</p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-850">
                  <span>Department: <strong>{adm.department}</strong></span>
                  {adm.dischargeSummaryId && (
                    <button
                      onClick={() => onOpenEvidence(adm.dischargeSummaryId!)}
                      className="text-[#1e3a8a] dark:text-zinc-400 hover:underline flex items-center gap-1 font-mono text-[10px] font-bold transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Summary [{adm.dischargeSummaryId}]</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medication Regimen & History Table */}
      <div className="bg-white dark:bg-zinc-900/30 border-2 border-[#bfdbfe] dark:border-zinc-800/80 rounded-2xl p-5 space-y-3 shadow-md">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0f172a] dark:text-zinc-400">
              Medication Regimen & Historical Interventions ({medications.length})
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#eff6ff] text-[#1e3a8a] font-mono text-[10px] uppercase font-bold border-b border-[#bfdbfe]">
                <th className="py-2.5 px-3 rounded-l-lg">Medication</th>
                <th className="py-2.5 px-3">Dosage & Frequency</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Timeline</th>
                <th className="py-2.5 px-3">Documented Indication / Change Reason</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
              {medications.map((item) => {
                const rx = item.prescription;
                const med = item.medication;
                const isDiscontinued = rx.action === 'Discontinued' || rx.status === 'Discontinued';
                return (
                  <tr key={rx.id} className="hover:bg-[#f0f6ff] dark:hover:bg-zinc-850/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0f172a] dark:text-zinc-100">{med.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium">{med.category}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-zinc-300 text-[11px] font-semibold">
                      {rx.dosage} • {rx.frequency}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          isDiscontinued
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 line-through'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {rx.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-zinc-400 text-[11px]">
                      {rx.startDate} {rx.endDate ? `→ ${rx.endDate}` : '→ Present'}
                    </td>
                    <td className="py-3 px-3 text-slate-800 dark:text-zinc-300 max-w-sm leading-relaxed font-medium">
                      {rx.reason}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <button
                        onClick={() => onOpenEvidence(rx.sourceRecordId)}
                        className="text-[#1e3a8a] hover:underline font-bold text-[11px] transition-colors"
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
