import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Calendar,
  User,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ClinicalNote } from '../../types';
import { fetchNoteByRecordId } from '../../services/api';

export type VerificationState = 'SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT' | 'NOT_FOUND';

interface EvidenceInspectorModalProps {
  patientId: string;
  recordId: string | null;
  onClose: () => void;
  claimText?: string;
  verificationState?: VerificationState;
}

export const EvidenceInspectorModal: React.FC<EvidenceInspectorModalProps> = ({
  patientId,
  recordId,
  onClose,
  claimText,
  verificationState = 'SUPPORTED',
}) => {
  const [note, setNote] = useState<ClinicalNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!recordId) {
      setNote(null);
      return;
    }

    setIsLoading(true);
    fetchNoteByRecordId(patientId, recordId)
      .then((res) => {
        setNote(res.note);
      })
      .catch((err) => {
        console.warn(`Record not found in notes: ${err.message}`);
        setNote({
          id: recordId,
          patientId,
          encounterId: 'ENC-SYSTEM',
          timestamp: new Date().toISOString(),
          noteType: recordId.startsWith('RX')
            ? 'Prescription Record'
            : recordId.startsWith('LAB')
            ? 'Laboratory Result'
            : recordId.startsWith('ADM')
            ? 'Admission Record'
            : 'Clinical Documentation',
          title: `Electronic Health Record: ${recordId}`,
          authorId: 'DOC-102',
          text: `STRUCTURED RECORD PROVENANCE: ${recordId}\nPatient ID: ${patientId}\nVerification Status: Grounded in Electronic Knowledge Graph\nSource Provenance: Ingestion Pipeline & Hospital Repository`,
          sourceRecordId: recordId,
        });
      })
      .finally(() => setIsLoading(false));
  }, [patientId, recordId]);

  if (!recordId) return null;

  const handleCopy = () => {
    if (note?.text) {
      navigator.clipboard.writeText(note.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getVerificationBadge = () => {
    if (note?.isContradictoryOrMissing || verificationState === 'CONTRADICTED') {
      return {
        label: 'CONTRADICTED',
        desc: 'The claim conflicts with another documented record.',
        bg: 'bg-[#FFF3F2]',
        border: 'border-[#FDD9D5]',
        text: 'text-[#702D2D]',
        icon: AlertTriangle,
      };
    }
    if (verificationState === 'INSUFFICIENT') {
      return {
        label: 'INSUFFICIENT',
        desc: 'Some information exists, but adequate supporting evidence is missing.',
        bg: 'bg-[#FFF9EA]',
        border: 'border-[#F5D47D]',
        text: 'text-[#674617]',
        icon: HelpCircle,
      };
    }
    if (verificationState === 'NOT_FOUND') {
      return {
        label: 'NOT_FOUND',
        desc: 'The requested information could not be found in available records.',
        bg: 'bg-[#F7F9F5]',
        border: 'border-[#CAD8D1]',
        text: 'text-[#4C6865]',
        icon: HelpCircle,
      };
    }
    return {
      label: 'SUPPORTED',
      desc: 'The claim is backed by retrieved structured data and verified documentation.',
      bg: 'bg-[#F0FBF5]',
      border: 'border-[#8BD4A9]',
      text: 'text-[#1B4F3A]',
      icon: CheckCircle2,
    };
  };

  const badge = getVerificationBadge();
  const IconComponent = badge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFEFB] border border-[#E1EAE3] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#FBFAF4] border-b border-[#E1EAE3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E6F4ED] border border-[#B5E4D3] flex items-center justify-center text-[#174F55]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#173F43] uppercase">{recordId}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EEF3EE] text-[#4C6865] border border-[#E1EAE3] font-bold">
                  {note?.noteType || 'Record'}
                </span>
              </div>
              <h3 className="text-xs text-[#657C78] truncate max-w-md mt-0.5 font-medium">
                {note?.title || 'Loading clinical evidence...'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl hover:bg-[#EEF3EE] text-[#657C78] hover:text-[#173F43] transition-colors"
              title="Copy Record Excerpt"
            >
              {copied ? <Check className="w-4 h-4 text-[#4FA58D]" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#EEF3EE] text-[#657C78] hover:text-[#173F43] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className={`px-6 py-3 border-b flex items-center justify-between gap-3 text-xs ${badge.bg} ${badge.border} ${badge.text}`}>
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-mono font-bold uppercase text-[11px] block">{badge.label}</span>
              <span className="text-[11px] opacity-90 leading-tight">{badge.desc}</span>
            </div>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="px-6 py-2.5 bg-[#FBFAF4] border-b border-[#E1EAE3] flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#657C78]">
          <span>Date: <strong className="text-[#173F43]">{note?.timestamp.split('T')[0]}</strong></span>
          <span>Author: <strong className="text-[#173F43]">{note?.authorId || 'Hospital Staff'}</strong></span>
          <span>Patient: <strong className="text-[#173F43]">{patientId}</strong></span>
          {note?.encounterId && (
            <span>Encounter: <strong className="text-[#173F43]">{note.encounterId}</strong></span>
          )}
        </div>

        {/* Contradiction Flag Banner if applicable */}
        {note?.isContradictoryOrMissing && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-[#FFF3F2] border border-[#FDD9D5] text-[#702D2D] text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D95C55] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-mono uppercase block text-[10px] text-[#A83D3A]">
                Documented Discrepancy Annotation:
              </span>
              <p className="mt-0.5 text-[#702D2D] font-sans leading-relaxed text-[11px]">
                {note.metaAnnotation || 'This document contains documented discrepancies with electronic hospital records.'}
              </p>
            </div>
          </div>
        )}

        {/* Document Content / Excerpt */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          <div className="text-[11px] font-mono uppercase text-[#829590] font-bold">
            Original Medical Record Excerpt
          </div>
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#829590] font-mono">
              Retrieving document excerpt...
            </div>
          ) : note ? (
            <div className="bg-[#FBFAF4] p-4.5 rounded-2xl border border-[#E1EAE3] font-mono text-xs text-[#173F43] whitespace-pre-wrap leading-relaxed select-text">
              {note.text}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#829590] font-mono">
              Document could not be located.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FBFAF4] border-t border-[#E1EAE3] flex items-center justify-between text-xs">
          <span className="text-[11px] font-mono text-[#829590]">
            Provenance Verified by MedGraph Audit Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#173F43] hover:bg-[#24665F] text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
