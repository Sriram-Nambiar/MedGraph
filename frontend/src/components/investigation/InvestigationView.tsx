import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Activity,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { Patient, InvestigationResponse, InvestigationClaim } from '../../types';
import { runInvestigation } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  text?: string;
  response?: InvestigationResponse;
  isLoading?: boolean;
}

interface InvestigationViewProps {
  patient: Patient;
  onOpenEvidence: (recordId: string) => void;
  initialQuestion?: string;
}

/**
 * Utility to parse and render markdown **bold** tokens into distinct, high-contrast bold elements
 */
const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold text-white tracking-wide">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  patient,
  onOpenEvidence,
  initialQuestion = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `MedGraph ready for clinical history investigation on **${patient.name}** (${patient.id}).\n\nI have indexed the patient's **hospital admissions**, **doctor progress notes**, **medication changes**, and **longitudinal laboratory values**. Ask any question to retrieve and verify evidence.`,
    },
  ]);

  const [input, setInput] = useState(initialQuestion || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string>(`INV-${patient.id}-${Date.now()}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset thread when patient changes
  useEffect(() => {
    threadIdRef.current = `INV-${patient.id}-${Date.now()}`;
    setMessages([
      {
        id: `welcome-${patient.id}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `MedGraph active for **${patient.name}** (${patient.id}, **${patient.age}y ${patient.gender[0]}**).\n**Primary Diagnosis**: **${patient.primaryDiagnosis}**\n\nAsk any question to investigate timeline changes, medication transitions, or contradictory records.`,
      },
    ]);
  }, [patient.id]);

  const samplePrompts = [
    "What changed between the last two admissions?",
    "Why was the primary medication discontinued or changed?",
    "What happened to blood test values over time?",
    "Are there contradictory records or missing documentation?",
  ];

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isSubmitting) return;

    const userMsgId = `user-${Date.now()}`;
    const agentMsgId = `agent-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        timestamp: nowTime,
        text: promptToSend,
      },
      {
        id: agentMsgId,
        sender: 'agent',
        timestamp: nowTime,
        isLoading: true,
      },
    ]);

    setInput('');
    setIsSubmitting(true);

    try {
      const response = await runInvestigation(patient.id, promptToSend, threadIdRef.current);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                isLoading: false,
                response,
              }
            : msg
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                isLoading: false,
                text: `Investigation error: ${err.message || 'Unable to retrieve answer.'}`,
              }
            : msg
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClaimExpansion = (claimIdx: string) => {
    setExpandedClaims((prev) => ({
      ...prev,
      [claimIdx]: !prev[claimIdx],
    }));
  };

  const renderStatusTag = (status: InvestigationClaim['status']) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-white border border-zinc-600">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SUPPORTED
          </span>
        );
      case 'CONTRADICTORY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-amber-300 border border-amber-600">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            CONTRADICTORY
          </span>
        );
      case 'MISSING_EVIDENCE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-850 text-zinc-300 border border-zinc-700">
            <HelpCircle className="w-3 h-3 text-zinc-400" />
            MISSING EVIDENCE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            UNVERIFIED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-[#0a0a0c] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div>
            <span className="text-xs font-bold text-white tracking-tight">Clinical Investigation Chat</span>
            <span className="text-[11px] text-zinc-300 font-mono ml-2 font-semibold">
              • {patient.name} <strong className="text-white font-bold">({patient.id})</strong>
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            threadIdRef.current = `INV-${patient.id}-${Date.now()}`;
            setMessages([
              {
                id: `welcome-${Date.now()}`,
                sender: 'agent',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: `Session reset. Ready for new investigation questions regarding **${patient.name}**.`,
              },
            ]);
          }}
          className="text-zinc-400 hover:text-white text-xs font-mono font-semibold flex items-center gap-1 p-1 rounded hover:bg-zinc-900 transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {/* User Message */}
            {msg.sender === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-xl bg-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl rounded-tr-sm border border-zinc-700 shadow-sm leading-relaxed">
                  {msg.text}
                  <span className="text-[9px] text-zinc-400 block text-right mt-1 font-mono font-normal">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ) : (
              /* Agent Message */
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100 shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Loading State */}
                  {msg.isLoading ? (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-zinc-300 font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="font-semibold text-white">Retrieving graph entities & verifying clinical notes...</span>
                    </div>
                  ) : msg.response ? (
                    /* Structured Agent Investigation Output */
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-sm text-xs">
                      {/* Status header */}
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] font-mono">
                        <strong className="text-white font-bold tracking-tight">MedGraph Investigation Report</strong>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-zinc-400 font-bold">Status:</strong>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              msg.response.verification_status === 'VERIFIED'
                                ? 'bg-zinc-800 text-white border border-zinc-600'
                                : 'bg-zinc-850 text-amber-300 border border-amber-600'
                            }`}
                          >
                            {msg.response.verification_status}
                          </span>
                        </div>
                      </div>

                      {/* Main Answer Narrative with Bold Tokens */}
                      <div className="text-zinc-200 leading-relaxed whitespace-pre-line text-xs font-sans">
                        {renderFormattedText(msg.response.answer)}
                      </div>

                      {/* Key Findings Chips */}
                      {msg.response.key_findings && msg.response.key_findings.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.response.key_findings.map((f, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-white font-semibold border border-zinc-700"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Missing Information Callout */}
                      {msg.response.missing_information && msg.response.missing_information.length > 0 && (
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[10px] font-bold uppercase">
                            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                            <strong>Missing Clinical Documentation</strong>
                          </div>
                          {msg.response.missing_information.map((info, idx) => (
                            <p key={idx} className="text-zinc-200 pl-4 text-[11px] font-medium">
                              • {info}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Contradictions Callout */}
                      {msg.response.contradictions_found && msg.response.contradictions_found.length > 0 && (
                        <div className="p-3 rounded-lg bg-zinc-950 border border-amber-900/60 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-amber-300 font-mono text-[10px] font-bold uppercase">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <strong>Contradictory Records Flagged</strong>
                          </div>
                          {msg.response.contradictions_found.map((c, idx) => (
                            <p key={idx} className="text-zinc-200 pl-4 text-[11px] font-medium">
                              • {c}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Claims & Grounded Evidence */}
                      {msg.response.claims && msg.response.claims.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                          <strong className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                            Grounded Claims & Verified Citations:
                          </strong>

                          <div className="space-y-2">
                            {msg.response.claims.map((claim, cIdx) => {
                              const claimKey = `${msg.id}-${cIdx}`;
                              const isExpanded = expandedClaims[claimKey] ?? true;

                              return (
                                <div
                                  key={cIdx}
                                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2"
                                >
                                  <div
                                    className="flex items-start justify-between gap-2 cursor-pointer select-none"
                                    onClick={() => toggleClaimExpansion(claimKey)}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="text-zinc-100 font-bold text-xs leading-snug">
                                        {renderFormattedText(claim.claim)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {renderStatusTag(claim.status)}
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                      )}
                                    </div>
                                  </div>

                                  {isExpanded && claim.evidence && claim.evidence.length > 0 && (
                                    <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
                                      {claim.evidence.map((ev, evIdx) => (
                                        <div
                                          key={evIdx}
                                          className="flex items-start justify-between gap-2 text-[11px] text-zinc-300 bg-zinc-900/90 p-2.5 rounded border border-zinc-850"
                                        >
                                          <div className="space-y-0.5">
                                            {ev.quote && (
                                              <p className="text-zinc-200 italic font-medium leading-relaxed">
                                                "{ev.quote}"
                                              </p>
                                            )}
                                            <div className="font-mono text-[10px] text-zinc-400">
                                              Date: <strong className="text-zinc-300 font-bold">{ev.timestamp ? ev.timestamp.split('T')[0] : 'N/A'}</strong>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => onOpenEvidence(ev.record_id)}
                                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[11px] font-bold border border-zinc-700 transition-colors shrink-0"
                                          >
                                            [{ev.record_id}]
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-400 font-mono pt-1 text-right font-medium">
                        Verified via MedGraph GraphRAG • {msg.timestamp}
                      </div>
                    </div>
                  ) : (
                    /* Plain text message */
                    <div className="bg-zinc-900/50 border border-zinc-800 text-zinc-200 text-xs px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-line font-sans">
                      {renderFormattedText(msg.text || '')}
                      <span className="text-[9px] text-zinc-400 block text-right mt-1 font-mono font-normal">
                        {msg.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pill Strip */}
      <div className="px-5 py-2.5 border-t border-zinc-800/80 bg-zinc-950 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <strong className="text-[10px] font-mono uppercase text-zinc-400 font-bold shrink-0">Prompts:</strong>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isSubmitting}
            className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-750 transition-colors shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSubmitting}
            placeholder={`Ask a question about ${patient.name}'s clinical records...`}
            className="w-full bg-zinc-900 text-xs text-white placeholder-zinc-500 pl-4 pr-12 py-3 rounded-xl border border-zinc-750 focus:outline-none focus:border-zinc-500 transition-colors font-medium"
          />

          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="absolute right-2 p-2 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-lg transition-colors shadow-sm font-bold"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
