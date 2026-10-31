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

  const { flowNodes, flowEdges } = useMemo(() => {
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

    const centerNode = filteredDomainNodes.find((n) => n.label === 'Patient');
    const admissions = filteredDomainNodes.filter((n) => n.label === 'Admission');
    const conditions = filteredDomainNodes.filter((n) => n.label === 'Condition');
    const medications = filteredDomainNodes.filter((n) => n.label === 'Medication');
    const labs = filteredDomainNodes.filter((n) => n.label === 'LabResult');

    const resultNodes: Node[] = [];

    // Center: Patient
    if (centerNode) {
      resultNodes.push({
        id: centerNode.id,
        position: { x: 420, y: 260 },
        data: {
          label: (
            <div className="p-3 bg-zinc-950 border border-zinc-500 rounded-xl shadow-xl w-44 text-center">
              <div className="flex items-center justify-center gap-1.5 text-zinc-300 mb-0.5">
                <User className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[10px] uppercase font-mono font-semibold">Patient</span>
              </div>
              <div className="font-bold text-white text-xs">{centerNode.properties.name || centerNode.id}</div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{centerNode.properties.mrn}</div>
            </div>
          ),
          raw: centerNode,
        },
      });
    }

    // Admissions (Top Arc)
    admissions.forEach((adm, idx) => {
      const angle = (idx / Math.max(admissions.length, 1)) * Math.PI - Math.PI / 2;
      const radius = 220;
      const x = 420 + radius * Math.cos(angle);
      const y = 260 + radius * Math.sin(angle);

      resultNodes.push({
        id: adm.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm w-40 text-left">
              <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                <Building2 className="w-3 h-3 text-zinc-300" />
                <span className="text-[9px] uppercase font-mono font-semibold">Admission</span>
              </div>
              <div className="font-bold text-white text-xs truncate">{adm.id}</div>
              <div className="text-[10px] text-zinc-400 truncate">{adm.properties.reason}</div>
            </div>
          ),
          raw: adm,
        },
      });
    });

    // Conditions (Left)
    conditions.forEach((cond, idx) => {
      const x = 70;
      const y = 90 + idx * 85;

      resultNodes.push({
        id: cond.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2.5 bg-zinc-900 border border-zinc-750 rounded-lg shadow-sm w-44 text-left">
              <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                <HeartPulse className="w-3 h-3 text-zinc-300" />
                <span className="text-[9px] uppercase font-mono font-semibold">Condition</span>
              </div>
              <div className="font-medium text-white text-xs truncate">{cond.properties.name || cond.id}</div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{cond.properties.code}</div>
            </div>
          ),
          raw: cond,
        },
      });
    });

    // Medications (Right)
    medications.forEach((med, idx) => {
      const x = 760;
      const y = 80 + idx * 80;

      resultNodes.push({
        id: med.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2.5 bg-zinc-900 border border-zinc-750 rounded-lg shadow-sm w-44 text-left">
              <div className="flex items-center gap-1.5 text-zinc-400 mb-0.5">
                <Pill className="w-3 h-3 text-zinc-300" />
                <span className="text-[9px] uppercase font-mono font-semibold">Medication</span>
              </div>
              <div className="font-bold text-white text-xs truncate">{med.properties.name || med.id}</div>
              <div className="text-[10px] text-zinc-500 truncate">{med.properties.category}</div>
            </div>
          ),
          raw: med,
        },
      });
    });

    // Key Labs (Bottom)
    labs.slice(0, 5).forEach((lab, idx) => {
      const x = 160 + idx * 130;
      const y = 520;

      resultNodes.push({
        id: lab.id,
        position: { x, y },
        data: {
          label: (
            <div className="p-2 bg-zinc-900 border border-zinc-750 rounded-lg shadow-sm w-28 text-center">
              <div className="flex items-center justify-center gap-1 text-zinc-400 mb-0.5">
                <FlaskConical className="w-2.5 h-2.5 text-zinc-300" />
                <span className="text-[9px] uppercase font-mono">Lab</span>
              </div>
              <div className="font-bold text-white text-xs font-mono">
                {lab.properties.value} {lab.properties.unit}
              </div>
              <div className="text-[9px] text-zinc-500 font-mono truncate">{lab.properties.testId}</div>
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
          labelStyle: { fill: '#71717a', fontSize: 9, fontFamily: 'monospace' },
          style: { stroke: '#3f3f46', strokeWidth: 1.2 },
        });
      }
    });

    return { flowNodes: resultNodes, flowEdges: resultEdges };
  }, [nodes, relationships, activeFilter]);

  return (
    <div className="relative w-full h-[600px] bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden shadow-inner">
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
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#18181b" />
        <Controls />
        <MiniMap
          nodeColor="#52525b"
          style={{ background: '#09090b', border: '1px solid #27272a' }}
        />

        <Panel position="top-left">
          <div className="bg-zinc-950/90 backdrop-blur-md p-1.5 rounded-lg border border-zinc-800 flex items-center gap-1 shadow-md">
            <Filter className="w-3 h-3 text-zinc-500 ml-1" />
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 text-xs rounded ${activeFilter === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('Admission')}
              className={`px-2 py-0.5 text-xs rounded ${activeFilter === 'Admission' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-white'}`}
            >
              Admissions
            </button>
            <button
              onClick={() => setActiveFilter('Medication')}
              className={`px-2 py-0.5 text-xs rounded ${activeFilter === 'Medication' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-white'}`}
            >
              Medications
            </button>
            <button
              onClick={() => setActiveFilter('Condition')}
              className={`px-2 py-0.5 text-xs rounded ${activeFilter === 'Condition' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-white'}`}
            >
              Conditions
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-72 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl p-4 shadow-2xl z-20">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                {selectedNode.label}
              </span>
              <span className="font-mono text-xs text-white font-bold">{selectedNode.id}</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            {Object.entries(selectedNode.properties).map(([k, v]) => {
              if (typeof v === 'object' && v !== null) return null;
              return (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">{k}:</span>
                  <span className="text-zinc-200 font-medium break-words bg-zinc-900/60 p-1.5 rounded border border-zinc-850">
                    {String(v)}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedNode.properties.sourceRecordId && (
            <div className="mt-3 pt-2 border-t border-zinc-850">
              <button
                onClick={() => onOpenEvidence(selectedNode.properties.sourceRecordId)}
                className="w-full py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors font-mono"
              >
                <FileText className="w-3 h-3" />
                <span>Inspect [{selectedNode.properties.sourceRecordId}]</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
