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
} from '@xyflow/react';
import {
  User,
  Building2,
  Stethoscope,
  Pill,
  HeartPulse,
  FlaskConical,
  X,
  FileText,
  Filter,
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

  // Convert domain nodes to React Flow nodes with layout
  const { flowNodes, flowEdges } = useMemo(() => {
    // Filter nodes if activeFilter is set
    const filteredDomainNodes = nodes.filter((n) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'Patient' && n.label === 'Patient') return true;
      if (activeFilter === 'Admission' && (n.label === 'Admission' || n.label === 'Patient')) return true;
      if (activeFilter === 'Medication' && (n.label === 'Medication' || n.label === 'Prescription' || n.label === 'Patient')) return true;
      if (activeFilter === 'Condition' && (n.label === 'Condition' || n.label === 'Patient')) return true;
      if (activeFilter === 'LabResult' && (n.label === 'LabResult' || n.label === 'LabTest' || n.label === 'Patient')) return true;
      return false;
    });

    const nodeIds = new Set(filteredDomainNodes.map((n) => n.id));

    // Layout configuration: concentric layers
    const centerNode = filteredDomainNodes.find((n) => n.label === 'Patient');
    const admissions = filteredDomainNodes.filter((n) => n.label === 'Admission');
    const encounters = filteredDomainNodes.filter((n) => n.label === 'Encounter');
    const conditions = filteredDomainNodes.filter((n) => n.label === 'Condition');
    const medications = filteredDomainNodes.filter((n) => n.label === 'Medication');
    const prescriptions = filteredDomainNodes.filter((n) => n.label === 'Prescription');
    const labs = filteredDomainNodes.filter((n) => n.label === 'LabResult');

    const resultNodes: Node[] = [];

    // Center: Patient
    if (centerNode) {
      resultNodes.push({
        id: centerNode.id,
        position: { x: 450, y: 300 },
        data: {
          label: (
            <div className="p-3 bg-zinc-950 border-2 border-cyan-400 rounded-xl shadow-lg w-48 text-center">
              <div className="flex items-center justify-center gap-1.5 text-cyan-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Patient</span>
              </div>
              <div className="font-bold text-white text-xs">{centerNode.properties.name || centerNode.id}</div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{centerNode.properties.mrn}</div>
            </div>
          ),
          raw: centerNode,
        },
      });
    }

    // Layer 1: Admissions (Upper Left / Upper Right arc)
    admissions.forEach((adm, idx) => {
      const angle = (idx / Math.max(admissions.length, 1)) * Math.PI - Math.PI / 2;
      const radius = 240;
      const x = 450 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      resultNodes.push({
        id: adm.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2.5 bg-zinc-900 border border-blue-500/80 rounded-lg shadow w-44">
              <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-mono font-semibold">Admission</span>
              </div>
              <div className="font-bold text-white text-xs truncate">{adm.id}</div>
              <div className="text-[10px] text-zinc-400 truncate">{adm.properties.reason}</div>
            </div>
          ),
          raw: adm,
        },
      });
    });

    // Layer 2: Conditions (Left Column)
    conditions.forEach((cond, idx) => {
      const x = 80;
      const y = 100 + idx * 90;

      resultNodes.push({
        id: cond.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2.5 bg-zinc-900 border border-rose-500/80 rounded-lg shadow w-48">
              <div className="flex items-center gap-1.5 text-rose-400 mb-1">
                <HeartPulse className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-mono font-semibold">Condition</span>
              </div>
              <div className="font-semibold text-white text-xs leading-snug">{cond.properties.name || cond.id}</div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{cond.properties.code}</div>
            </div>
          ),
          raw: cond,
        },
      });
    });

    // Layer 3: Medications (Right Column)
    medications.forEach((med, idx) => {
      const x = 820;
      const y = 80 + idx * 85;

      resultNodes.push({
        id: med.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2.5 bg-zinc-900 border border-emerald-500/80 rounded-lg shadow w-48">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                <Pill className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-mono font-semibold">Medication</span>
              </div>
              <div className="font-bold text-white text-xs">{med.properties.name || med.id}</div>
              <div className="text-[10px] text-zinc-400">{med.properties.category}</div>
            </div>
          ),
          raw: med,
        },
      });
    });

    // Layer 4: Key Labs (Bottom Row)
    labs.slice(0, 6).forEach((lab, idx) => {
      const x = 180 + idx * 140;
      const y = 560;

      resultNodes.push({
        id: lab.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2 bg-zinc-900 border border-amber-500/80 rounded-lg shadow w-32 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                <FlaskConical className="w-3 h-3" />
                <span className="text-[9px] uppercase font-mono">Lab</span>
              </div>
              <div className="font-bold text-white text-xs font-mono">
                {lab.properties.value} {lab.properties.unit}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono truncate">{lab.properties.testId}</div>
            </div>
          ),
          raw: lab,
        },
      });
    });

    // Edges
    const resultEdges: Edge[] = [];
    relationships.forEach((rel) => {
      if (nodeIds.has(rel.source) && nodeIds.has(rel.target)) {
        resultEdges.push({
          id: rel.id,
          source: rel.source,
          target: rel.target,
          label: rel.type.replace('_', ' '),
          labelStyle: { fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' },
          style: { stroke: '#475569', strokeWidth: 1.5 },
          animated: rel.type === 'PRESCRIBES' || rel.type === 'HAS_ADMISSION',
        });
      }
    });

    return { flowNodes: resultNodes, flowEdges: resultEdges };
  }, [nodes, relationships, activeFilter]);

  return (
    <div className="relative w-full h-[640px] bg-[#0b0d14] rounded-xl border border-zinc-800 overflow-hidden shadow-inner">
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
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#1e293b" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const raw = node.data?.raw as GraphNode;
            if (raw?.label === 'Patient') return '#22d3ee';
            if (raw?.label === 'Admission') return '#3b82f6';
            if (raw?.label === 'Medication') return '#10b981';
            if (raw?.label === 'Condition') return '#f43f5e';
            return '#f59e0b';
          }}
          style={{ background: '#090a0f', border: '1px solid #1e293b' }}
        />

        {/* Filter Panel in top-left */}
        <Panel position="top-left">
          <div className="bg-zinc-900/90 backdrop-blur-md p-2 rounded-lg border border-zinc-800 flex items-center gap-1.5 shadow-md">
            <Filter className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-1 text-xs rounded ${activeFilter === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('Admission')}
              className={`px-2 py-1 text-xs rounded ${activeFilter === 'Admission' ? 'bg-blue-950 text-blue-300 font-medium' : 'text-zinc-400 hover:text-white'}`}
            >
              Admissions
            </button>
            <button
              onClick={() => setActiveFilter('Medication')}
              className={`px-2 py-1 text-xs rounded ${activeFilter === 'Medication' ? 'bg-emerald-950 text-emerald-300 font-medium' : 'text-zinc-400 hover:text-white'}`}
            >
              Medications
            </button>
            <button
              onClick={() => setActiveFilter('Condition')}
              className={`px-2 py-1 text-xs rounded ${activeFilter === 'Condition' ? 'bg-rose-950 text-rose-300 font-medium' : 'text-zinc-400 hover:text-white'}`}
            >
              Conditions
            </button>
            <button
              onClick={() => setActiveFilter('LabResult')}
              className={`px-2 py-1 text-xs rounded ${activeFilter === 'LabResult' ? 'bg-amber-950 text-amber-300 font-medium' : 'text-zinc-400 hover:text-white'}`}
            >
              Labs
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 bg-zinc-900/95 backdrop-blur-md border border-zinc-750 rounded-xl p-4 shadow-xl z-20">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                {selectedNode.label}
              </span>
              <span className="font-mono text-xs text-white font-bold">{selectedNode.id}</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            {Object.entries(selectedNode.properties).map(([k, v]) => {
              if (typeof v === 'object' && v !== null) return null;
              return (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">{k}:</span>
                  <span className="text-zinc-200 font-medium break-words bg-zinc-950/60 p-1.5 rounded border border-zinc-850">
                    {String(v)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* If node has sourceRecordId */}
          {selectedNode.properties.sourceRecordId && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <button
                onClick={() => onOpenEvidence(selectedNode.properties.sourceRecordId)}
                className="w-full py-2 px-3 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Inspect Source Record [{selectedNode.properties.sourceRecordId}]</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
