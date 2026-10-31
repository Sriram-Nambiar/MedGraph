import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Panel,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import {
  User,
  Building2,
  Pill,
  HeartPulse,
  FlaskConical,
  X,
  FileText,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { GraphNode, GraphRelationship } from '../../types';

interface KnowledgeGraphViewProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  onOpenEvidence: (recordId: string) => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  nodes,
  relationships,
  onOpenEvidence,
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { flowNodes, flowEdges } = useMemo(() => {
    const centerNode = nodes.find((n) => n.label === 'Patient') || nodes[0];
    const patientId = centerNode?.id || 'P001';

    const filteredDomainNodes = nodes.filter((n) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'Patient' && n.label === 'Patient') return true;
      if (activeFilter === 'Admission' && (n.label === 'Admission' || n.label === 'Patient')) return true;
      if (activeFilter === 'Medication' && (n.label === 'Medication' || n.label === 'Prescription' || n.label === 'Patient')) return true;
      if (activeFilter === 'Condition' && (n.label === 'Condition' || n.label === 'Patient')) return true;
      if (activeFilter === 'LabResult' && (n.label === 'LabResult' || n.label === 'LabTest' || n.label === 'Patient')) return true;
      return false;
    });

    const admissions = filteredDomainNodes.filter((n) => n.label === 'Admission');
    const conditions = filteredDomainNodes.filter((n) => n.label === 'Condition');
    const medications = filteredDomainNodes.filter((n) => n.label === 'Medication');
    const labs = filteredDomainNodes.filter((n) => n.label === 'LabResult');

    const resultNodes: Node[] = [];
    const resultEdges: Edge[] = [];

    // 1. Center: Patient Node
    if (centerNode) {
      resultNodes.push({
        id: centerNode.id,
        position: { x: 420, y: 250 },
        data: {
          label: (
            <div className="p-3.5 bg-white border-2 border-[#1e3a8a] rounded-2xl shadow-xl w-48 text-center transition-all hover:scale-105">
              <div className="flex items-center justify-center gap-1.5 text-[#1e3a8a] mb-1">
                <span className="p-1 rounded-full bg-[#eff6ff]">
                  <User className="w-4 h-4 text-[#1e3a8a]" />
                </span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Patient</span>
              </div>
              <div className="font-extrabold text-[#0f172a] text-sm leading-tight">
                {centerNode.properties.name || centerNode.id}
              </div>
              <div className="text-[11px] text-[#2563eb] font-mono font-semibold mt-0.5">
                {centerNode.properties.mrn || centerNode.id}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 bg-slate-50 py-0.5 rounded border border-slate-100">
                {centerNode.properties.primaryDiagnosis ? centerNode.properties.primaryDiagnosis.slice(0, 32) + '...' : 'Longitudinal Clinical Record'}
              </div>
            </div>
          ),
          raw: centerNode,
        },
      });
    }

    // 2. Admissions (Top Arc)
    admissions.forEach((adm, idx) => {
      const total = Math.max(admissions.length, 1);
      const angle = (idx / total) * (Math.PI * 0.8) - Math.PI * 0.9;
      const radius = 240;
      const x = 420 + radius * Math.cos(angle);
      const y = 250 + radius * Math.sin(angle);

      resultNodes.push({
        id: adm.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-3 bg-white border-2 border-[#4f46e5] rounded-xl shadow-md w-44 text-left hover:border-[#3730a3] transition-all">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1 text-[#4f46e5]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-mono font-bold">Admission</span>
                </div>
                <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                  {adm.properties.admissionType || 'Inpatient'}
                </span>
              </div>
              <div className="font-bold text-[#1e1b4b] text-xs truncate">{adm.id}</div>
              <div className="text-[10px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                {adm.properties.reason || 'Hospital consultation'}
              </div>
            </div>
          ),
          raw: adm,
        },
      });

      // Edge: Patient -> Admission
      resultEdges.push({
        id: `edge-${patientId}-${adm.id}`,
        source: centerNode.id,
        target: adm.id,
        label: 'ADMITTED',
        animated: true,
        style: { stroke: '#2563eb', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb', width: 14, height: 14 },
        labelStyle: { fill: '#1e3a8a', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
        labelBgPadding: [6, 3],
      });
    });

    // 3. Conditions (Left Column)
    conditions.forEach((cond, idx) => {
      const x = 60;
      const y = 90 + idx * 95;

      resultNodes.push({
        id: cond.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-3 bg-white border-2 border-[#e11d48] rounded-xl shadow-md w-48 text-left hover:border-[#be123c] transition-all">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1 text-[#e11d48]">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-mono font-bold">Condition</span>
                </div>
                <span className="text-[9px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded font-semibold">
                  {cond.properties.status || 'Active'}
                </span>
              </div>
              <div className="font-bold text-[#1f2937] text-xs line-clamp-1">{cond.properties.name || cond.id}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">ICD-10: {cond.properties.code || 'N/A'}</div>
            </div>
          ),
          raw: cond,
        },
      });

      // Edge: Patient -> Condition
      resultEdges.push({
        id: `edge-${patientId}-${cond.id}`,
        source: centerNode.id,
        target: cond.id,
        label: 'DIAGNOSED_WITH',
        animated: false,
        style: { stroke: '#e11d48', strokeWidth: 2.2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#e11d48', width: 14, height: 14 },
        labelStyle: { fill: '#9f1239', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
        labelBgPadding: [5, 3],
      });
    });

    // 4. Medications (Right Column)
    medications.forEach((med, idx) => {
      const x = 750;
      const y = 80 + idx * 90;

      resultNodes.push({
        id: med.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-3 bg-white border-2 border-[#059669] rounded-xl shadow-md w-48 text-left hover:border-[#047857] transition-all">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1 text-[#059669]">
                  <Pill className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-mono font-bold">Medication</span>
                </div>
                <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">
                  Rx
                </span>
              </div>
              <div className="font-bold text-[#064e3b] text-xs truncate">{med.properties.name || med.id}</div>
              <div className="text-[10px] text-slate-600 truncate mt-0.5">{med.properties.category || 'Therapeutic Agent'}</div>
            </div>
          ),
          raw: med,
        },
      });

      // Edge: Patient/Admission -> Medication
      const sourceId = admissions.length > 0 ? admissions[idx % admissions.length].id : centerNode.id;
      resultEdges.push({
        id: `edge-med-${med.id}`,
        source: sourceId,
        target: med.id,
        label: 'PRESCRIBED',
        animated: true,
        style: { stroke: '#059669', strokeWidth: 2.4 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#059669', width: 14, height: 14 },
        labelStyle: { fill: '#065f46', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
        labelBgPadding: [5, 3],
      });
    });

    // 5. Key Labs (Bottom Row)
    labs.slice(0, 6).forEach((lab, idx) => {
      const x = 140 + idx * 125;
      const y = 510;

      resultNodes.push({
        id: lab.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2.5 bg-white border-2 border-[#0284c7] rounded-xl shadow-md w-30 text-center hover:border-[#0369a1] transition-all">
              <div className="flex items-center justify-center gap-1 text-[#0284c7] mb-0.5">
                <FlaskConical className="w-3 h-3" />
                <span className="text-[9px] uppercase font-mono font-bold">Biomarker</span>
              </div>
              <div className="font-black text-[#0c4a6e] text-xs font-mono">
                {lab.properties.value} <span className="text-[10px] font-normal">{lab.properties.unit}</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono truncate mt-0.5">
                {lab.properties.testId || lab.id}
              </div>
            </div>
          ),
          raw: lab,
        },
      });

      // Edge: Patient -> Lab
      resultEdges.push({
        id: `edge-lab-${lab.id}`,
        source: centerNode.id,
        target: lab.id,
        label: 'HAS_LAB',
        animated: false,
        style: { stroke: '#0284c7', strokeWidth: 2.0 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#0284c7', width: 14, height: 14 },
        labelStyle: { fill: '#075985', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
        labelBgPadding: [5, 3],
      });
    });

    return { flowNodes: resultNodes, flowEdges: resultEdges };
  }, [nodes, relationships, activeFilter]);

  return (
    <div className="relative w-full h-[620px] bg-[#f0f6ff] rounded-2xl border-2 border-[#bfdbfe] overflow-hidden shadow-lg select-none">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodeClick={(_, node) => {
          if (node.data?.raw) {
            setSelectedNode(node.data.raw as GraphNode);
          }
        }}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="#93c5fd" />
        <Controls className="!bg-white !border-2 !border-[#bfdbfe] !rounded-xl !shadow-md [&>button]:!border-b [&>button]:!border-slate-200 [&>button]:!fill-[#1e3a8a] [&>button]:!text-[#1e3a8a]" />
        <MiniMap
          nodeColor={(node) => {
            if (node.id.startsWith('P')) return '#1e3a8a';
            if (node.id.startsWith('ADM')) return '#4f46e5';
            if (node.id.startsWith('COND')) return '#e11d48';
            if (node.id.startsWith('MED')) return '#059669';
            return '#0284c7';
          }}
          maskColor="rgba(240, 246, 255, 0.7)"
          style={{
            background: '#ffffff',
            border: '2px solid #bfdbfe',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(30, 58, 138, 0.1)',
          }}
        />

        {/* Filter Controls Panel */}
        <Panel position="top-left" className="m-3">
          <div className="flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md border-2 border-[#bfdbfe] rounded-xl shadow-md">
            <span className="text-[10px] font-mono font-bold text-[#1e3a8a] px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#2563eb]" />
              Filter:
            </span>
            {['all', 'Admission', 'Medication', 'Condition', 'LabResult'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeFilter === cat
                    ? 'bg-[#1e3a8a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#1e3a8a] hover:bg-[#eff6ff]'
                }`}
              >
                {cat === 'all' ? 'All Entities' : cat}
              </button>
            ))}
          </div>
        </Panel>

        {/* Legend Panel */}
        <Panel position="top-right" className="m-3">
          <div className="p-2.5 bg-white/95 backdrop-blur-md border-2 border-[#bfdbfe] rounded-xl shadow-md flex items-center gap-3 text-[10px] font-mono font-bold">
            <div className="flex items-center gap-1 text-[#1e3a8a]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a]" />
              <span>Patient</span>
            </div>
            <div className="flex items-center gap-1 text-[#4f46e5]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
              <span>Admission</span>
            </div>
            <div className="flex items-center gap-1 text-[#e11d48]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <span>Condition</span>
            </div>
            <div className="flex items-center gap-1 text-[#059669]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              <span>Medication</span>
            </div>
            <div className="flex items-center gap-1 text-[#0284c7]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
              <span>Lab</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="absolute top-16 right-3 w-80 bg-white border-2 border-[#bfdbfe] rounded-2xl shadow-2xl p-4 z-30 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#eff6ff] text-[#1e3a8a] font-mono text-[10px] font-bold border border-[#bfdbfe]">
                {selectedNode.label}
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">{selectedNode.id}</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            {Object.entries(selectedNode.properties).map(([key, val]) => (
              <div key={key} className="flex flex-col gap-0.5 pb-1 border-b border-slate-50 last:border-0">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400">{key}</span>
                <span className="font-semibold text-slate-800 break-words">{String(val)}</span>
              </div>
            ))}
          </div>

          {selectedNode.properties.sourceRecordId && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => onOpenEvidence(selectedNode.properties.sourceRecordId)}
                className="px-3 py-1.5 bg-[#1e3a8a] hover:bg-[#152347] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Verify Provenance [{selectedNode.properties.sourceRecordId}]</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
