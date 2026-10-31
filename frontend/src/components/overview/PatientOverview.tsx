import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
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
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-white tracking-tight">{patient.name}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-750">
                {patient.id}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                MRN: {patient.mrn}
              </span>
              <span className="text-xs text-zinc-400">
                {patient.age} years • {patient.gender} • Blood {patient.bloodType}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium">
              Primary Diagnosis: <span className="text-zinc-200">{patient.primaryDiagnosis}</span>
            </p>
          </div>

          <button
            onClick={() => onNavigateToInvestigate("What changed between the patient's last two admissions?")}
            className="self-start md:self-auto px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <span>Investigate History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Documented Allergies */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-mono uppercase text-[10px]">Allergies:</span>
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[11px] rounded bg-zinc-800/80 text-zinc-300 border border-zinc-750 font-mono"
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
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400">
              Documented Conditions ({conditions.length})
            </h2>
          </div>
          <div className="space-y-2">
            {conditions.map((cond) => (
              <div
                key={cond.id}
                className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-850 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200">{cond.name}</span>
                    <span className="font-mono text-[10px] text-zinc-500">[{cond.code}]</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Onset: {cond.onsetDate} • Category: {cond.category}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  {cond.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admissions */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400">
              Hospital Admissions ({admissions.length})
            </h2>
          </div>
          <div className="space-y-2.5">
            {admissions.map((adm) => (
              <div
                key={adm.id}
                className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-850 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-[11px] bg-zinc-850 px-1.5 py-0.5 rounded">
                      {adm.id}
                    </span>
                    <span className="text-zinc-400 text-[11px] font-mono">
                      {adm.admissionDate.split('T')[0]} → {adm.dischargeDate.split('T')[0]}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    {adm.admissionType}
                  </span>
                </div>
                <p className="text-zinc-300 text-xs font-normal leading-relaxed">{adm.reason}</p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 border-t border-zinc-850">
                  <span>Department: {adm.department}</span>
                  {adm.dischargeSummaryId && (
                    <button
                      onClick={() => onOpenEvidence(adm.dischargeSummaryId!)}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 font-mono text-[10px] transition-colors"
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
      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
          <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400">
            Medication Regimen & Historical Interventions ({medications.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-500 font-mono text-[10px] uppercase">
                <th className="py-2 px-3">Medication</th>
                <th className="py-2 px-3">Dosage & Frequency</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Timeline</th>
                <th className="py-2 px-3">Documented Indication / Change Reason</th>
                <th className="py-2 px-3 text-right">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {medications.map((item) => {
                const rx = item.prescription;
                const med = item.medication;
                const isDiscontinued = rx.action === 'Discontinued' || rx.status === 'Discontinued';
                return (
                  <tr key={rx.id} className="hover:bg-zinc-850/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-zinc-100">{med.name}</div>
                      <div className="text-[10px] text-zinc-500">{med.category}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-300 text-[11px]">
                      {rx.dosage} • {rx.frequency}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          isDiscontinued
                            ? 'bg-zinc-800/80 text-zinc-400 line-through'
                            : 'bg-zinc-800 text-zinc-200'
                        }`}
                      >
                        {rx.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400 text-[11px]">
                      {rx.startDate} {rx.endDate ? `→ ${rx.endDate}` : '→ Present'}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 max-w-sm leading-relaxed">{rx.reason}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <button
                        onClick={() => onOpenEvidence(rx.sourceRecordId)}
                        className="text-zinc-400 hover:text-white underline underline-offset-2 text-[11px] transition-colors"
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
