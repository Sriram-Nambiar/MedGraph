import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Activity,
  RotateCcw,
  Sparkles,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Zap,
  Maximize2,
  Info,
} from 'lucide-react';
import { VoxelHeartbeatCanvas } from './VoxelHeartbeatCanvas';

interface VoxelHeartbeatStudioProps {
  onNavigateToPatient?: (patientId: string) => void;
  className?: string;
}

export const VoxelHeartbeatStudio: React.FC<VoxelHeartbeatStudioProps> = ({
  onNavigateToPatient,
  className = '',
}) => {
  const [bpm, setBpm] = useState<number>(75);
  const [rhythm, setRhythm] = useState<'normal' | 'arrhythmia' | 'tachycardia' | 'bradycardia'>('normal');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [lastBeatTime, setLastBeatTime] = useState<number>(Date.now());
  const [isBeating, setIsBeating] = useState<boolean>(false);
  const [cameraResetKey, setCameraResetKey] = useState<number>(0);

  // Real-time animated ECG strip canvas
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const ecgHistoryRef = useRef<number[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Preset clinical cardiac profiles
  const PRESETS = [
    {
      name: 'Normal Sinus',
      label: 'Healthy Baseline',
      bpm: 72,
      rhythm: 'normal' as const,
      color: 'emerald',
      ef: '62%',
      co: '5.2 L/min',
    },
    {
      name: 'Lakshmi Sundaram (P001)',
      label: 'HFrEF & Renal Decline',
      bpm: 88,
      rhythm: 'normal' as const,
      color: 'amber',
      ef: '28% (Severely Reduced)',
      co: '3.1 L/min',
    },
    {
      name: 'Atrial Arrhythmia',
      label: 'Fibrillatory Wave',
      bpm: 104,
      rhythm: 'arrhythmia' as const,
      color: 'rose',
      ef: '44% (Impaired)',
      co: '3.8 L/min',
    },
    {
      name: 'Severe Tachycardia',
      label: 'Amiodarone Thyrotoxicosis',
      bpm: 126,
      rhythm: 'tachycardia' as const,
      color: 'purple',
      ef: '50%',
      co: '6.4 L/min',
    },
  ];

  // Callback when voxel heart triggers peak contraction
  const handlePeakBeat = () => {
    setIsBeating(true);
    setLastBeatTime(Date.now());
    setTimeout(() => setIsBeating(false), 220);
  };

  // Continuous real-time ECG oscilloscope sweep
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sweepX = 0;
    const totalPoints = 280;
    ecgHistoryRef.current = new Array(totalPoints).fill(0);

    const periodSeconds = 60.0 / bpm;
    const startTime = performance.now();

    const drawEcg = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000.0;
      const cyclePhase = (elapsed / periodSeconds) % 1.0;

      // Compute ECG voltage based on cardiac phase
      let v = 0;
      if (rhythm === 'arrhythmia') {
        const jitter = Math.sin(cyclePhase * Math.PI * 14) * 0.12;
        if (cyclePhase < 0.12) v = 0.25 * Math.sin((cyclePhase / 0.12) * Math.PI) + jitter;
        else if (cyclePhase >= 0.18 && cyclePhase < 0.21) v = -0.3;
        else if (cyclePhase >= 0.21 && cyclePhase < 0.25) v = 1.35; // R peak
        else if (cyclePhase >= 0.25 && cyclePhase < 0.28) v = -0.45; // S dip
        else if (cyclePhase >= 0.35 && cyclePhase < 0.50) v = 0.38 * Math.sin(((cyclePhase - 0.35) / 0.15) * Math.PI);
        else v = jitter;
      } else {
        // Standard P-Q-R-S-T complex
        if (cyclePhase >= 0.04 && cyclePhase < 0.12) {
          // P wave (Atrial Depolarization)
          v = 0.22 * Math.sin(((cyclePhase - 0.04) / 0.08) * Math.PI);
        } else if (cyclePhase >= 0.16 && cyclePhase < 0.18) {
          // Q dip
          v = -0.22 * Math.sin(((cyclePhase - 0.16) / 0.02) * Math.PI);
        } else if (cyclePhase >= 0.18 && cyclePhase < 0.22) {
          // R sharp spike (Ventricular Depolarization)
          const rP = (cyclePhase - 0.18) / 0.04;
          v = rP < 0.5 ? rP * 2 * 1.5 : (1.0 - rP) * 2 * 1.5;
        } else if (cyclePhase >= 0.22 && cyclePhase < 0.25) {
          // S dip
          v = -0.38 * Math.sin(((cyclePhase - 0.22) / 0.03) * Math.PI);
        } else if (cyclePhase >= 0.34 && cyclePhase < 0.48) {
          // T wave (Ventricular Repolarization)
          v = 0.32 * Math.sin(((cyclePhase - 0.34) / 0.14) * Math.PI);
        } else {
          v = 0.0;
        }
      }

      // Append to rolling history
      ecgHistoryRef.current[sweepX] = v;
      sweepX = (sweepX + 1) % totalPoints;

      // Render ECG strip
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 16;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG wave line
      const baselineY = height * 0.55;
      const amplitudeScale = height * 0.38;

      ctx.beginPath();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;

      const stepX = width / totalPoints;
      for (let i = 0; i < totalPoints; i++) {
        // Leave a blank gap at sweep head
        if (Math.abs(i - sweepX) < 8) continue;

        const val = ecgHistoryRef.current[i] || 0;
        const px = i * stepX;
        const py = baselineY - val * amplitudeScale;

        if (i === 0 || Math.abs(i - sweepX) === 8) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Glowing sweep cursor
      const cursorX = sweepX * stepX;
      ctx.fillStyle = '#ff6b81';
      ctx.beginPath();
      ctx.arc(cursorX, baselineY - (ecgHistoryRef.current[sweepX] || 0) * amplitudeScale, 3.5, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(drawEcg);
    };

    animFrameRef.current = requestAnimationFrame(drawEcg);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [bpm, rhythm]);

  const rrIntervalMs = Math.round(60000 / bpm);

  return (
    <div
      id="voxel-heartbeat-studio"
      className={`relative rounded-3xl bg-[#090b14] border border-red-900/30 shadow-[0_25px_70px_-15px_rgba(239,68,68,0.2)] overflow-hidden text-white ${className}`}
    >
      {/* Ambient background glow matching Hesam Sanei's Dribbble shot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[130px] pointer-events-none -z-0" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-0" />

      {/* Header Bar */}
      <div className="relative z-10 px-6 sm:px-8 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md bg-black/30">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isBeating
                ? 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.9)] scale-110'
                : 'bg-red-950/80 text-red-400 border border-red-500/30'
            }`}
          >
            <Heart className={`w-5 h-5 fill-current transition-transform ${isBeating ? 'scale-125' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight uppercase font-['Outfit'] text-white">
                Interactive 3D Voxel Heartbeat
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                Live 60 FPS WebGL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Voxel Heart inspired by Hesam Sanei • Physiological Dual-Pulse Cardiac Wave
            </p>
          </div>
        </div>

        {/* Live Telemetry Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 font-mono text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-slate-300">RATE:</span>
            <span className="text-red-400 font-bold text-sm">{bpm} BPM</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">R-R:</span>
            <span className="text-emerald-400 font-bold">{rrIntervalMs}ms</span>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              autoRotate
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle Continuous 3D Orbit Rotation"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoRotate ? 'Auto-Orbit On' : 'Orbit Paused'}</span>
          </button>

          <button
            onClick={() => setCameraResetKey((k) => k + 1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Reset 3D Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Body: 3D Canvas + Telemetry Sidebar */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: 3D Voxel Heart WebGL Canvas (Hesam Sanei Voxel Art) */}
        <div className="lg:col-span-8 relative min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] bg-gradient-to-b from-[#0a0c16] via-[#07080f] to-[#04050a] flex items-center justify-center overflow-hidden">
          {/* Subtle 3D Interaction Badge */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-mono text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Drag to rotate • Scroll to zoom</span>
          </div>

          {/* Voxel Heart 3D Three.js Component */}
          <VoxelHeartbeatCanvas
            key={cameraResetKey}
            compact={false}
            bpm={bpm}
            rhythm={rhythm}
            autoRotate={autoRotate}
            interactive={true}
            onBeat={handlePeakBeat}
            className="w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[520px]"
          />

          {/* Real-time Oscilloscope ECG Strip Overlay across bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-6">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1 px-1">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>LEAD II • SYNCHRONIZED CARDIAC VECTOR</span>
              </div>
              <span className="text-slate-400">25 mm/s • 10 mm/mV</span>
            </div>
            <div className="relative h-16 w-full rounded-xl bg-black/60 border border-red-950/60 overflow-hidden shadow-inner">
              <canvas
                ref={ecgCanvasRef}
                width={800}
                height={64}
                className="w-full h-full block"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Controls & Patient Preset Panel */}
        <div className="lg:col-span-4 p-5 sm:p-6 bg-[#0c0f1c] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between space-y-5">
          {/* Section 1: Clinical Case Presets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                Clinical Patient Scenarios
              </span>
              <Info className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="space-y-2">
              {PRESETS.map((p) => {
                const isSelected = bpm === p.bpm && rhythm === p.rhythm;
                return (
                  <button
                    key={p.name}
                    onClick={() => {
                      setBpm(p.bpm);
                      setRhythm(p.rhythm);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-red-500/15 border-red-500/60 text-white shadow-sm ring-1 ring-red-500/50'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>{p.name}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-red-400">{p.bpm} BPM</div>
                      <div className="text-[10px] text-slate-400 font-mono">EF: {p.ef.split(' ')[0]}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Interactive Heart Rate & Rhythm Sliders */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Custom Heart Rate</span>
                <span className="font-mono font-bold text-red-400">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min={40}
                max={150}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>40 Bradycardia</span>
                <span>75 Normal</span>
                <span>150 Tachycardia</span>
              </div>
            </div>

            {/* Rhythm Selector Buttons */}
            <div>
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5">
                Conduction Rhythm
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setRhythm('normal')}
                  className={`py-1.5 px-2.5 rounded-lg font-medium border text-center transition-all ${
                    rhythm === 'normal'
                      ? 'bg-red-500 text-white border-red-400 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  Sinus Rhythm
                </button>
                <button
                  onClick={() => setRhythm('arrhythmia')}
                  className={`py-1.5 px-2.5 rounded-lg font-medium border text-center transition-all ${
                    rhythm === 'arrhythmia'
                      ? 'bg-rose-600 text-white border-rose-400 font-bold shadow-xs'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  Arrhythmia
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Longitudinal Case Link */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border border-red-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-red-300 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Linked Clinical Investigation</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Lakshmi Sundaram's systolic heart failure (P001) maps Lisinopril to Sacubitril/Valsartan conversion with longitudinal ejection fraction shifts.
            </p>
            <button
              onClick={() => onNavigateToPatient?.('P001')}
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <span>Investigate Case P001</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
