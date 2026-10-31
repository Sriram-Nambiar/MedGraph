import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Clock,
  Quote,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Patient, InvestigationResponse, InvestigationClaim } from '../../types';
import { runInvestigation } from '../../services/api';

interface InvestigationViewProps {
  patient: Patient;
  onOpenEvidence: (recordId: string) => void;
  initialQuestion?: string;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  patient,
  onOpenEvidence,
  initialQuestion = '',
}) => {
  const [question, setQuestion] = useState(
    initialQuestion || 'What changed between the patient\'s last two admissions?'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InvestigationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestions = [
    "What changed between the patient's last two admissions?",
    'Which medications were introduced or changed, and what explains the change?',
    'What happened to the patient\'s blood test values over time?',
    'Is there documented evidence explaining the medication change?',
    'Are there any contradictory records or missing clinical documentation?',
  ];

  const handleInvestigate = async (qText?: string) => {
    const activeQuestion = qText || question;
    if (!activeQuestion.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await runInvestigation(patient.id, activeQuestion);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Investigation query failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: InvestigationClaim['status']) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            SUPPORTED
          </span>
        );
      case 'CONTRADICTORY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/70 text-amber-300 border border-amber-800">
            <AlertTriangle className="w-3 h-3" />
            CONTRADICTORY
          </span>
        );
      case 'MISSING_EVIDENCE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/70 text-rose-300 border border-rose-800">
            <HelpCircle className="w-3 h-3" />
            MISSING EVIDENCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
            UNVERIFIED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search / Investigation Prompt Input */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Agentic Investigation Query
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Patient Scoped: <span className="text-cyan-400 font-bold">{patient.name} ({patient.id})</span>
          </span>
        </div>

        {/* Input box */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) handleInvestigate();
              }}
              placeholder="Ask an evidence-based clinical investigation question..."
              className="w-full bg-zinc-950 text-sm text-white px-4 py-3 rounded-lg border border-zinc-700/80 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>
          <button
            onClick={() => handleInvestigate()}
            disabled={isLoading || !question.trim()}
            className="px-5 py-3 bg-cyan-900 hover:bg-cyan-800 disabled:opacity-50 text-cyan-100 font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors shrink-0 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Investigate</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Suggested Clinical Questions:</span>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(q);
                  handleInvestigate(q);
                }}
                className="text-left text-xs px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Investigation Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Answer Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Agent Investigation Result
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">
                  Verification Status:
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    result.verification_status === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : result.verification_status === 'CONTRADICTORY'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {result.verification_status}
                </span>
              </div>
            </div>

            {/* Answer body */}
            <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
              {result.answer}
            </div>

            {/* Key Findings Chips */}
            {result.key_findings && result.key_findings.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Key Findings:</span>
                {result.key_findings.map((finding, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700"
                  >
                    {finding}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Missing Information Banner */}
          {result.missing_information && result.missing_information.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase">
                <HelpCircle className="w-4 h-4" />
                <span>Missing Clinical Information Detected ({result.missing_information.length})</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300 pl-6 list-disc">
                {result.missing_information.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Contradictions Banner */}
          {result.contradictions_found && result.contradictions_found.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Contradictory Medical Records Flagged ({result.contradictions_found.length})</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300 pl-6 list-disc">
                {result.contradictions_found.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Claims & Source Evidence Cards */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Claims & Grounded Evidence Verification ({result.claims?.length || 0})
            </h3>

            <div className="space-y-4">
              {result.claims?.map((claim, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-white leading-relaxed">
                      {claim.claim}
                    </p>
                    {getStatusBadge(claim.status)}
                  </div>

                  {claim.explanation && (
                    <p className="text-xs text-amber-300/90 italic bg-amber-950/30 p-2 rounded border border-amber-900/40">
                      Note: {claim.explanation}
                    </p>
                  )}

                  {/* Evidence Items */}
                  {claim.evidence && claim.evidence.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                        Source Evidence Records:
                      </span>
                      {claim.evidence.map((ev, evIdx) => (
                        <div
                          key={evIdx}
                          className="p-2.5 rounded bg-zinc-950/70 border border-zinc-850 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                              <FileText className="w-3 h-3 text-cyan-400" />
                              <span className="text-white font-bold">{ev.record_id}</span>
                              {ev.timestamp && <span>• {ev.timestamp.split('T')[0]}</span>}
                              {ev.note_title && <span>• {ev.note_title}</span>}
                            </div>
                            {ev.quote && (
                              <p className="text-xs text-zinc-300 italic pl-3 border-l-2 border-cyan-800/80 mt-1">
                                "{ev.quote}"
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => onOpenEvidence(ev.record_id)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 hover:text-cyan-300 font-mono text-[11px] rounded transition-colors shrink-0 flex items-center gap-1"
                          >
                            <span>Inspect</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
