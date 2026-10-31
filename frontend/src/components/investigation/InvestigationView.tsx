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
  GitBranch,
  Database,
  FileText,
  ShieldCheck,
  CheckCheck,
  Columns,
  MessageSquare,
  FileCode,
} from 'lucide-react';
import {
  Patient,
  InvestigationResponse,
  InvestigationClaim,
} from '../../types';
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
 * Normalizes dense or robotic responses into clean, human-readable paragraphs just like ChatGPT
 */
function simplifyClinicalAnswer(text: string): string {
  if (!text) return '';

  // If text already has clean paragraphs or markdown headers, return as is
  if (text.includes('\n\n') && (text.includes('•') || text.includes('**'))) {
    return text;
  }

  // If text matches raw agent format like:
  // "Medication changes identified: ... Laboratory shifts: ..."
  if (text.includes('Medication changes identified:') || text.includes('Laboratory shifts:')) {
    const parts: string[] = [];
    parts.push("Across the patient's recent admissions, several critical medication and laboratory changes were identified:");

    // Extract Medication changes
    const medMatch = text.match(/Medication changes identified:\s*(.*?)(?=\.\s*Laboratory shifts:|\.\s*Clinical documentation|\.\s*No clinical reason|$)/i);
    if (medMatch && medMatch[1]) {
      const medItems = medMatch[1].split(/,\s*(?=[A-Z])/).map(m => m.trim()).filter(Boolean);
      const lines = ['**Medication Changes:**'];
      for (const item of medItems) {
        lines.push(`• ${item.replace(/\s+/g, ' ')}`);
      }
      parts.push(lines.join('\n'));
    }

    // Extract Laboratory shifts
    const labMatch = text.match(/Laboratory shifts:\s*(.*?)(?=\.\s*Clinical documentation|\.\s*No clinical reason|$)/i);
    if (labMatch && labMatch[1]) {
      const labItems = labMatch[1].split(/;\s*|,\s*(?=[A-Z])/).map(l => l.trim()).filter(Boolean);
      const lines = ['**Laboratory Biomarker Shifts:**'];
      for (const item of labItems) {
        lines.push(`• ${item.replace('->', '→')}`);
      }
      parts.push(lines.join('\n'));
    }

    // Extract Clinical documentation reason
    const reasonMatch = text.match(/Clinical documentation establishes the reason:\s*(.*?)$/i);
    if (reasonMatch && reasonMatch[1]) {
      parts.push(`**Documented Clinical Rationale:**\n• ${reasonMatch[1].trim()}`);
    }

    // Extract No clinical reason
    if (text.toLowerCase().includes('no clinical reason or rationale is documented')) {
      parts.push(`**Clinical Rationale:**\n• No explicit clinical rationale was documented in the medical records for these changes.`);
    }

    return parts.join('\n\n');
  }

  return text;
}

const renderInlineTokens = (content: string) => {
  const parts = content.split(/(\*\*.*?\*\*)/g);
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

/**
 * Utility to render text in clean paragraphs and lists just like ChatGPT
 */
const renderFormattedText = (rawText: string) => {
  if (!rawText) return null;
  const formattedText = simplifyClinicalAnswer(rawText);
  const paragraphs = formattedText.split(/\n\s*\n/);

  return (
    <div className="space-y-3 text-zinc-200 text-xs font-sans leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        const hasBullets = lines.some((l) => l.trim().startsWith('•') || l.trim().startsWith('- '));

        if (hasBullets) {
          return (
            <div key={pIdx} className="space-y-1.5 pt-0.5">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ');
                const content = isBullet ? trimmed.replace(/^[•\-]\s*/, '') : trimmed;

                if (!isBullet) {
                  return (
                    <div key={lIdx} className="font-bold text-white text-[12px] pt-1">
                      {renderInlineTokens(content)}
                    </div>
                  );
                }

                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2 text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{renderInlineTokens(content)}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {renderInlineTokens(para)}
          </p>
        );
      })}
    </div>
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
  const [selectedResponse, setSelectedResponse] = useState<InvestigationResponse | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'chat' | 'audit'>('split');
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
    setSelectedResponse(null);
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
    'What changed between the last two admissions?',
    'Why was the primary medication discontinued or changed?',
    'What happened to blood test values over time?',
    'Are there contradictory records or missing documentation?',
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

      setSelectedResponse(response);

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

  const activeAuditResponse: InvestigationResponse | null =
    selectedResponse ||
    ([...messages]
      .reverse()
      .find((m) => m.response !== undefined)?.response || null);

  const showChat = viewMode === 'split' || viewMode === 'chat';
  const showAudit = viewMode === 'split' || viewMode === 'audit';

  return (
    <div className="space-y-3 max-w-[1700px] mx-auto px-2">
      {/* Top Layout Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Patient:</span>
          <span className="text-xs font-bold text-white">
            {patient.name} <span className="font-mono text-zinc-400 font-normal">({patient.id})</span>
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px] font-mono">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === 'split'
                ? 'bg-zinc-800 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
          <button
            onClick={() => setViewMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === 'chat'
                ? 'bg-zinc-800 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Only</span>
          </button>
          <button
            onClick={() => setViewMode('audit')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === 'audit'
                ? 'bg-zinc-800 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Panel</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`grid gap-5 h-[calc(100vh-170px)] ${
        viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 max-w-4xl mx-auto'
      }`}>
        {/* =========================================================================
            COLUMN 1 (LEFT): CHAT WINDOW WITH VERIFIED RESPONSE
            ========================================================================= */}
        {showChat && (
          <div className={`${
            viewMode === 'split' ? 'lg:col-span-7 xl:col-span-7' : 'w-full'
          } flex flex-col h-full bg-white dark:bg-[#0a0a0c] border-2 border-[#bfdbfe] dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg`}>
            {/* Chat Header */}
            <div className="px-5 py-3 border-b-2 border-[#bfdbfe] dark:border-zinc-800/80 bg-[#eff6ff] dark:bg-zinc-950/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <span className="text-xs font-black text-[#0f172a] dark:text-white tracking-tight uppercase font-['Outfit']">Clinical Investigation Chat</span>
                  <span className="text-[11px] text-[#1e3a8a] dark:text-zinc-300 font-mono ml-2 font-bold">
                    • {patient.name} <strong className="text-[#0f172a] dark:text-white">({patient.id})</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  threadIdRef.current = `INV-${patient.id}-${Date.now()}`;
                  setSelectedResponse(null);
                  setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      sender: 'agent',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      text: `Session reset. Ready for new investigation questions regarding **${patient.name}**.`,
                    },
                  ]);
                }}
                className="text-slate-600 dark:text-zinc-400 hover:text-[#1e3a8a] dark:hover:text-white text-xs font-mono font-semibold flex items-center gap-1 p-1 rounded hover:bg-blue-50 dark:hover:bg-zinc-900 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#fbfdff] dark:bg-transparent">
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
                    <div className="flex items-start gap-2.5 max-w-full">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100 shrink-0 mt-0.5">
                        <Activity className="w-4 h-4 text-white" />
                      </div>

                      <div className="flex-1 space-y-3 min-w-0">
                        {/* Loading State */}
                        {msg.isLoading ? (
                          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-zinc-300 font-mono">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span className="font-semibold text-white">Traversing Neo4j graph & verifying clinical evidence...</span>
                          </div>
                        ) : msg.response ? (
                          /* Structured Agent Investigation Output */
                          <div
                            onClick={() => setSelectedResponse(msg.response || null)}
                            className={`bg-zinc-900/60 border rounded-2xl p-4 space-y-4 shadow-sm text-xs transition-all ${
                              selectedResponse === msg.response
                                ? 'border-zinc-500 ring-1 ring-zinc-500/30'
                                : 'border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {/* Status header */}
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] font-mono">
                              <div className="flex items-center gap-2">
                                <strong className="text-white font-bold tracking-tight">MedGraph Verified Report</strong>
                              </div>
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

                            {/* Main Answer Narrative - Clean ChatGPT Style in Paragraphs */}
                            <div className="leading-relaxed">
                              {renderFormattedText(msg.response.answer)}
                            </div>

                            {/* Missing Information Callout (if any) */}
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

                            {/* Contradictions Callout (if any) */}
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

                            {/* Grounded Claims & Citations (Collapsible) */}
                            {msg.response.claims && msg.response.claims.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-zinc-800">
                                <strong className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                                  Grounded Claims & Citations:
                                </strong>

                                <div className="space-y-2">
                                  {msg.response.claims.map((claim, cIdx) => {
                                    const claimKey = `${msg.id}-${cIdx}`;
                                    const isExpanded = expandedClaims[claimKey] ?? false;

                                    return (
                                      <div
                                        key={cIdx}
                                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2"
                                      >
                                        <div
                                          className="flex items-start justify-between gap-2 cursor-pointer select-none"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleClaimExpansion(claimKey);
                                          }}
                                        >
                                          <div className="flex items-start gap-2">
                                            <span className="text-zinc-100 font-bold text-xs leading-snug">
                                              {renderInlineTokens(claim.claim)}
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
                                                    Date:{' '}
                                                    <strong className="text-zinc-300 font-bold">
                                                      {ev.timestamp ? ev.timestamp.split('T')[0] : 'N/A'}
                                                    </strong>
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenEvidence(ev.record_id);
                                                  }}
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
            <div className="px-4 py-2 border-t-2 border-[#bfdbfe] dark:border-zinc-800/80 bg-[#eff6ff] dark:bg-zinc-950 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <strong className="text-[10px] font-mono uppercase text-[#1e3a8a] dark:text-zinc-400 font-bold shrink-0">Prompts:</strong>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isSubmitting}
                  className="text-xs font-semibold px-3 py-1 rounded-full bg-white dark:bg-zinc-900 hover:bg-[#1e3a8a] hover:text-white dark:hover:bg-zinc-800 text-[#1e3a8a] dark:text-zinc-200 border border-[#bfdbfe] dark:border-zinc-750 transition-colors shrink-0 disabled:opacity-50 shadow-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3.5 border-t-2 border-[#bfdbfe] dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
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
                  className="w-full bg-[#f8faff] dark:bg-zinc-900 text-xs text-[#0f172a] dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 pl-4 pr-12 py-3 rounded-xl border-2 border-[#bfdbfe] dark:border-zinc-750 focus:outline-none focus:border-[#1e3a8a] dark:focus:border-zinc-500 transition-colors font-medium shadow-xs"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isSubmitting}
                  className="absolute right-2 p-2 bg-[#1e3a8a] hover:bg-[#152347] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors shadow-sm font-bold"
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
        )}

        {/* =========================================================================
            COLUMN 2 (RIGHT): THE "AUDIT PANEL"
            Showing:
            a. The Plan generated
            b. The Neo4j sub-graph nodes visited (with green checkmarks)
            c. The vector text snippet retrieved
            d. The Verifier's check status (Pass: 2 records matched, Flag: Discontinuation not documented in Note #4)
            ========================================================================= */}
        {showAudit && (
          <div className={`${
            viewMode === 'split' ? 'lg:col-span-5 xl:col-span-5' : 'w-full'
          } flex flex-col h-full bg-white dark:bg-[#0a0a0c] border-2 border-[#bfdbfe] dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg`}>
            {/* Audit Panel Header */}
            <div className="px-5 py-3 border-b-2 border-[#bfdbfe] dark:border-zinc-800/80 bg-[#eff6ff] dark:bg-zinc-950/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
                <span className="text-xs font-black text-[#0f172a] dark:text-white tracking-tight uppercase font-['Outfit']">Audit Panel</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-zinc-900 text-[#1e3a8a] dark:text-zinc-300 border border-[#bfdbfe] dark:border-zinc-750 font-bold">
                  Agentic Provenance
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-zinc-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Audit Active</span>
              </div>
            </div>

            {/* Audit Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fbfdff] dark:bg-transparent">
              {activeAuditResponse ? (
                <>
                  {/* -------------------------------------------------------------
                      SECTION A: The Plan Generated
                      ------------------------------------------------------------- */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          a. The Plan Generated
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-zinc-400">
                        Step-by-Step
                      </span>
                    </div>

                    {activeAuditResponse.plan ? (
                      <div className="space-y-2.5">
                        {/* Intent */}
                        <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-850">
                          <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tight">
                            Intent Objective:
                          </div>
                          <p className="text-xs text-white font-medium mt-0.5">
                            {activeAuditResponse.plan.intent}
                          </p>
                        </div>

                        {/* Planned Steps */}
                        {activeAuditResponse.plan.planned_steps && activeAuditResponse.plan.planned_steps.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">
                              Execution Steps:
                            </span>
                            {activeAuditResponse.plan.planned_steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-[11px] text-zinc-200 bg-zinc-900/60 p-2 rounded border border-zinc-850/80"
                              >
                                <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-mono text-[9px] font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="leading-snug">{step}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Identified Entities Chips */}
                        {activeAuditResponse.plan.identified_entities && (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {Object.entries(activeAuditResponse.plan.identified_entities).flatMap(([cat, list]) =>
                              (list || []).map((ent, i) => (
                                <span
                                  key={`${cat}-${i}`}
                                  className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800"
                                >
                                  <strong className="text-zinc-400 font-semibold">{cat}:</strong> {ent}
                                </span>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 italic py-1">
                        Plan steps generated across Neo4j graph & vector endpoints.
                      </div>
                    )}
                  </div>

                  {/* -------------------------------------------------------------
                      SECTION B: Neo4j Sub-Graph Nodes Visited (with green checkmarks)
                      ------------------------------------------------------------- */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          b. Neo4j Sub-Graph Nodes Visited
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 border border-emerald-900/40">
                        {activeAuditResponse.visited_nodes?.length || 0} Nodes Visited
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {activeAuditResponse.visited_nodes && activeAuditResponse.visited_nodes.length > 0 ? (
                        activeAuditResponse.visited_nodes.map((node, nIdx) => (
                          <div
                            key={nIdx}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-900/70 border border-zinc-850 text-xs hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Prominent Green Checkmark */}
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="min-w-0 truncate">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold mr-1.5">
                                  {node.label}
                                </span>
                                <span className="text-zinc-100 font-medium text-[11px] truncate">
                                  {node.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {node.relationship && (
                                <span className="text-[9px] font-mono text-zinc-400 px-1 rounded bg-zinc-950 border border-zinc-850">
                                  {node.relationship}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-white font-bold px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                                {node.id}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-zinc-400 italic py-1">
                          No graph nodes recorded for this turn.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* -------------------------------------------------------------
                      SECTION C: The Vector Text Snippet Retrieved
                      ------------------------------------------------------------- */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-855 pb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          c. Vector Text Snippet Retrieved
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-zinc-400">
                        Semantic Search
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {activeAuditResponse.vector_snippets && activeAuditResponse.vector_snippets.length > 0 ? (
                        activeAuditResponse.vector_snippets.map((snip, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-zinc-900/80 border border-zinc-850 rounded-lg p-2.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-200 font-bold">{snip.note_title || 'Clinical Note'}</span>
                                {snip.timestamp && (
                                  <span className="text-zinc-400">
                                    • {snip.timestamp.split('T')[0]}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {snip.score && (
                                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-300 font-mono text-[9px] border border-zinc-700">
                                    Cosine: {snip.score}
                                  </span>
                                )}
                                <button
                                  onClick={() => onOpenEvidence(snip.record_id)}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[10px] font-bold border border-zinc-700 transition-colors"
                                  title="Inspect original record"
                                >
                                  [{snip.record_id}]
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-zinc-300 italic font-medium leading-relaxed bg-zinc-950/70 p-2 rounded border border-zinc-900">
                              "{snip.snippet}"
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-zinc-400 italic py-1">
                          No vector snippets retrieved for this query.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* -------------------------------------------------------------
                      SECTION D: The Verifier's Check Status
                      (Pass: 2 records matched, Flag: Discontinuation not documented in Note #4)
                      ------------------------------------------------------------- */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          d. Verifier's Check Status
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700">
                        Provenance Audit
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeAuditResponse.verifier_checks && activeAuditResponse.verifier_checks.length > 0 ? (
                        activeAuditResponse.verifier_checks.map((chk, kIdx) => {
                          const isPass = chk.status === 'PASS';
                          return (
                            <div
                              key={kIdx}
                              className={`p-3 rounded-lg border space-y-1.5 ${
                                isPass
                                  ? 'bg-zinc-900/60 border-zinc-800'
                                  : 'bg-zinc-900/80 border-amber-900/50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-tight ${
                                    isPass
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/70'
                                      : 'bg-amber-950/80 text-amber-300 border border-amber-600/70'
                                  }`}
                                >
                                  {isPass ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  )}
                                  {chk.badge_text}
                                </span>

                                {chk.matched_records && chk.matched_records.length > 0 && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    {chk.matched_records.map((rId, rIdx) => (
                                      <button
                                        key={rIdx}
                                        onClick={() => onOpenEvidence(rId)}
                                        className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[10px] font-bold border border-zinc-700 transition-colors"
                                      >
                                        [{rId}]
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="text-xs text-white font-semibold">
                                {chk.claim}
                              </div>

                              {chk.details && (
                                <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                                  {chk.details}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-zinc-400 italic py-1">
                          No verifier checks recorded for this turn.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Standby State when no investigation question has been asked yet */
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-zinc-400">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-inner">
                    <ShieldCheck className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Audit Panel Standby
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ask a question or select a prompt on the left to inspect the LangGraph agent's:
                    </p>
                  </div>

                  <div className="w-full max-w-xs space-y-2 text-left font-mono text-[11px]">
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-850 flex items-center gap-2 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <strong>a. The Plan generated</strong>
                    </div>
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-850 flex items-center gap-2 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <strong>b. Neo4j visited nodes (with green checks)</strong>
                    </div>
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-850 flex items-center gap-2 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <strong>c. Vector text snippet retrieved</strong>
                    </div>
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-850 flex items-center gap-2 text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <strong>d. Verifier's check status (Pass/Flag)</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
