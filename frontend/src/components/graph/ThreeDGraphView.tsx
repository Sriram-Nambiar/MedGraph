import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  User,
  Building2,
  Pill,
  FlaskConical,
  HeartPulse,
  FileText,
  Activity,
  Info,
} from 'lucide-react';
import { GraphNode, GraphRelationship } from '../../types';

interface ThreeDGraphViewProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  onOpenEvidence: (recordId: string) => void;
  patientName?: string;
  patientId?: string;
}

// Category color palettes and geometry configurations
const CATEGORY_COLORS: Record<string, { hex: number; css: string; lightHex: number }> = {
  Patient: { hex: 0x10b981, css: '#10b981', lightHex: 0x34d399 },      // Emerald
  Admission: { hex: 0xa855f7, css: '#a855f7', lightHex: 0xc084fc },    // Purple
  Encounter: { hex: 0x6366f1, css: '#6366f1', lightHex: 0x818cf8 },    // Indigo
  Condition: { hex: 0xf43f5e, css: '#f43f5e', lightHex: 0xfb7185 },    // Rose
  Medication: { hex: 0x3b82f6, css: '#3b82f6', lightHex: 0x60a5fa },   // Blue
  Prescription: { hex: 0x0ea5e9, css: '#0ea5e9', lightHex: 0x38bdf8 }, // Sky
  LabResult: { hex: 0xf59e0b, css: '#f59e0b', lightHex: 0xfbbf24 },    // Amber
  LabTest: { hex: 0xd97706, css: '#d97706', lightHex: 0xf59e0b },      // Dark Amber
  ClinicalNote: { hex: 0x14b8a6, css: '#14b8a6', lightHex: 0x2dd4bf }, // Teal
  Doctor: { hex: 0x8b5cf6, css: '#8b5cf6', lightHex: 0xa78bfa },       // Violet
  Default: { hex: 0x71717a, css: '#71717a', lightHex: 0xa1a1aa },      // Zinc
};

export const ThreeDGraphView: React.FC<ThreeDGraphViewProps> = ({
  nodes,
  relationships,
  onOpenEvidence,
  patientName = 'Patient',
  patientId = 'P001',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Filter nodes based on selected category tab
  const filteredNodes = useMemo(() => {
    if (activeCategory === 'ALL') return nodes;
    return nodes.filter(
      (n) => n.label === activeCategory || n.label === 'Patient'
    );
  }, [nodes, activeCategory]);

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  );

  const filteredRelationships = useMemo(() => {
    return relationships.filter(
      (r) => filteredNodeIds.has(r.source) && filteredNodeIds.has(r.target)
    );
  }, [relationships, filteredNodeIds]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.002);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
    camera.position.set(0, 80, 260);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 0.8;
    controls.maxDistance = 600;
    controls.minDistance = 40;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // 5. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2.5, 450);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, 150, 120);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-120, -100, -120);
    scene.add(dirLight2);

    // 6. Background Starfield / Floating Constellation Particles
    const starCount = 600;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = (Math.random() - 0.5) * 800;
      starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x52525b,
      size: 1.8,
      transparent: true,
      opacity: 0.5,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 7. Node Positioning Algorithm in 3D Spherical Shells
    const nodePositions = new Map<string, THREE.Vector3>();
    const nodeMeshes = new Map<string, THREE.Mesh>();
    const interactiveMeshes: THREE.Mesh[] = [];

    // Separate nodes by domain type
    const patientNode = filteredNodes.find((n) => n.label === 'Patient');
    const admissions = filteredNodes.filter((n) => n.label === 'Admission');
    const conditions = filteredNodes.filter((n) => n.label === 'Condition');
    const medications = filteredNodes.filter((n) => n.label === 'Medication' || n.label === 'Prescription');
    const labs = filteredNodes.filter((n) => n.label === 'LabResult' || n.label === 'LabTest');
    const notes = filteredNodes.filter((n) => n.label === 'ClinicalNote');
    const others = filteredNodes.filter(
      (n) => !['Patient', 'Admission', 'Condition', 'Medication', 'Prescription', 'LabResult', 'LabTest', 'ClinicalNote'].includes(n.label)
    );

    // Center Root: Patient Node
    if (patientNode) {
      nodePositions.set(patientNode.id, new THREE.Vector3(0, 0, 0));
    }

    // Helper to position category clusters along spherical bands
    const distributeNodesInBand = (
      nodeList: GraphNode[],
      radius: number,
      elevationAngle: number,
      azimuthOffset: number = 0
    ) => {
      nodeList.forEach((node, idx) => {
        const phi = (idx / Math.max(nodeList.length, 1)) * Math.PI * 2 + azimuthOffset;
        const x = radius * Math.cos(elevationAngle) * Math.cos(phi);
        const y = radius * Math.sin(elevationAngle) + (Math.sin(idx * 2) * 12);
        const z = radius * Math.cos(elevationAngle) * Math.sin(phi);
        nodePositions.set(node.id, new THREE.Vector3(x, y, z));
      });
    };

    distributeNodesInBand(admissions, 85, Math.PI / 4, 0);          // Upper ring
    distributeNodesInBand(conditions, 115, Math.PI / 8, 0.5);      // Mid-upper ring
    distributeNodesInBand(medications, 135, -Math.PI / 10, 1.2);   // Mid ring
    distributeNodesInBand(labs, 155, -Math.PI / 4, 2.0);           // Lower ring
    distributeNodesInBand(notes, 175, Math.PI / 3, 2.8);           // High outer ring
    distributeNodesInBand(others, 140, 0, 3.5);

    // Fallback for any unpositioned nodes
    filteredNodes.forEach((node, idx) => {
      if (!nodePositions.has(node.id)) {
        const theta = (idx / filteredNodes.length) * Math.PI * 2;
        const r = 120 + (idx % 3) * 25;
        nodePositions.set(node.id, new THREE.Vector3(r * Math.cos(theta), (idx % 5 - 2) * 20, r * Math.sin(theta)));
      }
    });

    // 8. Create 3D Node Meshes
    filteredNodes.forEach((node) => {
      const pos = nodePositions.get(node.id) || new THREE.Vector3(0, 0, 0);
      const isPatient = node.label === 'Patient';
      const radius = isPatient ? 8.5 : node.label === 'Admission' ? 5.8 : 4.2;

      const conf = CATEGORY_COLORS[node.label] || CATEGORY_COLORS.Default;
      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);

      const sphereMat = new THREE.MeshStandardMaterial({
        color: conf.hex,
        emissive: conf.hex,
        emissiveIntensity: isPatient ? 0.6 : 0.35,
        roughness: 0.25,
        metalness: 0.6,
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(pos);
      mesh.userData = { node };

      // Add a subtle outer glow shell
      const glowGeo = new THREE.SphereGeometry(radius * 1.35, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: conf.lightHex,
        wireframe: true,
        transparent: true,
        opacity: isPatient ? 0.4 : 0.15,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glowMesh);

      scene.add(mesh);
      nodeMeshes.set(node.id, mesh);
      interactiveMeshes.push(mesh);
    });

    // 9. Create 3D Edges / Connecting Beams
    const edgeLines: THREE.Line[] = [];
    const edgePulsePoints: { curve: THREE.LineCurve3; point: THREE.Vector3; progress: number; mesh: THREE.Mesh }[] = [];

    const pulseGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    filteredRelationships.forEach((rel) => {
      const srcPos = nodePositions.get(rel.source);
      const tgtPos = nodePositions.get(rel.target);

      if (srcPos && tgtPos) {
        const points = [srcPos, tgtPos];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        const lineMat = new THREE.LineBasicMaterial({
          color: 0x3f3f46,
          transparent: true,
          opacity: 0.45,
          linewidth: 1,
        });

        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        edgeLines.push(line);

        // Add an animated signal pulse traveling along the edge
        const curve = new THREE.LineCurve3(srcPos, tgtPos);
        const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
        pulseMesh.position.copy(srcPos);
        scene.add(pulseMesh);

        edgePulsePoints.push({
          curve,
          point: new THREE.Vector3().copy(srcPos),
          progress: Math.random(),
          mesh: pulseMesh,
        });
      }
    });

    // 10. Raycasting for Node Hover and Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const node = hit.userData.node as GraphNode;
        setHoveredNode({
          node,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
        container.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        container.style.cursor = 'default';
      }
    };

    const onClick = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const node = hit.userData.node as GraphNode;
        setSelectedNode(node);
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // 11. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Update OrbitControls
      controls.autoRotate = isAutoRotating;
      controls.update();

      // Animate background starfield gentle oscillation
      starField.rotation.y += 0.0003;
      starField.rotation.x += 0.0001;

      // Animate edge pulses
      edgePulsePoints.forEach((p) => {
        p.progress += delta * 0.45;
        if (p.progress > 1.0) p.progress = 0;
        p.curve.getPoint(p.progress, p.point);
        p.mesh.position.copy(p.point);
      });

      // Animate gentle breathing of patient node
      if (patientNode) {
        const pMesh = nodeMeshes.get(patientNode.id);
        if (pMesh) {
          const s = 1.0 + Math.sin(clock.getElapsedTime() * 2.2) * 0.06;
          pMesh.scale.set(s, s, s);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      cancelAnimationFrame(animationFrameId);

      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [filteredNodes, filteredRelationships, isAutoRotating]);

  const categories = [
    { id: 'ALL', label: 'All Entities', count: nodes.length },
    { id: 'Admission', label: 'Admissions', count: nodes.filter((n) => n.label === 'Admission').length },
    { id: 'Medication', label: 'Medications', count: nodes.filter((n) => n.label === 'Medication' || n.label === 'Prescription').length },
    { id: 'LabResult', label: 'Lab Results', count: nodes.filter((n) => n.label === 'LabResult' || n.label === 'LabTest').length },
    { id: 'Condition', label: 'Conditions', count: nodes.filter((n) => n.label === 'Condition').length },
    { id: 'ClinicalNote', label: 'Notes', count: nodes.filter((n) => n.label === 'ClinicalNote').length },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-[#09090b] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Category Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-xl pointer-events-auto overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Camera & 3D Utility Buttons */}
        <div className="flex items-center gap-2 bg-zinc-950/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-xl pointer-events-auto">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
              isAutoRotating ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'text-zinc-400 hover:bg-zinc-900'
            }`}
            title={isAutoRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px] font-semibold">
              {isAutoRotating ? 'Rotating' : 'Paused'}
            </span>
          </button>

          <button
            onClick={() => controlsRef.current?.reset()}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="px-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Orbit</span>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Hover Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: hoveredNode.x, top: hoveredNode.y }}
        >
          <div className="bg-zinc-950/95 border border-zinc-700/80 p-2.5 rounded-xl shadow-2xl backdrop-blur-md max-w-xs space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[hoveredNode.node.label]?.css || '#71717a' }}
              />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                {hoveredNode.node.label}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                [{hoveredNode.node.id}]
              </span>
            </div>

            <div className="text-xs font-bold text-white leading-snug">
              {hoveredNode.node.properties.name ||
                hoveredNode.node.properties.title ||
                hoveredNode.node.properties.reason ||
                hoveredNode.node.id}
            </div>

            {hoveredNode.node.properties.dosage && (
              <div className="text-[11px] text-zinc-300 font-mono">
                Dose: <strong className="text-white">{hoveredNode.node.properties.dosage}</strong>
              </div>
            )}
            {hoveredNode.node.properties.value !== undefined && (
              <div className="text-[11px] text-zinc-300 font-mono">
                Value: <strong className="text-white">{hoveredNode.node.properties.value} {hoveredNode.node.properties.unit}</strong>
              </div>
            )}
            <div className="text-[9px] font-mono text-zinc-500 pt-0.5">
              Click node to inspect connections
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Legend Bar */}
      <div className="absolute bottom-4 left-4 z-20 bg-zinc-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800 shadow-xl flex items-center gap-4 text-[11px] font-mono pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-300 font-medium">Patient</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span className="text-zinc-300 font-medium">Admissions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-zinc-300 font-medium">Medications</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-zinc-300 font-medium">Lab Results</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="text-zinc-300 font-medium">Conditions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <span className="text-zinc-300 font-medium">Notes</span>
        </div>
      </div>

      {/* Right Slide-over Inspector Drawer for Selected Node */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bottom-4 w-84 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-lg z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[selectedNode.label]?.css || '#71717a' }}
              />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                {selectedNode.label} Inspector
              </span>
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {/* Title Block */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">Entity Identifier</div>
              <div className="text-sm font-bold text-white font-mono">{selectedNode.id}</div>
              <div className="text-xs text-zinc-200 font-medium pt-0.5">
                {selectedNode.properties.name ||
                  selectedNode.properties.title ||
                  selectedNode.properties.reason ||
                  selectedNode.id}
              </div>
            </div>

            {/* Structured Properties */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                Node Properties:
              </span>
              <div className="bg-zinc-900/80 rounded-lg p-2.5 space-y-2 border border-zinc-850">
                {Object.entries(selectedNode.properties).map(([key, val]) => {
                  if (typeof val === 'object' && val !== null) return null;
                  return (
                    <div key={key} className="flex items-start justify-between gap-2 text-[11px]">
                      <span className="font-mono text-zinc-400 shrink-0">{key}:</span>
                      <span className="font-medium text-white text-right truncate">
                        {String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connected Relationships in Graph */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                Connected 3D Links:
              </span>
              <div className="space-y-1.5">
                {relationships
                  .filter((r) => r.source === selectedNode.id || r.target === selectedNode.id)
                  .map((r, idx) => {
                    const isSource = r.source === selectedNode.id;
                    const neighborId = isSource ? r.target : r.source;
                    const neighborNode = nodes.find((n) => n.id === neighborId);

                    return (
                      <div
                        key={idx}
                        onClick={() => neighborNode && setSelectedNode(neighborNode)}
                        className="p-2 rounded bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-850 text-[11px] flex items-center justify-between gap-1.5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[9px] font-mono text-zinc-400">
                            {isSource ? '→' : '←'}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-300 font-bold">
                            {r.type}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                          {neighborId}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Evidence Inspector Action */}
            <div className="pt-3 border-t border-zinc-850">
              <button
                onClick={() => onOpenEvidence(selectedNode.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold border border-zinc-700 transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Raw Evidence [{selectedNode.id}]</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
