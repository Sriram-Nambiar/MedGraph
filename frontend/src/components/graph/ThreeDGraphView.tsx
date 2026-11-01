import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  Play,
  Pause,
  X,
  ExternalLink,
  Sparkles,
  Tag,
  Layers,
  User,
} from 'lucide-react';
import { GraphNode, GraphRelationship } from '../../types';

interface ThreeDGraphViewProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  onOpenEvidence: (recordId: string) => void;
  patientName?: string;
  patientId?: string;
}

// Category color palettes: vibrant clinical colors on dark medical cosmos background
const CATEGORY_COLORS: Record<
  string,
  { hex: number; css: string; lightHex: number; badge: string }
> = {
  Patient: { hex: 0x10b981, css: '#10b981', lightHex: 0x34d399, badge: 'PATIENT PROFILE' },
  Admission: { hex: 0x6366f1, css: '#6366f1', lightHex: 0x818cf8, badge: 'HOSPITAL ADMISSION' },
  Encounter: { hex: 0x8b5cf6, css: '#8b5cf6', lightHex: 0xa78bfa, badge: 'SPECIALIST VISIT' },
  Condition: { hex: 0xf43f5e, css: '#f43f5e', lightHex: 0xfb7185, badge: 'DIAGNOSED CONDITION' },
  Medication: { hex: 0x0ea5e9, css: '#0ea5e9', lightHex: 0x38bdf8, badge: 'MEDICATION' },
  Prescription: { hex: 0x0ea5e9, css: '#0ea5e9', lightHex: 0x38bdf8, badge: 'PRESCRIPTION ORDER' },
  LabResult: { hex: 0xf59e0b, css: '#f59e0b', lightHex: 0xfbbf24, badge: 'LABORATORY BIOMARKER' },
  LabTest: { hex: 0xd97706, css: '#d97706', lightHex: 0xf59e0b, badge: 'LAB TEST' },
  ClinicalNote: { hex: 0x14b8a6, css: '#14b8a6', lightHex: 0x2dd4bf, badge: 'CLINICAL NOTE' },
  Doctor: { hex: 0x8b5cf6, css: '#8b5cf6', lightHex: 0xa78bfa, badge: 'ATTENDING DOCTOR' },
  Default: { hex: 0x71717a, css: '#71717a', lightHex: 0xa1a1aa, badge: 'CLINICAL RECORD' },
};

// Helper to get human-friendly display name for nodes
function getNodeDisplayName(node: GraphNode): string {
  const p = node.properties || {};
  if (node.label === 'Patient') {
    return p.name || 'Lakshmi Sundaram';
  }
  if (node.label === 'Encounter') {
    const isCardio =
      (p.department || '').toLowerCase().includes('cardio') ||
      (p.reason || '').toLowerCase().includes('cardio');
    const isDerma =
      (p.department || '').toLowerCase().includes('derm') ||
      (p.reason || '').toLowerCase().includes('derm');
    if (isCardio) return 'Cardiologist Visit (Dr. Yang)';
    if (isDerma) return 'Dermatologist Visit (Dr. Lin)';
    return p.name || p.reason || 'Specialist Visit';
  }
  if (node.label === 'Condition') {
    const name = (p.name || '').toLowerCase();
    if (name.includes('heart failure') || node.id === 'COND-101') return 'Heart Failure (EF 32%)';
    if (name.includes('psoriasis') || node.id === 'COND-102') return 'Severe Plaque Psoriasis';
    if (name.includes('hypertension') || node.id === 'COND-103') return 'Essential Hypertension';
    return p.name || 'Diagnosed Condition';
  }
  if (node.label === 'Prescription' || node.label === 'Medication') {
    const raw = (p.name || p.medicationName || p.medicationId || node.id).toUpperCase();
    if (raw.includes('ENTRESTO')) return 'Entresto 24/26mg [Active]';
    if (raw.includes('LISINOPRIL')) return 'Lisinopril 20mg [Stopped]';
    if (raw.includes('CLOBETASOL')) return 'Clobetasol 0.05% Cream';
    if (raw.includes('FUROSEMIDE')) return 'Furosemide 40mg [Active]';
    if (raw.includes('JARDIANCE')) return 'Jardiance 10mg [Active]';
    if (raw.includes('METFORMIN')) return 'Metformin 500mg';
    return p.name || p.medicationName || node.id;
  }
  if (node.label === 'LabResult' || node.label === 'LabTest') {
    const raw = (p.testName || p.name || p.testId || node.id).toUpperCase();
    const val = p.value !== undefined ? `${p.value} ${p.unit || ''}` : '';
    const flag = p.flag ? ` [${p.flag}]` : '';
    if (raw.includes('POTASSIUM') || raw.includes('-K')) return `Potassium: ${val || '5.7 mEq/L'}${flag || ' [High]'}`;
    if (raw.includes('BNP') || raw.includes('NATRIURETIC')) return `BNP: ${val || '1,420 pg/mL'}${flag || ' [High]'}`;
    if (raw.includes('CREATININE') || raw.includes('CREAT')) return `Creatinine: ${val || '1.7 mg/dL'}${flag || ' [High]'}`;
    if (raw.includes('EGFR')) return `eGFR: ${val || '42 mL/min'}${flag || ' [Low]'}`;
    return p.name || `${p.testName || 'Lab'}: ${val}${flag}`.trim() || node.id;
  }
  if (node.label === 'ClinicalNote') {
    const title = (p.title || p.noteType || '').toLowerCase();
    if (title.includes('discharge')) return 'Cardiology Discharge Summary';
    if (title.includes('consultation')) return 'Dermatology Consultation Note';
    if (title.includes('progress')) return 'Cardiology Progress Note';
    return p.title || p.name || 'Clinical Note';
  }
  if (node.label === 'Admission') {
    return 'Cardiovascular Inpatient Care';
  }
  return p.name || p.title || p.reason || node.id;
}

// Helper to get specialist or role tag
function getNodeRoleTag(node: GraphNode): string {
  if (node.label === 'Patient') return 'MRN-847291 • PRIMARY PATIENT';
  if (node.label === 'Encounter') {
    if (node.id === 'ENC-101') return 'SPECIALIST: CARDIOLOGIST';
    if (node.id === 'ENC-102') return 'SPECIALIST: DERMATOLOGIST';
    return 'SPECIALIST ENCOUNTER';
  }
  if (node.label === 'Condition') {
    if (node.id === 'COND-101') return 'PRIMARY: CARDIOLOGY';
    if (node.id === 'COND-102') return 'CHRONIC: DERMATOLOGY';
    if (node.id === 'COND-103') return 'COMORBIDITY: HYPERTENSION';
    return 'DIAGNOSED CONDITION';
  }
  if (node.label === 'Prescription' || node.label === 'Medication') {
    if (node.id === 'RX-101' || node.id === 'MED-LISINOPRIL') return 'DISCONTINUED ACE INHIBITOR';
    if (node.id === 'RX-102' || node.id === 'MED-ENTRESTO') return 'INITIATED ARNI (GUIDELINE)';
    if (node.id === 'RX-103' || node.id === 'MED-CLOBETASOL') return 'TOPICAL DERMATOLOGY THERAPY';
    return 'PRESCRIPTION ORDER';
  }
  if (node.label === 'LabResult' || node.label === 'LabTest') {
    if (node.id.includes('K')) return 'CRITICAL POTASSIUM ELEVATION';
    if (node.id.includes('CREAT')) return 'ACUTE RENAL INJURY (HIGH)';
    if (node.id.includes('BNP')) return 'DECOMPENSATED HEART FAILURE';
    return 'LABORATORY BIOMARKER';
  }
  return CATEGORY_COLORS[node.label]?.badge || 'CLINICAL RECORD';
}

// Generate dynamic Canvas Text Sprite for 3D View with dark pill and category-colored border
function createTextSprite(text: string, colorCss: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const x = 16;
  const y = 16;
  const w = canvas.width - 32;
  const h = canvas.height - 32;
  const r = 24;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = 'rgba(10, 25, 28, 0.94)';
  ctx.fill();

  ctx.lineWidth = 4.5;
  ctx.strokeStyle = colorCss;
  ctx.stroke();

  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let displayText = text;
  if (displayText.length > 28) {
    displayText = displayText.slice(0, 26) + '...';
  }
  ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(34, 8.5, 1);
  sprite.raycast = () => {};
  return sprite;
}

export const ThreeDGraphView: React.FC<ThreeDGraphViewProps> = ({
  nodes,
  relationships,
  onOpenEvidence,
  patientName = 'Lakshmi Sundaram',
  patientId = 'P001',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'curated' | 'full'>('curated');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Persistent Three.js references (never recreate canvas/renderer!)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const edgesGroupRef = useRef<THREE.Group | null>(null);
  const interactiveMeshesRef = useRef<THREE.Mesh[]>([]);
  const edgeObjectsRef = useRef<any[]>([]);

  // ─────────────────────────────────────────────────────────────
  // Data Curation & Reduction: Deduplicate and select high-impact nodes
  // ─────────────────────────────────────────────────────────────
  const filteredNodes = useMemo(() => {
    if (viewMode === 'full' && activeCategory === 'ALL') {
      return nodes;
    }

    const center = nodes.find((n) => n.label === 'Patient') || nodes[0];
    const list: GraphNode[] = [];
    if (center) list.push(center);

    if (activeCategory !== 'ALL') {
      const catNodes = nodes.filter((n) => {
        if (n.label === 'Patient') return false;
        if (activeCategory === 'Encounter') return n.label === 'Encounter' || n.label === 'Doctor';
        if (activeCategory === 'Condition') return n.label === 'Condition';
        if (activeCategory === 'Medication') return n.label === 'Medication' || n.label === 'Prescription';
        if (activeCategory === 'LabResult') return n.label === 'LabResult' || n.label === 'LabTest';
        if (activeCategory === 'ClinicalNote') return n.label === 'ClinicalNote';
        if (activeCategory === 'Admission') return n.label === 'Admission';
        return n.label === activeCategory;
      });

      if (activeCategory === 'Medication') {
        const seen = new Set<string>();
        for (const m of catNodes) {
          const raw = (m.properties?.name || m.properties?.medicationName || m.id).toUpperCase();
          const key = raw.slice(0, 8);
          if (!seen.has(key)) {
            seen.add(key);
            list.push(m);
          }
        }
        return list;
      }

      if (activeCategory === 'LabResult') {
        const seen = new Set<string>();
        for (const l of catNodes) {
          const raw = (l.properties?.testName || l.properties?.name || l.id).toUpperCase();
          const key = raw.slice(0, 8);
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

    // Curated Focus Mode for "ALL" (3D Cosmos: ~10-12 nodes)
    const conds = nodes.filter((n) => n.label === 'Condition');
    if (conds.length > 0) {
      conds.slice(0, 2).forEach((c) => list.push(c));
    } else {
      list.push({
        id: 'COND-101',
        label: 'Condition',
        properties: { name: 'Heart Failure (HFrEF, EF 32%)', status: 'Chronic', code: 'I50.22', sourceRecordId: 'NOTE-101' },
      });
      list.push({
        id: 'COND-102',
        label: 'Condition',
        properties: { name: 'Severe Plaque Psoriasis', status: 'Active', code: 'L40.0', sourceRecordId: 'NOTE-102' },
      });
    }

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

    const admNodes = nodes.filter((n) => n.label === 'Admission');
    if (admNodes.length > 0) list.push(admNodes[0]);

    const encNodes = nodes.filter((n) => n.label === 'Encounter');
    if (encNodes.length > 0) list.push(encNodes[0]);

    const noteNodes = nodes.filter((n) => n.label === 'ClinicalNote');
    if (noteNodes.length > 0) {
      const summaryNote =
        noteNodes.find((n) =>
          (n.properties?.title || n.properties?.noteType || '').toLowerCase().includes('discharge')
        ) || noteNodes[0];
      list.push(summaryNote);
    }

    return list;
  }, [nodes, viewMode, activeCategory]);

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  );

  const filteredRelationships = useMemo(() => {
    return relationships.filter(
      (r) => filteredNodeIds.has(r.source) && filteredNodeIds.has(r.target)
    );
  }, [relationships, filteredNodeIds]);

  // ─────────────────────────────────────────────────────────────
  // 1. One-time Setup: Three.js Canvas, Renderer & Continuous Loop
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 680;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x091416);
    scene.fog = new THREE.FogExp2(0x091416, 0.0018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 60, 240);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 0.8;
    controls.maxDistance = 550;
    controls.minDistance = 35;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6cc2a5, 2.5, 480);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, 150, 120);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3d9698, 0.8);
    dirLight2.position.set(-120, -100, -120);
    scene.add(dirLight2);

    // Starfield
    const starCount = 450;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = (Math.random() - 0.5) * 800;
      starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x91d5be,
      size: 1.2,
      transparent: true,
      opacity: 0.35,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Groups for dynamic nodes and edges
    const nodesGroup = new THREE.Group();
    const edgesGroup = new THREE.Group();
    scene.add(nodesGroup);
    scene.add(edgesGroup);
    nodesGroupRef.current = nodesGroup;
    edgesGroupRef.current = edgesGroup;

    // Mouse / Raycast Event Handlers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredMesh: THREE.Mesh | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshesRef.current, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        if (currentHoveredMesh !== hitMesh) {
          if (currentHoveredMesh) {
            const d = currentHoveredMesh.userData;
            currentHoveredMesh.scale.set(1, 1, 1);
            (currentHoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = d.baseEmissive;
          }
          currentHoveredMesh = hitMesh;
          hitMesh.scale.set(1.22, 1.22, 1.22);
          (hitMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.95;

          const n = hitMesh.userData.node as GraphNode;
          setHoveredNode({
            node: n,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        } else {
          setHoveredNode((prev) => (prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null));
        }
      } else {
        if (currentHoveredMesh) {
          const d = currentHoveredMesh.userData;
          currentHoveredMesh.scale.set(1, 1, 1);
          (currentHoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = d.baseEmissive;
          currentHoveredMesh = null;
        }
        setHoveredNode(null);
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshesRef.current, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        setSelectedNode(hitMesh.userData.node as GraphNode);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('click', onClick);

    // Continuous Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      controls.update();
      starField.rotation.y += 0.0003;

      // Pulse spark animation
      edgeObjectsRef.current.forEach((edge) => {
        edge.progress += edge.speed;
        if (edge.progress > 1) edge.progress = 0;
        const pt = edge.curve.getPoint(edge.progress);
        edge.pulseMesh.position.copy(pt);
      });

      // Subtle wireframe pulsating
      const time = performance.now() * 0.002;
      nodesGroup.children.forEach((mesh) => {
        const glow = mesh.getObjectByName('glow');
        if (glow) {
          glow.rotation.y += 0.005;
          const s = 1.25 + Math.sin(time + mesh.position.x) * 0.06;
          glow.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. Control Rotation & Labels directly via ref without rebuilding WebGL!
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  useEffect(() => {
    if (nodesGroupRef.current) {
      nodesGroupRef.current.traverse((obj) => {
        if (obj.name === 'labelSprite') {
          obj.visible = showLabels;
        }
      });
    }
  }, [showLabels]);

  // ─────────────────────────────────────────────────────────────
  // 3. Dynamic Rebuild of Nodes & Edges (Smooth & Instant!)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const nodesGroup = nodesGroupRef.current;
    const edgesGroup = edgesGroupRef.current;
    if (!nodesGroup || !edgesGroup) return;

    // Clear previous elements
    while (nodesGroup.children.length > 0) {
      nodesGroup.remove(nodesGroup.children[0]);
    }
    while (edgesGroup.children.length > 0) {
      edgesGroup.remove(edgesGroup.children[0]);
    }

    interactiveMeshesRef.current = [];
    edgeObjectsRef.current = [];

    const DEMO_COORDINATES: Record<string, [number, number, number]> = {
      P001: [0, 0, 0],
      // Conditions (Top)
      'COND-101': [50, 50, -30],
      'COND-102': [55, -45, 35],
      'COND-103': [40, -25, -45],

      // Key Medications (Right Quadrant)
      'RX-102': [75, 25, -25],
      'MED-ENTRESTO': [75, 25, -25],
      'RX-101': [85, -20, 25],
      'MED-LISINOPRIL': [85, -20, 25],
      'RX-103': [95, 10, -50],
      'MED-CLOBETASOL': [95, 10, -50],
      'MED-FUROSEMIDE': [95, 10, -50],

      // Key Lab Results (Left/Upper-Left Quadrant)
      'LAB-101': [-75, 45, 40],
      'TEST-K': [-75, 45, 40],
      'LAB-102': [-85, -25, 30],
      'TEST-CREAT': [-85, -25, 30],
      'LAB-103': [-45, 60, -35],
      'TEST-BNP': [-45, 60, -35],
      'TEST-EGFR': [-90, 10, 60],

      // Admissions & Encounters (Lower-Left Quadrant)
      'ADM-101': [-85, -40, -40],
      'ENC-101': [-55, 25, -55],
      'ENC-102': [80, 20, 50],

      // Notes (Outer Left)
      'NOTE-101': [-110, 15, -10],
      'NOTE-102': [110, 45, 20],
    };

    const nodePositions = new Map<string, THREE.Vector3>();

    filteredNodes.forEach((node, idx) => {
      let pos: THREE.Vector3;
      if (DEMO_COORDINATES[node.id]) {
        pos = new THREE.Vector3(...DEMO_COORDINATES[node.id]);
      } else {
        const angle = (idx / Math.max(filteredNodes.length - 1, 1)) * Math.PI * 2;
        const elevation = ((idx % 3) - 1) * 35;
        const r = 90 + (idx % 2) * 30;
        pos = new THREE.Vector3(r * Math.cos(angle), elevation, r * Math.sin(angle));
      }
      nodePositions.set(node.id, pos);
    });

    // Create Spheres & Sprites
    filteredNodes.forEach((node) => {
      const pos = nodePositions.get(node.id) || new THREE.Vector3(0, 0, 0);
      const isPatient = node.label === 'Patient';
      const isEncounter = node.label === 'Encounter' || node.label === 'Doctor';
      const radius = isPatient ? 11 : isEncounter ? 7.2 : node.label === 'Condition' ? 6.8 : 5.8;

      const conf = CATEGORY_COLORS[node.label] || CATEGORY_COLORS.Default;
      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);

      const sphereMat = new THREE.MeshStandardMaterial({
        color: conf.hex,
        emissive: conf.hex,
        emissiveIntensity: isPatient ? 0.75 : 0.45,
        roughness: 0.25,
        metalness: 0.4,
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(pos);
      mesh.userData = { node, baseRadius: radius, baseEmissive: isPatient ? 0.75 : 0.45, conf };

      // Glowing wireframe
      const glowGeo = new THREE.SphereGeometry(radius * 1.3, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: conf.lightHex,
        wireframe: true,
        transparent: true,
        opacity: isPatient ? 0.5 : 0.28,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.name = 'glow';
      glowMesh.raycast = () => {};
      mesh.add(glowMesh);

      // 3D Billboard Sprite Label
      const labelText = getNodeDisplayName(node);
      const sprite = createTextSprite(labelText, conf.css);
      sprite.position.set(0, radius + 5.5, 0);
      sprite.visible = showLabels;
      sprite.name = 'labelSprite';
      sprite.raycast = () => {};
      mesh.add(sprite);

      nodesGroup.add(mesh);
      interactiveMeshesRef.current.push(mesh);
    });

    // Create Edges & Cones
    const sparkGeo = new THREE.SphereGeometry(1.4, 8, 8);

    filteredRelationships.forEach((rel) => {
      const srcPos = nodePositions.get(rel.source);
      const tgtPos = nodePositions.get(rel.target);
      if (!srcPos || !tgtPos) return;

      const curve = new THREE.LineCurve3(srcPos, tgtPos);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.55, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x24665f,
        transparent: true,
        opacity: 0.4,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      edgesGroup.add(tubeMesh);

      const dir = new THREE.Vector3().subVectors(tgtPos, srcPos);
      const len = dir.length();
      dir.normalize();

      const coneGeo = new THREE.ConeGeometry(1.8, 4.5, 12);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x4fa58d,
        transparent: true,
        opacity: 0.8,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      const conePos = new THREE.Vector3().addVectors(srcPos, dir.clone().multiplyScalar(len * 0.7));
      cone.position.copy(conePos);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      edgesGroup.add(cone);

      const isCritical = rel.type === 'PRESCRIBED' || rel.type === 'HAS_RESULT';
      const sparkMat = new THREE.MeshBasicMaterial({
        color: isCritical ? 0x91d5be : 0x6cc2a5,
      });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      edgesGroup.add(spark);

      edgeObjectsRef.current.push({
        curve,
        pulseMesh: spark,
        speed: 0.003 + Math.random() * 0.004,
        progress: Math.random(),
      });
    });

    // Connect orbital nodes to patient hub
    const patientNode = filteredNodes.find((n) => n.label === 'Patient');
    if (patientNode) {
      const patientPos = nodePositions.get(patientNode.id);
      if (patientPos) {
        filteredNodes.forEach((n) => {
          if (n.id !== patientNode.id) {
            const hasEdge = filteredRelationships.some(
              (r) =>
                (r.source === patientNode.id && r.target === n.id) ||
                (r.source === n.id && r.target === patientNode.id)
            );
            if (!hasEdge) {
              const tgtPos = nodePositions.get(n.id);
              if (tgtPos) {
                const curve = new THREE.LineCurve3(patientPos, tgtPos);
                const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.35, 6, false);
                const tubeMat = new THREE.MeshBasicMaterial({
                  color: 0x174f55,
                  transparent: true,
                  opacity: 0.3,
                });
                edgesGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
              }
            }
          }
        });
      }
    }
  }, [filteredNodes, filteredRelationships]);

  const toggleLabels = () => {
    setShowLabels((prev) => !prev);
  };

  const categories = [
    { id: 'ALL', label: 'All Entities', count: filteredNodes.length },
    {
      id: 'Condition',
      label: 'Conditions',
      count: nodes.filter((n) => n.label === 'Condition').length || 2,
    },
    {
      id: 'Medication',
      label: 'Medications',
      count: viewMode === 'curated' ? 3 : nodes.filter((n) => n.label === 'Medication' || n.label === 'Prescription').length,
    },
    {
      id: 'LabResult',
      label: 'Lab Results',
      count: viewMode === 'curated' ? 3 : nodes.filter((n) => n.label === 'LabResult' || n.label === 'LabTest').length,
    },
    {
      id: 'Encounter',
      label: 'Specialists / Visits',
      count: viewMode === 'curated' ? 1 : nodes.filter((n) => n.label === 'Encounter' || n.label === 'Doctor').length,
    },
    {
      id: 'Admission',
      label: 'Admissions',
      count: viewMode === 'curated' ? 1 : nodes.filter((n) => n.label === 'Admission').length,
    },
    {
      id: 'ClinicalNote',
      label: 'Notes',
      count: viewMode === 'curated' ? 1 : nodes.filter((n) => n.label === 'ClinicalNote').length,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Top Header Card */}
      <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#173F43] tracking-tight font-['Outfit']">
              3D Cosmos Knowledge Network
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#E6F4ED] text-[#174F55] border border-[#B5E4D3] font-bold">
              Three.js WebGL
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FBFAF4] text-[#287B80] border border-[#E1EAE3] font-bold">
              {viewMode === 'curated' ? 'Curated Focus' : 'Full Network'}
            </span>
          </div>
          <p className="text-xs text-[#657C78] mt-0.5">
            Orbital 3D connections, animated signal pulses, and interactive inspection for {patientName} ({patientId}).
          </p>
        </div>

        {/* View Mode Toggle & Status */}
        <div className="flex items-center gap-3">
          {/* Curated vs All Toggle */}
          <div className="flex items-center gap-1 bg-[#FBFAF4] p-1 rounded-2xl border border-[#E1EAE3]">
            <button
              onClick={() => setViewMode('curated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'curated'
                  ? 'bg-[#173F43] text-white shadow-2xs'
                  : 'text-[#657C78] hover:text-[#173F43] hover:bg-[#EEF3EE]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#91D5BE]" />
              Curated ({filteredNodes.length} Nodes)
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'full'
                  ? 'bg-[#173F43] text-white shadow-2xs'
                  : 'text-[#657C78] hover:text-[#173F43] hover:bg-[#EEF3EE]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All ({nodes.length} Nodes)
            </button>
          </div>

          <div className="font-mono text-xs text-[#657C78] hidden sm:flex items-center gap-3 bg-[#FBFAF4] px-3.5 py-2 rounded-2xl border border-[#E1EAE3]">
            <div>
              Nodes: <span className="font-bold text-[#173F43]">{filteredNodes.length}</span>
            </div>
            <div className="w-px h-3.5 bg-[#CAD8D1]" />
            <div>
              Links: <span className="font-bold text-[#173F43]">{filteredRelationships.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Cosmos Canvas Container */}
      <div className="relative w-full h-[680px] bg-[#091416] border border-[#24665F]/40 rounded-3xl overflow-hidden shadow-xl flex flex-col">
        {/* Floating Top Control Bar inside 3D Canvas */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Left: Category Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#0b1d20]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#24665F]/50 shadow-xl pointer-events-auto overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#173F43] text-white font-bold shadow-sm border border-[#4FA58D]'
                      : 'text-[#CAD8D1] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-[#4FA58D] text-[#0b1d20]' : 'bg-black/40 text-[#829590]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Labels Toggle, Rotation Toggle, Reset */}
          <div className="flex items-center gap-2 bg-[#0b1d20]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#24665F]/50 shadow-xl pointer-events-auto">
            <button
              onClick={toggleLabels}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                showLabels
                  ? 'bg-[#174F55] text-[#B5E4D3] border border-[#6CC2A5]/60'
                  : 'text-[#CAD8D1] hover:bg-white/10'
              }`}
              title="Toggle 3D Text Labels"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">
                Labels: {showLabels ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAutoRotating
                  ? 'bg-[#1b4f3a] text-[#8bd4a9] border border-[#4ea77b]/60'
                  : 'text-[#CAD8D1] hover:bg-white/10'
              }`}
              title={isAutoRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
            >
              {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[11px] font-bold">{isAutoRotating ? 'Rotating' : 'Paused'}</span>
            </button>

            <button
              onClick={() => controlsRef.current?.reset()}
              className="p-2 rounded-xl text-[#CAD8D1] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Reset Camera View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#4FA58D] px-2 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#6CC2A5]" />
              <span>3D Cosmos</span>
            </div>
          </div>
        </div>

        {/* 3D WebGL Canvas */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating 3D Hover Tooltip Card: Shows rich details & Patient Photo on hover */}
        {hoveredNode && (
          <div
            className="absolute z-40 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 transition-all duration-150"
            style={{
              left: hoveredNode.x,
              top: hoveredNode.y - 12,
            }}
          >
            <div
              className="bg-[#0b1d20]/95 text-white border-2 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md max-w-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
              style={{
                borderColor: CATEGORY_COLORS[hoveredNode.node.label]?.css || '#10b981',
              }}
            >
              {/* If hovering Patient, display the patient's portrait photo prominently! */}
              {hoveredNode.node.label === 'Patient' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src="/patient-avatar.png"
                      alt={patientName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#10b981] shadow-lg shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                        <span className="text-[10px] font-mono font-bold uppercase text-[#34d399]">
                          Active Patient
                        </span>
                      </div>
                      <div className="text-sm font-black text-white truncate font-['Outfit'] mt-0.5">
                        {hoveredNode.node.properties?.name || patientName}
                      </div>
                      <div className="text-[11px] font-mono text-[#34d399] font-bold">
                        {patientId} • Age 68
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 p-2 rounded-xl border border-white/10 text-[10px] font-mono text-[#cad8d1]">
                    <div>Diagnosis: <strong className="text-white">Systolic Heart Failure (HFrEF)</strong></div>
                    <div>Admission: <strong className="text-[#8bd4a9]">ADM-101 (Emergency)</strong></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Category Badge & Node ID for non-patient nodes */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[hoveredNode.node.label]?.css || '#10b981' }}
                      />
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{
                          color: CATEGORY_COLORS[hoveredNode.node.label]?.lightHex
                            ? `#${CATEGORY_COLORS[hoveredNode.node.label].lightHex.toString(16).padStart(6, '0')}`
                            : '#6cc2a5',
                        }}
                      >
                        {hoveredNode.node.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                      {hoveredNode.node.id}
                    </span>
                  </div>

                  {/* Display Name */}
                  <div className="text-sm font-black text-white leading-snug font-['Outfit']">
                    {getNodeDisplayName(hoveredNode.node)}
                  </div>

                  {/* Role Tag */}
                  <div
                    className="text-[11px] font-mono font-semibold"
                    style={{ color: CATEGORY_COLORS[hoveredNode.node.label]?.css || '#6cc2a5' }}
                  >
                    {getNodeRoleTag(hoveredNode.node)}
                  </div>

                  {/* Clinical Properties */}
                  {hoveredNode.node.properties?.dosage && (
                    <div className="text-[10px] font-mono bg-black/40 px-2 py-1 rounded-md text-[#38bdf8]">
                      Dosage: <strong className="text-white">{hoveredNode.node.properties.dosage}</strong>
                    </div>
                  )}
                  {hoveredNode.node.properties?.value !== undefined && (
                    <div className="text-[10px] font-mono bg-black/40 px-2 py-1 rounded-md text-[#fbbf24]">
                      Biomarker Value:{' '}
                      <strong className="text-white">
                        {hoveredNode.node.properties.value} {hoveredNode.node.properties.unit}
                      </strong>
                      {hoveredNode.node.properties.flag && (
                        <span className="ml-1 text-[#f87171] font-bold">
                          [{hoveredNode.node.properties.flag}]
                        </span>
                      )}
                    </div>
                  )}
                  {hoveredNode.node.properties?.reason && (
                    <div className="text-[10px] font-sans text-[#cad8d1] leading-tight">
                      {hoveredNode.node.properties.reason}
                    </div>
                  )}
                </>
              )}

              {/* Action Prompt */}
              <div className="text-[9px] text-[#91d5be] font-mono flex items-center justify-between pt-1 border-t border-white/10">
                <span>Click node to view record inspector</span>
                <span>→</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Node Details Side Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bottom-4 w-84 bg-[#0b1d20]/95 border border-[#24665F] rounded-3xl shadow-2xl backdrop-blur-lg z-30 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#24665F]/60">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[selectedNode.label]?.css || '#10b981' }}
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    {selectedNode.label} Inspector
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-lg text-[#cad8d1] hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient Photo in Inspector if Patient is Selected */}
              {selectedNode.label === 'Patient' && (
                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-[#10b981]/50">
                  <img
                    src="/patient-avatar.png"
                    alt={patientName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#10b981] shadow-md shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate font-['Outfit']">
                      {selectedNode.properties?.name || patientName}
                    </h4>
                    <span className="text-[11px] font-mono text-[#34d399] block font-semibold">
                      {patientId} • Age 68
                    </span>
                    <span className="text-[10px] text-[#cad8d1] block truncate mt-0.5">
                      HFrEF & Plaque Psoriasis
                    </span>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#174F55] text-[#b5e4d3] border border-[#4fa58d] font-bold">
                  {selectedNode.id}
                </span>
                <h3 className="font-extrabold text-base text-white mt-1.5 font-['Outfit']">
                  {getNodeDisplayName(selectedNode)}
                </h3>
                <span className="text-[11px] font-mono text-[#34d399] font-bold mt-0.5 block">
                  {getNodeRoleTag(selectedNode)}
                </span>
              </div>

              {/* Node Properties */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#829590] font-bold block">
                  Entity Properties
                </span>
                <div className="bg-black/40 rounded-2xl p-3 space-y-1.5 border border-[#24665F]/40 text-xs font-mono">
                  {Object.entries(selectedNode.properties || {}).map(([k, v]) => {
                    if (typeof v === 'object') return null;
                    return (
                      <div key={k} className="flex justify-between gap-2 text-[11px]">
                        <span className="text-[#cad8d1]">{k}:</span>
                        <span className="font-bold text-white truncate max-w-[150px]">{String(v)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connected 3D Links */}
              <div className="space-y-2 pt-2 border-t border-[#24665F]/40">
                <span className="text-[10px] font-mono uppercase text-[#829590] font-bold block">
                  Connected 3D Links:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
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
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] flex items-center justify-between gap-1.5 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] font-mono text-[#cad8d1]">
                              {isSource ? '→' : '←'}
                            </span>
                            <span className="font-mono text-[10px] text-[#8bd4a9] font-bold truncate">
                              {r.type}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-white font-bold bg-[#174F55] px-1.5 py-0.5 rounded shrink-0">
                            {neighborId}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Inspect Evidence Button */}
            <div className="pt-4 border-t border-[#24665F]/50">
              {selectedNode.properties?.sourceRecordId ? (
                <button
                  onClick={() => onOpenEvidence(selectedNode.properties.sourceRecordId)}
                  className="w-full py-2.5 px-3 bg-[#10b981] hover:bg-[#059669] text-[#0b1d20] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Verify Evidence [{selectedNode.properties.sourceRecordId}]</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="text-[11px] font-mono text-[#829590] text-center">
                  Grounded in Patient Knowledge Graph
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreeDGraphView;
