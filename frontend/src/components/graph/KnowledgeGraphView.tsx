import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Panel,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import {
  Share2,
  HeartPulse,
  Pill,
  Activity,
  Building2,
  FileText,
  Stethoscope,
  ExternalLink,
  X,
  Info,
  Sparkles,
  Layers,
} from 'lucide-react';
import { GraphNode, GraphRelationship } from '../../types';

interface KnowledgeGraphViewProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  onOpenEvidence: (recordId: string) => void;
}

// ─────────────────────────────────────────────────────────────
// 1. Center Hub Custom Node (Patient / Knowledge Network Core)
// ─────────────────────────────────────────────────────────────
const CenterHubNode: React.FC<NodeProps> = ({ data, selected }) => {
  const patientName = (data as any)?.patientName || (data as any)?.name || 'the network';
  const patientId = (data as any)?.patientId || (data as any)?.id || 'GraphRAG';

  return (
    <div className="relative flex flex-col items-center justify-center select-none cursor-pointer group">
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0 !w-1 !h-1 !pointer-events-none"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !w-1 !h-1 !pointer-events-none"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* Floating Hover Card with Patient Photo */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 flex flex-col items-center">
        <div className="bg-[#FFFEFB] border-2 border-[#173F43] rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 w-68 backdrop-blur-md">
          <img
            src="/patient-avatar.png"
            alt={patientName}
            className="w-14 h-14 rounded-xl object-cover border-2 border-[#10b981] shadow-xs shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span className="text-[9px] font-mono font-bold uppercase text-[#10b981]">Active Patient</span>
            </div>
            <div className="text-xs font-black text-[#173F43] truncate font-['Outfit'] mt-0.5">
              {patientName}
            </div>
            <div className="text-[10px] font-mono text-[#287B80] font-bold">
              {patientId} • Age 68
            </div>
            <div className="text-[9px] text-[#657C78] truncate mt-0.5">
              Systolic Heart Failure (HFrEF)
            </div>
          </div>
        </div>
        <div className="w-2.5 h-2.5 bg-[#FFFEFB] border-r-2 border-b-2 border-[#173F43] rotate-45 -mt-1.5" />
      </div>

      {/* Ambient Pulsating Coral Glow */}
      <div className="absolute inset-0 rounded-full bg-[#E77763]/25 blur-2xl scale-135 pointer-events-none group-hover:scale-150 transition-transform duration-300" />

      {/* Center Coral Disc - Generous & Prominent */}
      <div
        className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-[#E77763] text-white flex flex-col items-center justify-center p-3.5 shadow-[0_16px_36px_rgba(231,119,99,0.42)] border-4 border-white transition-all duration-300 group-hover:scale-105 ${
          selected ? 'ring-4 ring-[#FBC9BB]' : ''
        }`}
      >
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/60 mb-1 shadow-inner relative flex items-center justify-center bg-white/20">
          <img
            src="/patient-avatar.png"
            alt={patientName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <span className="text-xs sm:text-sm font-black tracking-tight text-white leading-tight text-center font-['Outfit'] line-clamp-2 px-2">
          {patientName}
        </span>
        <span className="text-[10px] sm:text-[11px] font-mono text-white/95 font-bold mt-0.5 bg-black/15 px-2.5 py-0.5 rounded-full">
          {patientId.startsWith('P') ? `${patientId} • GraphRAG` : 'GraphRAG'}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 2. Orbital Clinical Custom Node (Enlarged Badges + Clear Pills)
// ─────────────────────────────────────────────────────────────
interface OrbitalData {
  raw: GraphNode;
  category: 'condition' | 'medication' | 'lab' | 'admission' | 'note' | 'other';
  title: string;
  subtitle?: string;
  isAbnormal?: boolean;
}

const OrbitalClinicalNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as unknown as OrbitalData;
  const isSelected = selected;

  let circleBg = 'bg-[#FBC9BB] text-[#A94B40] group-hover:bg-[#F6AC99]';
  let IconComponent = HeartPulse;

  if (d.category === 'condition') {
    circleBg = 'bg-[#FBC9BB] text-[#A94B40] group-hover:bg-[#F6AC99]';
    IconComponent = HeartPulse;
  } else if (d.category === 'medication') {
    circleBg = 'bg-[#91D5BE] text-[#174F55] group-hover:bg-[#6CC2A5]';
    IconComponent = Pill;
  } else if (d.category === 'lab') {
    circleBg = 'bg-[#DDF3F1] text-[#21666C] group-hover:bg-[#BCE5E1]';
    IconComponent = Activity;
  } else if (d.category === 'admission') {
    circleBg = 'bg-[#D1EEE3] text-[#287B80] group-hover:bg-[#B5E4D3]';
    IconComponent = Building2;
  } else if (d.category === 'note') {
    circleBg = 'bg-[#F7F9F5] text-[#657C78] group-hover:bg-[#EEF3EE]';
    IconComponent = FileText;
  } else {
    circleBg = 'bg-[#E1EAE3] text-[#31514F] group-hover:bg-[#CAD8D1]';
    IconComponent = Stethoscope;
  }

  return (
    <div className="relative flex flex-col items-center justify-center select-none cursor-pointer group w-48">
      {/* Centered Handles in the middle of the 80px circle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0 !w-1 !h-1 !pointer-events-none"
        style={{ top: '40px', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !w-1 !h-1 !pointer-events-none"
        style={{ top: '40px', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* Enlarged Circular Icon Badge (80px across) */}
      <div
        className={`w-20 h-20 rounded-full border-3 border-white shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${circleBg} ${
          isSelected ? 'ring-4 ring-[#3D9698] scale-110' : ''
        }`}
      >
        <IconComponent className="w-9 h-9 stroke-[2.2]" />
      </div>

      {/* Prominent White Pill Tag */}
      <div className="mt-2 bg-[#FFFEFB] px-3.5 py-1 rounded-full border border-[#E1EAE3] shadow-xs font-['Outfit'] font-extrabold text-xs text-[#173F43] truncate max-w-[160px] text-center transition-all group-hover:shadow-md group-hover:border-[#CAD8D1]">
        {d.title}
      </div>

      {/* Clinical Subtitle / Monospace Detail */}
      {d.subtitle && (
        <div
          className={`text-[10px] sm:text-[11px] font-mono mt-1 max-w-[170px] truncate text-center ${
            d.isAbnormal ? 'font-bold text-[#E77763]' : 'text-[#829590]'
          }`}
        >
          {d.subtitle}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. Background Ambient Disc (Enlarged & Moving in sync)
// ─────────────────────────────────────────────────────────────
const BackgroundDiscNode: React.FC = () => {
  return (
    <div className="w-[1500px] h-[1500px] rounded-full pointer-events-none select-none flex items-center justify-center relative">
      {/* Radial Mint Gradient Aura */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D1EEE3]/70 via-[#E6F4ED]/45 to-transparent blur-3xl" />

      {/* Subtle Inner Orbit Guide */}
      <div className="absolute w-[860px] h-[860px] rounded-full border border-dashed border-[#B5E4D3]/75" />

      {/* Subtle Outer Orbit Guide */}
      <div className="absolute w-[1120px] h-[1120px] rounded-full border border-dashed border-[#CAD8D1]/60" />
    </div>
  );
};

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  nodes,
  relationships,
  onOpenEvidence,
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'curated' | 'full'>('curated');

  const filterOptions = [
    { id: 'all', label: 'All Entities' },
    { id: 'Admission', label: 'Admissions' },
    { id: 'Condition', label: 'Conditions' },
    { id: 'Medication', label: 'Medications' },
    { id: 'LabResult', label: 'Lab Biomarkers' },
    { id: 'ClinicalNote', label: 'Clinical Notes' },
  ];

  const nodeTypes = useMemo(
    () => ({
      centerHub: CenterHubNode,
      orbitalClinical: OrbitalClinicalNode,
      backgroundDisc: BackgroundDiscNode,
    }),
    []
  );

  // ─────────────────────────────────────────────────────────────
  // Clean Title and Subtitle Extractor (Shows Real Drug & Lab Names)
  // ─────────────────────────────────────────────────────────────
  const extractCleanMeta = (item: GraphNode, category: OrbitalData['category']) => {
    let title = item.properties?.name || item.properties?.title || item.id;
    let subtitle: string | undefined = undefined;
    let isAbnormal = false;

    if (category === 'condition') {
      title = item.properties?.name || item.id;
      if (title.toLowerCase().includes('heart failure')) title = 'Heart Failure';
      else if (title.toLowerCase().includes('psoriasis')) title = 'Plaque Psoriasis';
      else if (title.toLowerCase().includes('hypertension')) title = 'Hypertension';
      subtitle = item.properties?.status || 'Diagnosed';
      if (item.properties?.code) subtitle = `${item.properties.code} • ${subtitle}`;
    } else if (category === 'medication') {
      const rawMed = (
        item.properties?.medicationName ||
        item.properties?.name ||
        item.properties?.medicationId ||
        item.id
      ).toUpperCase();

      if (rawMed.includes('ENTRESTO')) title = 'Entresto';
      else if (rawMed.includes('LISINOPRIL')) title = 'Lisinopril';
      else if (rawMed.includes('FUROSEMIDE')) title = 'Furosemide';
      else if (rawMed.includes('JARDIANCE')) title = 'Jardiance';
      else if (rawMed.includes('METFORMIN')) title = 'Metformin';
      else if (rawMed.includes('CLOBETASOL')) title = 'Clobetasol';
      else if (rawMed.includes('TOPROL')) title = 'Toprol-XL';
      else title = rawMed.replace('MED-', '').replace('RX-', 'Med ');

      const dose = item.properties?.dosage || '';
      const action = item.properties?.action || item.properties?.status || '';
      subtitle = [dose, action].filter(Boolean).join(' • ') || 'Prescribed';
    } else if (category === 'lab') {
      const rawTest = (
        item.properties?.testName ||
        item.properties?.name ||
        item.properties?.testId ||
        item.id
      ).toUpperCase();

      if (rawTest.includes('POTASSIUM') || rawTest.includes('-K')) title = 'Potassium';
      else if (rawTest.includes('BNP') || rawTest.includes('NATRIURETIC')) title = 'BNP';
      else if (rawTest.includes('CREATININE') || rawTest.includes('CREAT')) title = 'Creatinine';
      else if (rawTest.includes('EGFR')) title = 'eGFR';
      else if (rawTest.includes('HBA1C')) title = 'HbA1c';
      else title = rawTest.replace('TEST-', '').replace('LAB-', 'Lab ');

      const val = item.properties?.value !== undefined ? `${item.properties.value} ${item.properties?.unit || ''}` : '';
      const flag = item.properties?.flag || 'Normal';
      subtitle = val ? `${val} [${flag}]` : `[${flag}]`;
      isAbnormal = flag.includes('High') || flag.includes('Critical') || flag.includes('Low');
    } else if (category === 'admission') {
      title = item.properties?.department || item.properties?.name || 'Inpatient Admission';
      if (title.toLowerCase().includes('cardiovascular')) title = 'Cardiology Admission';
      subtitle = `${item.id} • ${item.properties?.reason ? item.properties.reason.split(' ')[0] : 'Inpatient'}`;
    } else if (category === 'note') {
      title = item.properties?.noteType || item.properties?.title || 'Clinical Note';
      if (title.toLowerCase().includes('discharge')) title = 'Discharge Summary';
      else if (title.toLowerCase().includes('progress')) title = 'Progress Note';
      else if (title.toLowerCase().includes('consultation')) title = 'Consultation Note';
      subtitle = item.id;
    }

    return { title, subtitle, isAbnormal };
  };

  // ─────────────────────────────────────────────────────────────
  // Curate data to reduce clutter and deduplicate representations
  // ─────────────────────────────────────────────────────────────
  const workingNodes = useMemo(() => {
    if (viewMode === 'full' && activeFilter === 'all') {
      return nodes;
    }

    const center = nodes.find((n) => n.label === 'Patient') || nodes[0];
    const list: GraphNode[] = [];
    if (center) list.push(center);

    // If filtering by a single category, show that category's distinct nodes cleanly
    if (activeFilter !== 'all') {
      const catNodes = nodes.filter((n) => {
        if (n.label === 'Patient') return false;
        if (activeFilter === 'Admission' && (n.label === 'Admission' || n.label === 'Encounter')) return true;
        if (activeFilter === 'Condition' && n.label === 'Condition') return true;
        if (activeFilter === 'Medication' && (n.label === 'Medication' || n.label === 'Prescription')) return true;
        if (activeFilter === 'LabResult' && (n.label === 'LabResult' || n.label === 'LabTest')) return true;
        if (activeFilter === 'ClinicalNote' && n.label === 'ClinicalNote') return true;
        return false;
      });

      if (activeFilter === 'Medication') {
        const seen = new Set<string>();
        for (const m of catNodes) {
          const key = (m.properties?.name || m.properties?.medicationName || m.id).toUpperCase().slice(0, 8);
          if (!seen.has(key)) {
            seen.add(key);
            list.push(m);
          }
        }
        return list;
      }

      if (activeFilter === 'LabResult') {
        const seen = new Set<string>();
        for (const l of catNodes) {
          const key = (l.properties?.testName || l.properties?.name || l.id).toUpperCase().slice(0, 8);
          if (!seen.has(key)) {
            seen.add(key);
            list.push(l);
          }
        }
        return list;
      }

      catNodes.forEach((n) => list.push(n));
      return list;
    }

    // Curated Focus Mode for "All Entities":
    // Select the key clinical anchors (~9-11 nodes)
    const conds = nodes.filter((n) => n.label === 'Condition');
    conds.slice(0, 2).forEach((c) => list.push(c));

    const medNodes = nodes.filter((n) => n.label === 'Medication' || n.label === 'Prescription');
    const seenMeds = new Set<string>();
    const topMeds: GraphNode[] = [];

    const sortedMeds = [...medNodes].sort((a, b) => {
      const aScore = (a.properties?.dosage ? 2 : 0) + (a.properties?.action ? 1 : 0);
      const bScore = (b.properties?.dosage ? 2 : 0) + (b.properties?.action ? 1 : 0);
      return bScore - aScore;
    });

    for (const m of sortedMeds) {
      const rawName = (m.properties?.name || m.properties?.medicationName || m.id).toUpperCase();
      const key = rawName.includes('ENTRESTO')
        ? 'ENTRESTO'
        : rawName.includes('LISINOPRIL')
        ? 'LISINOPRIL'
        : rawName.includes('FUROSEMIDE')
        ? 'FUROSEMIDE'
        : rawName.includes('JARDIANCE')
        ? 'JARDIANCE'
        : rawName.includes('METFORMIN')
        ? 'METFORMIN'
        : rawName.includes('CLOBETASOL')
        ? 'CLOBETASOL'
        : rawName.slice(0, 8);

      if (!seenMeds.has(key)) {
        seenMeds.add(key);
        topMeds.push(m);
        if (topMeds.length >= 3) break;
      }
    }
    topMeds.forEach((m) => list.push(m));

    const labNodes = nodes.filter((n) => n.label === 'LabResult' || n.label === 'LabTest');
    const seenLabs = new Set<string>();
    const topLabs: GraphNode[] = [];

    const sortedLabs = [...labNodes].sort((a, b) => {
      const aFlag = a.properties?.flag || '';
      const bFlag = b.properties?.flag || '';
      const aScore = aFlag.includes('High') || aFlag.includes('Critical') ? 3 : aFlag.includes('Low') ? 2 : 1;
      const bScore = bFlag.includes('High') || bFlag.includes('Critical') ? 3 : bFlag.includes('Low') ? 2 : 1;
      return bScore - aScore;
    });

    for (const l of sortedLabs) {
      const rawName = (l.properties?.testName || l.properties?.name || l.id).toUpperCase();
      const key = rawName.includes('POTASSIUM') || rawName.includes('-K')
        ? 'POTASSIUM'
        : rawName.includes('BNP') || rawName.includes('NATRIURETIC')
        ? 'BNP'
        : rawName.includes('CREATININE') || rawName.includes('CREAT')
        ? 'CREATININE'
        : rawName.includes('EGFR')
        ? 'EGFR'
        : rawName.slice(0, 8);

      if (!seenLabs.has(key)) {
        seenLabs.add(key);
        topLabs.push(l);
        if (topLabs.length >= 3) break;
      }
    }
    topLabs.forEach((l) => list.push(l));

    const admNodes = nodes.filter((n) => n.label === 'Admission' || n.label === 'Encounter');
    if (admNodes.length > 0) {
      list.push(admNodes[0]);
    }

    const noteNodes = nodes.filter((n) => n.label === 'ClinicalNote');
    if (noteNodes.length > 0) {
      const summaryNote =
        noteNodes.find((n) =>
          (n.properties?.title || n.properties?.noteType || '').toLowerCase().includes('discharge')
        ) || noteNodes[0];
      list.push(summaryNote);
    }

    return list;
  }, [nodes, viewMode, activeFilter]);

  const { flowNodes, flowEdges } = useMemo(() => {
    const centerNode = workingNodes.find((n) => n.label === 'Patient') || workingNodes[0];
    const centerX = 800;
    const centerY = 500;

    const conditions = workingNodes.filter((n) => n.label === 'Condition');
    const medications = workingNodes.filter((n) => n.label === 'Medication' || n.label === 'Prescription');
    const labs = workingNodes.filter((n) => n.label === 'LabResult' || n.label === 'LabTest');
    const admissions = workingNodes.filter((n) => n.label === 'Admission' || n.label === 'Encounter');
    const notesList = workingNodes.filter((n) => n.label === 'ClinicalNote');
    const others = workingNodes.filter(
      (n) =>
        n.label !== 'Patient' &&
        n.label !== 'Admission' &&
        n.label !== 'Encounter' &&
        n.label !== 'Condition' &&
        n.label !== 'Medication' &&
        n.label !== 'Prescription' &&
        n.label !== 'LabResult' &&
        n.label !== 'LabTest' &&
        n.label !== 'ClinicalNote'
    );

    const resultNodes: Node[] = [];
    const resultEdges: Edge[] = [];

    // Background Mint Aura Disc (Expanded to 1500px)
    resultNodes.push({
      id: 'bg-ambient-disc',
      type: 'backgroundDisc',
      position: { x: centerX - 750, y: centerY - 750 },
      data: {},
      selectable: false,
      draggable: false,
      zIndex: -1,
    });

    // Central Patient Node (Larger Hub: w-40 h-40)
    if (centerNode) {
      resultNodes.push({
        id: centerNode.id,
        type: 'centerHub',
        position: { x: centerX - 80, y: centerY - 80 },
        data: {
          patientName: centerNode.properties?.name || 'the network',
          patientId: centerNode.properties?.mrn || centerNode.id,
          raw: centerNode,
        },
      });
    }

    // Helper to distribute items along an expanded orbital radius
    const placeInSector = (
      items: GraphNode[],
      category: OrbitalData['category'],
      startDeg: number,
      endDeg: number,
      r1: number,
      r2: number
    ) => {
      const count = items.length;
      if (count === 0) return;

      items.forEach((item, idx) => {
        let angleDeg = count === 1 ? (startDeg + endDeg) / 2 : startDeg + ((endDeg - startDeg) / (count - 1)) * idx;
        let r = r1;
        if (count > 3) {
          r = idx % 2 === 0 ? r1 : r2;
        }
        if (count > 7) {
          const mod3 = idx % 3;
          r = mod3 === 0 ? r1 : mod3 === 1 ? r2 : (r1 + r2) / 2 + 70;
        }

        const rad = (angleDeg * Math.PI) / 180;
        // Adjusted for wider 48px/80px node center
        const x = Math.round(centerX + r * Math.cos(rad) - 96);
        const y = Math.round(centerY + r * Math.sin(rad) - 48);

        const { title, subtitle, isAbnormal } = extractCleanMeta(item, category);

        resultNodes.push({
          id: item.id,
          type: 'orbitalClinical',
          position: { x, y },
          data: {
            raw: item,
            category,
            title,
            subtitle,
            isAbnormal,
          },
        });
      });
    };

    // Distribution Logic:
    // Expanded radius so the entire constellation structure is larger & spacious!
    if (activeFilter === 'Condition') {
      placeInSector(conditions, 'condition', 0, 360, 420, 500);
    } else if (activeFilter === 'Medication') {
      placeInSector(medications, 'medication', 0, 360, 430, 520);
    } else if (activeFilter === 'LabResult') {
      placeInSector(labs, 'lab', 0, 360, 440, 530);
    } else if (activeFilter === 'Admission') {
      placeInSector(admissions, 'admission', 0, 360, 410, 500);
    } else if (activeFilter === 'ClinicalNote') {
      placeInSector(notesList, 'note', 0, 360, 430, 520);
    } else if (viewMode === 'curated') {
      // ─────────────────────────────────────────────────────────────
      // Curated Constellation: Expanded Radius (R = 430px - 470px)
      // ─────────────────────────────────────────────────────────────
      // Top-Left: Condition (Coral)
      placeInSector(conditions, 'condition', 215, 255, 430, 470);

      // Top-Right: Medications (Mint)
      placeInSector(medications, 'medication', 290, 350, 440, 480);

      // Bottom-Right: Lab Biomarkers (Teal / Amber)
      placeInSector(labs, 'lab', 30, 95, 440, 480);

      // Bottom-Left: Admission (Teal)
      placeInSector(admissions, 'admission', 125, 155, 420, 460);

      // Far-Left: Clinical Note (Slate)
      placeInSector(notesList, 'note', 175, 195, 440, 480);

      // Others
      placeInSector(others, 'other', 85, 110, 460, 510);
    } else {
      // Full network with wide staggered shells
      placeInSector(conditions, 'condition', 205, 265, 360, 500);
      placeInSector(medications, 'medication', 285, 360, 380, 540);
      placeInSector(labs, 'lab', 15, 110, 390, 560);
      placeInSector(admissions, 'admission', 120, 175, 360, 500);
      placeInSector(notesList, 'note', 175, 225, 440, 600);
      placeInSector(others, 'other', 80, 110, 500, 620);
    }

    // ─────────────────────────────────────────────────────────────
    // Constellation Edges & Spokes
    // ─────────────────────────────────────────────────────────────
    const nodeIds = new Set(resultNodes.map((n) => n.id));
    const connectedToCenter = new Set<string>();

    relationships.forEach((rel) => {
      if (nodeIds.has(rel.source) && nodeIds.has(rel.target)) {
        if (rel.source === centerNode?.id) connectedToCenter.add(rel.target);
        if (rel.target === centerNode?.id) connectedToCenter.add(rel.source);

        resultEdges.push({
          id: rel.id || `e-${rel.source}-${rel.target}`,
          source: rel.source,
          target: rel.target,
          animated: rel.type === 'PRESCRIBED' || rel.type === 'HAS_RESULT',
          style: {
            stroke: '#4FA58D',
            strokeWidth: 2,
            strokeDasharray: '5 5',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#4FA58D',
            width: 12,
            height: 12,
          },
        });
      }
    });

    // Connect orbital nodes to center hub with subtle dashed radial spokes
    if (centerNode) {
      resultNodes.forEach((node) => {
        if (node.id !== centerNode.id && node.id !== 'bg-ambient-disc') {
          if (!connectedToCenter.has(node.id)) {
            resultEdges.push({
              id: `radial-${centerNode.id}-${node.id}`,
              source: centerNode.id,
              target: node.id,
              style: {
                stroke: '#91D5BE',
                strokeWidth: 1.5,
                strokeDasharray: '4 4',
                opacity: 0.6,
              },
            });
          }
        }
      });
    }

    // In curated view, connect outer orbital entities together like a constellation polygon!
    if (viewMode === 'curated' && activeFilter === 'all') {
      const outerNodes = resultNodes.filter(
        (n) => n.id !== centerNode?.id && n.id !== 'bg-ambient-disc'
      );
      if (outerNodes.length > 2) {
        for (let i = 0; i < outerNodes.length; i++) {
          const next = (i + 1) % outerNodes.length;
          resultEdges.push({
            id: `constellation-poly-${outerNodes[i].id}-${outerNodes[next].id}`,
            source: outerNodes[i].id,
            target: outerNodes[next].id,
            style: {
              stroke: '#6CC2A5',
              strokeWidth: 1.5,
              strokeDasharray: '5 5',
              opacity: 0.5,
            },
          });
        }
      }
    }

    return { flowNodes: resultNodes, flowEdges: resultEdges };
  }, [workingNodes, relationships, activeFilter, viewMode]);

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#173F43] tracking-tight font-['Outfit']">
              Explore patient relationships.
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E6F4ED] text-[#174F55] border border-[#B5E4D3] font-bold">
              {viewMode === 'curated' ? 'Curated Constellation' : 'Full Network'}
            </span>
          </div>
          <p className="text-xs text-[#657C78] mt-0.5">
            Follow connections between key conditions, medications, admissions, laboratory results, and clinical events.
          </p>
        </div>

        {/* View Mode Toggle & Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Curated vs Full Toggle */}
          <div className="flex items-center gap-1 bg-[#FBFAF4] p-1 rounded-2xl border border-[#E1EAE3]">
            <button
              onClick={() => setViewMode('curated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'curated'
                  ? 'bg-[#173F43] text-white shadow-2xs'
                  : 'text-[#657C78] hover:text-[#173F43] hover:bg-[#EEF3EE]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#91D5BE]" />
              Curated ({workingNodes.length - 1} Nodes)
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'full'
                  ? 'bg-[#173F43] text-white shadow-2xs'
                  : 'text-[#657C78] hover:text-[#173F43] hover:bg-[#EEF3EE]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All ({nodes.length} Nodes)
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1">
            {filterOptions.map((f) => {
              const isSelected = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-2.5 py-1 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#173F43] text-white shadow-2xs'
                      : 'bg-[#FBFAF4] hover:bg-[#EEF3EE] text-[#657C78] hover:text-[#173F43] border border-[#E1EAE3]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Orbital Graph Canvas and Detail Side Drawer */}
      <div className="relative bg-[#FBFAF4] border border-[#E1EAE3] rounded-3xl overflow-hidden h-[780px] shadow-xs flex">
        {/* React Flow Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            key={`${activeFilter}-${viewMode}`}
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
              if (node.id === 'bg-ambient-disc') return;
              setSelectedNode(((node.data as any)?.raw as GraphNode) || null);
            }}
            fitView
            fitViewOptions={{ padding: 0.08 }}
            attributionPosition="bottom-left"
          >
            <Background color="#CAD8D1" gap={28} size={1} />
            <Controls className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-xl shadow-xs" />
            <MiniMap
              nodeColor={(n) => {
                if (n.id.startsWith('P')) return '#E77763';
                if (n.id.startsWith('ADM')) return '#287B80';
                if (n.id.startsWith('COND')) return '#FBC9BB';
                if (n.id.startsWith('RX') || n.id.startsWith('MED')) return '#91D5BE';
                if (n.id.startsWith('LAB')) return '#DDF3F1';
                return '#A8B9B2';
              }}
              className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-xl shadow-xs"
            />

            {/* Constellation Legend Panel */}
            <Panel
              position="top-right"
              className="bg-[#FFFEFB]/95 border border-[#E1EAE3] rounded-2xl p-4 shadow-md backdrop-blur-xs text-[11px] space-y-2 select-none"
            >
              <div className="font-mono uppercase font-bold text-[#173F43] text-[10px] pb-1.5 border-b border-[#E1EAE3] flex items-center justify-between gap-3">
                <span>Constellation Legend</span>
                <span className="text-[#829590] font-normal">{flowNodes.length - 1} visible</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#E77763] border-2 border-white shadow-2xs" />
                <span className="text-[#173F43] font-bold">Patient Hub (Center)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#FBC9BB] border-2 border-white shadow-2xs" />
                <span className="text-[#657C78] font-medium">Condition / Diagnosis</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#91D5BE] border-2 border-white shadow-2xs" />
                <span className="text-[#657C78] font-medium">Prescription / Drug</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#DDF3F1] border-2 border-white shadow-2xs" />
                <span className="text-[#657C78] font-medium">Laboratory Result</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#D1EEE3] border-2 border-white shadow-2xs" />
                <span className="text-[#657C78] font-medium">Hospital Admission</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#F7F9F5] border-2 border-white shadow-2xs" />
                <span className="text-[#657C78] font-medium">Clinical Note</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="w-84 bg-[#FFFEFB] border-l border-[#E1EAE3] p-5 flex flex-col justify-between overflow-y-auto shadow-lg animate-in slide-in-from-right-4 duration-200 z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E1EAE3]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E6F4ED] text-[#174F55] border border-[#B5E4D3]">
                    {selectedNode.label}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#173F43]">{selectedNode.id}</span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-lg text-[#657C78] hover:bg-[#EEF3EE] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#173F43] font-['Outfit']">
                  {selectedNode.properties?.name ||
                    selectedNode.properties?.title ||
                    selectedNode.properties?.reason ||
                    selectedNode.id}
                </h3>
                {selectedNode.properties?.category && (
                  <span className="text-xs text-[#287B80] font-mono mt-0.5 block">
                    Category: {selectedNode.properties.category}
                  </span>
                )}
              </div>

              {/* Property Attributes Table */}
              <div className="space-y-2 text-xs">
                <div className="font-mono uppercase text-[10px] text-[#829590] font-bold">
                  Clinical Attributes
                </div>
                <div className="space-y-1.5 bg-[#FBFAF4] p-3 rounded-2xl border border-[#E1EAE3] font-mono text-[11px]">
                  {Object.entries(selectedNode.properties || {}).map(([key, value]) => {
                    if (typeof value === 'object') return null;
                    return (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="text-[#829590] capitalize">{key}:</span>
                        <span className="font-semibold text-[#173F43] text-right truncate max-w-[150px]">
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Evidence Link */}
            <div className="pt-4 border-t border-[#E1EAE3]">
              {selectedNode.properties?.sourceRecordId ? (
                <button
                  onClick={() => onOpenEvidence(selectedNode.properties.sourceRecordId)}
                  className="w-full py-2.5 px-3 bg-[#173F43] hover:bg-[#24665F] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Inspect Evidence ({selectedNode.properties.sourceRecordId})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="text-[11px] font-mono text-[#829590] text-center flex items-center justify-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#4FA58D]" />
                  <span>Grounded in Patient Knowledge Graph</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
