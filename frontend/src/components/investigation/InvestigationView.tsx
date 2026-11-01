import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Activity,
  Plus,
  Search,
  Share2,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Shield,
  FileText,
  Database,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
  User,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  UploadCloud,
  Languages,
} from 'lucide-react';
import {
  Patient,
  InvestigationResponse,
  InvestigationClaim,
} from '../../types';
import { runInvestigation, transcribeAudio, synthesizeSpeech } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  text?: string;
  response?: InvestigationResponse;
  isLoading?: boolean;
  audioData?: string;
}

interface SavedSession {
  id: string;
  title: string;
  date: string;
  messageCount: number;
  initialQuestion?: string;
}

interface InvestigationViewProps {
  patient: Patient;
  onOpenEvidence: (recordId: string) => void;
  initialQuestion?: string;
}

const renderInlineTokens = (content: string) => {
  const parts = content.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold text-[#173F43] tracking-normal">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

const renderFormattedText = (rawText: string) => {
  if (!rawText) return null;
  const paragraphs = rawText.split(/\n\s*\n/);

  return (
    <div className="space-y-3 text-[#173F43] text-xs font-sans leading-relaxed">
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
                    <div key={lIdx} className="font-bold text-[#173F43] text-xs pt-1">
                      {renderInlineTokens(content)}
                    </div>
                  );
                }

                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2 text-[#657C78]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4FA58D] mt-1.5 shrink-0" />
                    <span className="leading-relaxed text-[#173F43]">{renderInlineTokens(content)}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed text-[#173F43]">
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQuestion || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>({});
  const [selectedResponse, setSelectedResponse] = useState<InvestigationResponse | null>(null);
  const [showParameters, setShowParameters] = useState(false);
  const [strictEvidenceMode, setStrictEvidenceMode] = useState(true);
  const [promptSearch, setPromptSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [copiedSession, setCopiedSession] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'sarvam' | 'nvidia'>('sarvam');
  const [selectedSpeaker, setSelectedSpeaker] = useState<'ishita_en_medical' | 'shubh_en_narration' | 'ritu_en_medical'>('ishita_en_medical');
  const [selectedLanguage, setSelectedLanguage] = useState<'en-IN' | 'unknown' | 'hi-IN' | 'ta-IN' | 'te-IN'>('en-IN');

  // Voice Interaction State (Sarvam Saaras & Bulbul)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionPreview, setTranscriptionPreview] = useState<{
    transcript: string;
    language_code: string;
  } | null>(null);

  // Audio Playback State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState<string | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string>(`INV-${patient.id}-${Date.now()}`);

  const samplePrompts = [
    {
      category: 'Medication Changes',
      tag: 'MED',
      title: 'Medication Regimen Modification',
      prompt: 'Why was the medication regimen modified?',
      desc: 'Investigate Lisinopril cessation, washout period, and Entresto initiation.',
    },
    {
      category: 'Biomarkers & Labs',
      tag: 'LAB',
      title: 'Potassium & Creatinine Trajectory',
      prompt: 'What is the trend in creatinine and potassium across admissions?',
      desc: 'Review hyperkalemia trajectory (5.7 mEq/L down to 4.6 mEq/L).',
    },
    {
      category: 'Contradiction Audit',
      tag: 'ALERT',
      title: 'Clinical Note Contradictions',
      prompt: 'Are there contradictions between triage and physician notes?',
      desc: 'Verify conflicting cough symptom documentation between cardiology & dermatology.',
    },
    {
      category: 'Hospital Transfer',
      tag: 'INTEROP',
      title: 'Cross-Hospital Transfer & Delta',
      prompt: 'What changed between admissions?',
      desc: 'Audit Apollo General Hospital inpatient care to Bengaluru City Medical Center follow-up.',
    },
    {
      category: 'Clinical Summary',
      tag: 'SUMMARY',
      title: 'Full Longitudinal Clinical Summary',
      prompt: 'Summarize the patient clinical history.',
      desc: 'Synthesize conditions, hospitalizations, active GDMT regimens, and risk factors.',
    },
  ];

  const sessions: SavedSession[] = [
    {
      id: `sess-${patient.id}-1`,
      title: `${patient.name} - Longitudinal Audit`,
      date: 'Today',
      messageCount: messages.length,
    },
    {
      id: `sess-${patient.id}-2`,
      title: 'Medication Reconciliation & Washout',
      date: 'Yesterday',
      messageCount: 3,
      initialQuestion: 'Why was the medication regimen modified?',
    },
    {
      id: `sess-${patient.id}-3`,
      title: 'Potassium Trajectory & Creatinine Delta',
      date: 'Oct 28',
      messageCount: 4,
      initialQuestion: 'What is the trend in creatinine and potassium across admissions?',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Reset thread when patient changes
  useEffect(() => {
    stopCurrentAudio();
    threadIdRef.current = `INV-${patient.id}-${Date.now()}`;
    setSelectedResponse(null);
    setMessages([]);
    setTranscriptionPreview(null);
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [patient.id]);

  const handleStartNewConsultation = () => {
    stopCurrentAudio();
    threadIdRef.current = `INV-${patient.id}-${Date.now()}`;
    setMessages([]);
    setSelectedResponse(null);
    setTranscriptionPreview(null);
    setInput('');
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isSubmitting) return;

    // Clear any active transcription preview
    setTranscriptionPreview(null);
    stopCurrentAudio();

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
                text: `Investigation query failed: ${err.message || 'Unable to connect to agent service.'}`,
              }
            : msg
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     VOICE INPUT: Sarvam Saaras v4 Recording & Transcribing
     ───────────────────────────────────────────────────────────── */
  const startRecording = async () => {
    try {
      stopCurrentAudio();
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioTranscription(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      alert('Unable to access microphone. Please verify browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const data = await transcribeAudio(blob, selectedLanguage);
      if (data.transcript && data.transcript.trim()) {
        setTranscriptionPreview({
          transcript: data.transcript,
          language_code: data.language_code || selectedLanguage,
        });
      } else {
        alert('No distinct speech recognized in audio. Please try speaking clearly or typing your clinical inquiry.');
      }
    } catch (err: any) {
      console.error('Transcription failed:', err);
      alert(`Voice recognition error: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleAudioTranscription(file);
    e.target.value = '';
  };

  /* ─────────────────────────────────────────────────────────────
     VOICE OUTPUT: Sarvam Bulbul v4 Flash Speech Synthesis & Playback
     ───────────────────────────────────────────────────────────── */
  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setPlayingMessageId(null);
    setIsAudioPaused(false);
  };

  const handlePlaySpeech = async (msgId: string, textToRead: string) => {
    // If currently playing this message, toggle pause/play
    if (playingMessageId === msgId && currentAudioRef.current) {
      if (isAudioPaused) {
        currentAudioRef.current.play();
        setIsAudioPaused(false);
      } else {
        currentAudioRef.current.pause();
        setIsAudioPaused(true);
      }
      return;
    }

    // Stop existing audio
    stopCurrentAudio();
    setIsAudioLoading(msgId);

    try {
      const result = await synthesizeSpeech(textToRead, 'en-IN', selectedSpeaker);
      if (result.audio) {
        const audioSrc = `data:audio/wav;base64,${result.audio}`;
        const audio = new Audio(audioSrc);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setPlayingMessageId(null);
          setIsAudioPaused(false);
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          stopCurrentAudio();
        };

        await audio.play();
        setPlayingMessageId(msgId);
        setIsAudioPaused(false);
      }
    } catch (err: any) {
      console.error('Text-to-speech synthesis error:', err);
      alert(`Voice output error: ${err.message}`);
    } finally {
      setIsAudioLoading(null);
    }
  };

  const handleCopyTranscript = () => {
    const transcript = messages
      .map((m) => `${m.sender === 'user' ? 'Clinician' : 'MedGraph Agent'}: ${m.text || m.response?.answer || ''}`)
      .join('\n\n');
    navigator.clipboard.writeText(transcript);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'SUPPORTED':
        return {
          bg: 'bg-[#F0FBF5]',
          border: 'border-[#8BD4A9]',
          text: 'text-[#1B4F3A]',
          icon: CheckCircle2,
          label: 'SUPPORTED',
        };
      case 'CONTRADICTED':
      case 'CONTRADICTORY':
        return {
          bg: 'bg-[#FFF3F2]',
          border: 'border-[#FDD9D5]',
          text: 'text-[#702D2D]',
          icon: AlertTriangle,
          label: 'CONTRADICTED',
        };
      case 'INSUFFICIENT':
      case 'MISSING_EVIDENCE':
        return {
          bg: 'bg-[#FFF9EA]',
          border: 'border-[#F5D47D]',
          text: 'text-[#674617]',
          icon: HelpCircle,
          label: 'INSUFFICIENT',
        };
      default:
        return {
          bg: 'bg-[#F7F9F5]',
          border: 'border-[#CAD8D1]',
          text: 'text-[#4C6865]',
          icon: Activity,
          label: 'NOT_FOUND',
        };
    }
  };

  const filteredPrompts = samplePrompts.filter(
    (p) =>
      p.title.toLowerCase().includes(promptSearch.toLowerCase()) ||
      p.prompt.toLowerCase().includes(promptSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(promptSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-[780px]">
      {/* Hidden file input for audio file upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg"
        className="hidden"
      />

      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR: Consultations & Session History
          ───────────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-64 xl:w-72 shrink-0 bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-4 shadow-xs flex flex-col justify-between">
        <div className="space-y-4">
          {/* Brand Emblem & New Consultation Button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#E6F4ED] border border-[#B5E4D3] flex items-center justify-center text-[#174F55]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="font-['Outfit'] font-black text-sm text-[#173F43] tracking-tight">
                  Medical Chat + Voice
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E6F4ED] text-[#174F55] font-bold">
                {patient.id}
              </span>
            </div>

            <button
              onClick={handleStartNewConsultation}
              className="w-full py-2.5 px-4 bg-[#173F43] hover:bg-[#205559] text-white rounded-2xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#8BD4A9] group-hover:rotate-90 transition-transform" />
              <span>New consultation</span>
            </button>
          </div>

          {/* Search Conversations Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#829590]" />
            <input
              type="text"
              placeholder="Search consultations..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FBFAF4] border border-[#E1EAE3] text-xs rounded-xl text-[#173F43] placeholder-[#A8B9B2] focus:outline-none focus:ring-1 focus:ring-[#91D5BE]"
            />
          </div>

          {/* Consultation History List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#829590]">
                Consultations
              </span>
              <span className="text-[10px] font-mono text-[#829590]">
                {sessions.length} recorded
              </span>
            </div>

            <div className="space-y-1">
              {sessions.map((sess, idx) => {
                const isActive = idx === 0 && messages.length > 0;
                return (
                  <button
                    key={sess.id}
                    onClick={() => {
                      if (sess.initialQuestion) {
                        handleSend(sess.initialQuestion);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-2xl border transition-all text-xs flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-[#E6F4ED] border-[#B5E4D3] text-[#174F55] font-semibold'
                        : 'bg-[#FBFAF4] hover:bg-[#F0F5F2] border-[#E1EAE3] text-[#173F43]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate text-xs font-medium group-hover:text-[#174F55]">
                        {sess.title}
                      </div>
                      <div className="text-[10px] text-[#829590] mt-0.5">
                        {sess.date} · {sess.messageCount} exchanges
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#829590] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Utility Card: User & Clinical AI Services */}
        <div className="pt-4 border-t border-[#E1EAE3] space-y-3">
          <div className="p-2.5 rounded-2xl bg-[#FBFAF4] border border-[#E1EAE3] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#173F43] text-white flex items-center justify-center font-bold text-xs">
                {patient.name.charAt(0)}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-[#173F43] truncate max-w-[130px]">
                  Dr. Clinician
                </div>
                <div className="text-[10px] text-[#829590] font-mono">
                  {patient.id} Verified
                </div>
              </div>
            </div>
            <button
              onClick={handleStartNewConsultation}
              title="Clear current consultation"
              className="p-1.5 rounded-xl hover:bg-[#E6F4ED] text-[#829590] hover:text-[#174F55] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 px-1 font-mono text-[10px]">
            <div className="flex items-center justify-between text-[#829590]">
              <span>Primary LLM:</span>
              <span className="font-bold text-[#4FA58D]">Sarvam-105B</span>
            </div>
            <div className="flex items-center justify-between text-[#829590]">
              <span>Voice Engine:</span>
              <span className="font-bold text-[#174F55]">Saaras v4 & Bulbul</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. CENTER COLUMN: Chat, Voice Interaction & Canvas
          ───────────────────────────────────────────────────────────── */}
      <section className="flex-1 bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-5 shadow-xs flex flex-col justify-between min-h-[780px]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E1EAE3] gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base sm:text-lg font-black text-[#173F43] tracking-tight font-['Outfit'] truncate">
              {messages.length > 0
                ? `${patient.name} Consultation`
                : 'Unified Clinical Chat & Voice'}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E6F4ED] text-[#174F55] border border-[#B5E4D3] text-[11px] font-medium font-mono shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4FA58D] animate-pulse" />
              <span>Sarvam AI Native (105B + Saaras + Bulbul)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyTranscript}
              disabled={messages.length === 0}
              className="p-2 rounded-xl bg-[#FBFAF4] hover:bg-[#E6F4ED] text-[#173F43] hover:text-[#174F55] border border-[#E1EAE3] transition-all disabled:opacity-40 cursor-pointer"
              title="Copy consultation transcript"
            >
              {copiedSession ? (
                <Check className="w-3.5 h-3.5 text-[#4FA58D]" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => setShowParameters((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                showParameters
                  ? 'bg-[#173F43] text-white border-[#173F43]'
                  : 'bg-[#FBFAF4] hover:bg-[#E6F4ED] text-[#173F43] border-[#E1EAE3]'
              }`}
              title="Toggle Clinical System Instructions & Parameters"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible System Instructions Accordion */}
        {showParameters && (
          <div className="my-3 p-4 rounded-2xl bg-[#FBFAF4] border border-[#E1EAE3] text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold text-[#829590]">
              <span>Sarvam AI & Clinical Graph Parameters</span>
              <span className="text-[#4FA58D]">Grounded LangGraph Pipeline</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-[#FFFEFB] border border-[#E1EAE3]">
                <div className="text-[#829590] text-[9px]">PRIMARY LLM</div>
                <div className="font-bold text-[#173F43]">Sarvam-105B (105B Params)</div>
              </div>
              <div className="p-2 rounded-xl bg-[#FFFEFB] border border-[#E1EAE3]">
                <div className="text-[#829590] text-[9px]">SPEECH TO TEXT</div>
                <div className="font-bold text-[#173F43]">Saaras:v4 (Indic/English)</div>
              </div>
              <div className="p-2 rounded-xl bg-[#FFFEFB] border border-[#E1EAE3]">
                <div className="text-[#829590] text-[9px]">TEXT TO SPEECH</div>
                <div className="font-bold text-[#4FA58D]">Bulbul:v4-flash (ishita_en_medical)</div>
              </div>
              <div className="p-2 rounded-xl bg-[#FFFEFB] border border-[#E1EAE3]">
                <div className="text-[#829590] text-[9px]">SECURITY SCOPE</div>
                <div className="font-bold text-[#173F43]">Server-Side Isolated (No Leaks)</div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Stream or Hero Welcome State */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-4">
          {messages.length === 0 ? (
            /* ─────────────────────────────────────────────────────────────
               Hero Empty State (Unified Chat + Voice Welcome)
               ───────────────────────────────────────────────────────────── */
            <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4 max-w-xl mx-auto space-y-6">
              {/* Emblem Logo */}
              <div className="w-16 h-16 rounded-3xl bg-[#E6F4ED] border border-[#91D5BE] flex items-center justify-center text-[#174F55] shadow-xs relative">
                <Sparkles className="w-8 h-8 text-[#4FA58D]" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#173F43] text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold text-[#4FA58D] uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Sarvam-105B Longitudinal Clinical Assistant</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#173F43] font-['Outfit'] tracking-tight">
                  How can I help you today?
                </h3>
                <p className="text-xs text-[#657C78] max-w-md mx-auto leading-relaxed">
                  Type or speak your clinical inquiries for <strong className="text-[#173F43]">{patient.name}</strong> ({patient.age}y {patient.gender[0]}, {patient.primaryDiagnosis}). Both chat and voice execute identical LangGraph multi-hop reasoning.
                </p>
              </div>

              {/* System Instructions Dropdown Pill */}
              <button
                onClick={() => setShowParameters((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FBFAF4] hover:bg-[#F0F5F2] border border-[#E1EAE3] text-xs text-[#173F43] transition-all cursor-pointer font-medium"
              >
                <Sliders className="w-3.5 h-3.5 text-[#4FA58D]" />
                <span>System Instructions & Models</span>
                {showParameters ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#829590]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#829590]" />
                )}
              </button>

              {/* Quick Suggestion Cards */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                {samplePrompts.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="p-3.5 rounded-2xl bg-[#FBFAF4] hover:bg-[#E6F4ED] border border-[#E1EAE3] hover:border-[#91D5BE] text-xs transition-all shadow-2xs group flex flex-col justify-between cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#173F43] group-hover:text-[#174F55]">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-[#829590] border border-[#E1EAE3]">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#657C78] line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#4FA58D] font-bold pt-2 opacity-80 group-hover:opacity-100">
                      <span>Investigate</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               Conversation Chat Stream
               ───────────────────────────────────────────────────────────── */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-4.5 space-y-3 text-xs shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-[#173F43] text-white rounded-tr-none'
                      : 'bg-[#FBFAF4] border border-[#E1EAE3] text-[#173F43] rounded-tl-none'
                  }`}
                >
                  {/* Sender Header */}
                  <div
                    className={`flex items-center justify-between gap-3 text-[10px] font-mono pb-1 border-b ${
                      msg.sender === 'user'
                        ? 'text-[#B5E4D3] border-white/15'
                        : 'text-[#829590] border-[#E1EAE3]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {msg.sender === 'user' ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-[#4FA58D]" />
                      )}
                      <span className="font-bold">
                        {msg.sender === 'user' ? 'Clinician Inquiry' : 'MedGraph Agent (Sarvam-105B)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Voice Output Button on Assistant Response */}
                      {msg.sender === 'agent' && !msg.isLoading && (msg.text || msg.response?.answer) && (
                        <button
                          onClick={() =>
                            handlePlaySpeech(
                              msg.id,
                              msg.response?.answer || msg.text || ''
                            )
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-mono text-[9px] font-bold transition-all cursor-pointer ${
                            playingMessageId === msg.id
                              ? 'bg-[#173F43] text-white border-[#173F43]'
                              : 'bg-white hover:bg-[#E6F4ED] text-[#174F55] border-[#B5E4D3]'
                          }`}
                          title="Listen to clinical answer via Sarvam Bulbul v4 Flash"
                        >
                          {isAudioLoading === msg.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-[#4FA58D]" />
                          ) : playingMessageId === msg.id ? (
                            isAudioPaused ? (
                              <>
                                <Play className="w-3 h-3 text-[#8BD4A9]" />
                                <span>Resume</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 text-[#8BD4A9]" />
                                <span>Pause</span>
                              </>
                            )
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-[#4FA58D]" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Stop audio button if currently playing */}
                      {playingMessageId === msg.id && (
                        <button
                          onClick={stopCurrentAudio}
                          className="p-1 rounded-md bg-[#FFF3F2] border border-[#FDD9D5] text-[#D95C55] hover:bg-[#FDD9D5] cursor-pointer"
                          title="Stop audio playback"
                        >
                          <Square className="w-2.5 h-2.5" />
                        </button>
                      )}

                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* Loading Spinner */}
                  {msg.isLoading && (
                    <div className="py-4 flex items-center gap-3 text-xs font-mono text-[#4FA58D]">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Traversing knowledge graph & reasoning with Sarvam-105B...</span>
                    </div>
                  )}

                  {/* Active Speech Animation Pill if Playing */}
                  {playingMessageId === msg.id && (
                    <div className="p-2 rounded-xl bg-[#E6F4ED] border border-[#8BD4A9] flex items-center justify-between text-[11px] font-mono text-[#174F55]">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-[#4FA58D] animate-pulse" />
                        <span className="font-bold">
                          {isAudioPaused ? 'Audio Paused' : 'Playing spoken report (Bulbul v4 Flash - ishita_en_medical)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#4FA58D]">Sarvam AI TTS</span>
                    </div>
                  )}

                  {/* Plain Text Message */}
                  {msg.text && !msg.isLoading && renderFormattedText(msg.text)}

                  {/* Structured Investigation Response */}
                  {msg.response && (
                    <div className="space-y-4 pt-1">
                      {/* Direct Clinical Answer */}
                      <div className="text-[#173F43] leading-relaxed text-xs">
                        {renderFormattedText(msg.response.answer)}
                      </div>

                      {/* Key Findings List */}
                      {msg.response.key_findings && msg.response.key_findings.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#E1EAE3]">
                          <div className="font-bold text-[#174F55] text-xs font-mono uppercase tracking-wider flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#4FA58D]" />
                              <span>Key Clinical Findings:</span>
                            </div>
                            <button
                              onClick={() =>
                                handlePlaySpeech(
                                  `${msg.id}-findings`,
                                  msg.response?.key_findings?.join('. ') || ''
                                )
                              }
                              className="text-[10px] text-[#4FA58D] hover:text-[#174F55] underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Listen to findings</span>
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {msg.response.key_findings.map((f, i) => (
                              <div key={i} className="flex items-start gap-2 text-[#173F43]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4FA58D] mt-1.5 shrink-0" />
                                <span className="leading-snug">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contradictions Alert */}
                      {msg.response.contradictions_found && msg.response.contradictions_found.length > 0 && (
                        <div className="p-3 rounded-2xl bg-[#FFF3F2] border border-[#FDD9D5] text-[#702D2D] space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#D95C55]" />
                            <span>Documented Discrepancies Identified:</span>
                          </div>
                          {msg.response.contradictions_found.map((c, i) => (
                            <div key={i} className="text-[11px] leading-snug pl-5">
                              • {c}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Missing Documentation Alert */}
                      {msg.response.missing_information && msg.response.missing_information.length > 0 && (
                        <div className="p-3 rounded-2xl bg-[#FFF9EA] border border-[#F5D47D] text-[#674617] space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <HelpCircle className="w-3.5 h-3.5 text-[#D99E32]" />
                            <span>Missing Documentation:</span>
                          </div>
                          {msg.response.missing_information.map((m, i) => (
                            <div key={i} className="text-[11px] leading-snug pl-5">
                              • {m}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Atomic Verified Claims Accordion */}
                      {msg.response.claims && msg.response.claims.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#E1EAE3]">
                          <div className="font-bold text-[#173F43] text-xs font-mono uppercase tracking-wider flex items-center justify-between">
                            <span>Verified Claims & Evidence Trail ({msg.response.claims.length}):</span>
                            <span className="text-[10px] text-[#4FA58D] font-bold">Immutable EHR Grounding</span>
                          </div>
                          <div className="space-y-2">
                            {msg.response.claims.map((claimItem, cIdx) => {
                              const badge = getVerificationBadge(claimItem.status);
                              const IconComponent = badge.icon;
                              const isExpanded = expandedClaims[`${msg.id}-${cIdx}`];

                              return (
                                <div
                                  key={cIdx}
                                  className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-2xl p-3 space-y-2 text-xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 shrink-0 ${badge.bg} ${badge.border} ${badge.text}`}
                                      >
                                        <IconComponent className="w-3 h-3" />
                                        <span>{badge.label}</span>
                                      </span>
                                      <span className="font-semibold text-[#173F43] leading-snug">
                                        {claimItem.claim}
                                      </span>
                                    </div>

                                    {claimItem.evidence && claimItem.evidence.length > 0 && (
                                      <button
                                        onClick={() =>
                                          setExpandedClaims((prev) => ({
                                            ...prev,
                                            [`${msg.id}-${cIdx}`]: !prev[`${msg.id}-${cIdx}`],
                                          }))
                                        }
                                        className="text-[#829590] hover:text-[#173F43] p-0.5 cursor-pointer"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  {/* Evidence Dropdown */}
                                  {isExpanded && claimItem.evidence && (
                                    <div className="pt-2 border-t border-[#EEF3EE] space-y-2">
                                      {claimItem.evidence.map((ev, evIdx) => (
                                        <div
                                          key={evIdx}
                                          className="p-2.5 rounded-xl bg-[#FBFAF4] border border-[#E1EAE3] text-[11px] font-mono space-y-1"
                                        >
                                          <div className="flex items-center justify-between text-[#287B80]">
                                            <span className="font-bold">Record: {ev.record_id}</span>
                                            <button
                                              onClick={() => onOpenEvidence(ev.record_id)}
                                              className="underline font-bold text-[#4FA58D] hover:text-[#174F55] flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>Inspect Source</span>
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                          {ev.quote && (
                                            <div className="text-[#657C78] italic font-sans">
                                              "{ev.quote}"
                                            </div>
                                          )}
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
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TRANSCRIPTION CONFIRMATION & EDITING BANNER
            ───────────────────────────────────────────────────────────── */}
        {transcriptionPreview && (
          <div className="mb-2 p-3.5 rounded-2xl bg-[#E6F4ED] border border-[#8BD4A9] shadow-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#174F55]" />
                <span className="font-bold text-xs text-[#174F55]">
                  Voice Transcribed via Sarvam Saaras v4
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#174F55] border border-[#B5E4D3]">
                  {transcriptionPreview.language_code}
                </span>
              </div>
              <span className="text-[10px] text-[#657C78]">
                Review or edit before submitting
              </span>
            </div>

            <textarea
              value={transcriptionPreview.transcript}
              onChange={(e) =>
                setTranscriptionPreview({
                  ...transcriptionPreview,
                  transcript: e.target.value,
                })
              }
              rows={2}
              className="w-full bg-white border border-[#B5E4D3] text-xs p-2.5 rounded-xl text-[#173F43] focus:outline-none focus:ring-1 focus:ring-[#4FA58D]"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTranscriptionPreview(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#829590] hover:text-[#173F43] hover:bg-white/60 transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => handleSend(transcriptionPreview.transcript)}
                className="px-4 py-1.5 rounded-xl bg-[#173F43] hover:bg-[#205559] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-[#8BD4A9]" />
                <span>Confirm & Investigate</span>
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            ACTIVE RECORDING INDICATOR
            ───────────────────────────────────────────────────────────── */}
        {isRecording && (
          <div className="mb-2 p-3 rounded-2xl bg-[#FFF3F2] border border-[#FDD9D5] flex items-center justify-between shadow-xs animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#D95C55] animate-ping" />
              <div className="leading-tight">
                <div className="text-xs font-bold text-[#702D2D]">
                  Listening via Microphone...
                </div>
                <div className="text-[10px] font-mono text-[#D95C55]">
                  Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-3 py-1 text-xs text-[#702D2D] hover:bg-white/60 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-1.5 bg-[#D95C55] hover:bg-[#C24D47] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Square className="w-3 h-3" />
                <span>Stop & Transcribe</span>
              </button>
            </div>
          </div>
        )}

        {/* Transcribing loading banner */}
        {isTranscribing && (
          <div className="mb-2 p-3 rounded-2xl bg-[#E6F4ED] border border-[#B5E4D3] flex items-center gap-3 text-xs font-mono text-[#174F55]">
            <Loader2 className="w-4 h-4 animate-spin text-[#4FA58D]" />
            <span>Transcribing audio through Sarvam Saaras v4 speech recognition...</span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            Bottom Floating Input Dock (Text + Voice Combined)
            ───────────────────────────────────────────────────────────── */}
        <div className="pt-2 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#FBFAF4] border border-[#E1EAE3] rounded-3xl shadow-xs space-y-2 focus-within:border-[#91D5BE] focus-within:ring-2 focus-within:ring-[#91D5BE]/20 transition-all"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a clinical question, paste a chart excerpt, or speak your inquiry..."
              disabled={isSubmitting || isRecording || isTranscribing}
              rows={2}
              className="w-full bg-transparent border-0 resize-none text-xs text-[#173F43] placeholder-[#A8B9B2] focus:outline-none focus:ring-0 leading-relaxed px-1"
            />

            {/* Dock Action Bar: Voice Controls + Mode + Send */}
            <div className="flex items-center justify-between pt-1 border-t border-[#E1EAE3]">
              {/* Left: Mode toggle & Audio language */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStrictEvidenceMode((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    strictEvidenceMode
                      ? 'bg-[#E6F4ED] text-[#174F55] border border-[#91D5BE]'
                      : 'bg-[#F0F5F2] text-[#829590] border border-[#CAD8D1]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4FA58D]" />
                  <span>{strictEvidenceMode ? 'Evidence: ON' : 'Evidence: OFF'}</span>
                </button>

                {/* Voice Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload audio memo (.wav, .mp3, .m4a)"
                  disabled={isRecording || isTranscribing}
                  className="p-1.5 rounded-xl bg-[#FFFEFB] hover:bg-[#E6F4ED] text-[#657C78] hover:text-[#174F55] border border-[#E1EAE3] transition-all cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right: Microphone Button + Send Button */}
              <div className="flex items-center gap-2">
                {/* Unified Microphone Button */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing || isSubmitting}
                  className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    isRecording
                      ? 'bg-[#D95C55] text-white shadow-xs animate-pulse'
                      : 'bg-[#FFFEFB] hover:bg-[#E6F4ED] text-[#173F43] hover:text-[#174F55] border border-[#E1EAE3]'
                  }`}
                  title={isRecording ? 'Stop voice recording' : 'Speak clinical question (Sarvam Saaras v4)'}
                >
                  <Mic className={`w-4 h-4 ${isRecording ? 'text-white' : 'text-[#4FA58D]'}`} />
                  <span className="hidden sm:inline text-[11px]">
                    {isRecording ? 'Stop' : 'Voice'}
                  </span>
                </button>

                <span className="hidden sm:inline-block text-[10px] font-mono text-[#829590]">
                  ↵ to send
                </span>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!input.trim() || isSubmitting || isRecording}
                  className="px-4 py-2 bg-[#173F43] hover:bg-[#205559] disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3 text-[#8BD4A9]" />
                </button>
              </div>
            </div>
          </form>

          {/* Legal Clinical Disclaimer */}
          <p className="text-center text-[10px] text-[#829590] font-sans">
            MedGraph is a clinical decision-support tool. Both chat and voice execute immutable hospital record verification.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. RIGHT SIDEBAR: Prompt Library & Model / Pipeline Controls
          ───────────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
        {/* PROMPT LIBRARY CARD */}
        <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1EAE3]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#4FA58D]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#173F43]">
                Prompt Library
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#829590]">
              {filteredPrompts.length} templates
            </span>
          </div>

          {/* Search Prompts */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#829590]" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={promptSearch}
              onChange={(e) => setPromptSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FBFAF4] border border-[#E1EAE3] text-xs rounded-xl text-[#173F43] placeholder-[#A8B9B2] focus:outline-none focus:ring-1 focus:ring-[#91D5BE]"
            />
          </div>

          {/* Prompt List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {filteredPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                disabled={isSubmitting || isRecording}
                className="w-full text-left p-2.5 rounded-2xl bg-[#FBFAF4] hover:bg-[#E6F4ED] border border-[#E1EAE3] hover:border-[#91D5BE] transition-all text-xs space-y-1 group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#173F43] group-hover:text-[#174F55]">
                    {p.title}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E6F4ED] text-[#174F55] font-bold">
                    {p.tag}
                  </span>
                </div>
                <p className="text-[11px] text-[#657C78] line-clamp-2 leading-relaxed">
                  "{p.prompt}"
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* LANGGRAPH PIPELINE AUDIT CARD */}
        <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1EAE3]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4FA58D]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#173F43]">
                LangGraph Pipeline
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#4FA58D] font-bold">
              {isSubmitting ? 'Running' : selectedResponse ? 'Completed' : 'Ready'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              { stage: '1. Fast Entity & Temporal Planning' },
              { stage: '2. Parallel Graph & Vector Retrieval' },
              { stage: '3. Cross-Hospital Evidence Merger' },
              { stage: '4. Temporal Trajectory Reasoning' },
              { stage: '5. Atomic Claim Verification' },
              { stage: '6. Sarvam-105B Clinical Synthesis' },
            ].map((s, idx) => {
              const status = isSubmitting
                ? idx <= 2
                  ? 'Running...'
                  : 'Pending'
                : selectedResponse
                ? 'Completed'
                : 'Ready';

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FBFAF4] border border-[#E1EAE3]"
                >
                  <span className="font-medium text-[#173F43] text-[11px]">{s.stage}</span>
                  <span
                    className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded ${
                      status === 'Completed'
                        ? 'bg-[#E6F4ED] text-[#1B4F3A] border border-[#8BD4A9]'
                        : status === 'Running...'
                        ? 'bg-[#FFF9EA] text-[#674617] border border-[#F5D47D] animate-pulse'
                        : 'bg-[#F7F9F5] text-[#829590]'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SARVAM AI MODELS & VOICE CONTROLS */}
        <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-4 shadow-xs space-y-3">
          {/* Select Model */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-[#829590] tracking-wider">
              <span>Primary LLM</span>
              <span className="text-[#4FA58D]">Active</span>
            </div>
            <div className="w-full p-2.5 rounded-2xl bg-[#173F43] text-white text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#8BD4A9]" />
                <span>Sarvam-105B (Indic Flagship)</span>
              </div>
              <Check className="w-3.5 h-3.5 text-[#8BD4A9]" />
            </div>
          </div>

          {/* Clinical TTS Voice Selection */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-[#829590] tracking-wider">
              <span>Clinical Speech Voice</span>
              <span className="text-[#174F55]">Bulbul v4</span>
            </div>
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-[#FBFAF4] border border-[#E1EAE3] text-xs font-semibold text-[#173F43] focus:outline-none focus:ring-1 focus:ring-[#91D5BE] cursor-pointer"
            >
              <option value="ishita_en_medical">Ishita (Medical Specialist - en)</option>
              <option value="ritu_en_medical">Ritu (Clinical Assistant - en)</option>
              <option value="shubh_en_narration">Shubh (Authoritative Narrator - en)</option>
            </select>
          </div>
        </div>
      </aside>
    </div>
  );
};
