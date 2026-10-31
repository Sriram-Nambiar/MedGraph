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
const CATEGORY_COLORS: Record<string, { hex: number; css: string; lightHex: number; badge: string }> = {
  Patient: { hex: 0x10b981, css: '#10b981', lightHex: 0x34d399, badge: 'PATIENT PROFILE' },
  Admission: { hex: 0xa855f7, css: '#a855f7', lightHex: 0xc084fc, badge: 'HOSPITAL ADMISSION' },
  Encounter: { hex: 0x6366f1, css: '#6366f1', lightHex: 0x818cf8, badge: 'SPECIALIST VISIT' },
  Condition: { hex: 0xf43f5e, css: '#f43f5e', lightHex: 0xfb7185, badge: 'DIAGNOSED CONDITION' },
  Medication: { hex: 0x3b82f6, css: '#3b82f6', lightHex: 0x60a5fa, badge: 'MEDICATION' },
  Prescription: { hex: 0x0ea5e9, css: '#0ea5e9', lightHex: 0x38bdf8, badge: 'PRESCRIPTION ORDER' },
  LabResult: { hex: 0xf59e0b, css: '#f59e0b', lightHex: 0xfbbf24, badge: 'LABORATORY BIOMARKER' },
  LabTest: { hex: 0xd97706, css: '#d97706', lightHex: 0xf59e0b, badge: 'LAB TEST' },
  ClinicalNote: { hex: 0x14b8a6, css: '#14b8a6', lightHex: 0x2dd4bf, badge: 'CLINICAL NOTE' },
  Doctor: { hex: 0x8b5cf6, css: '#8b5cf6', lightHex: 0xa78bfa, badge: 'ATTENDING DOCTOR' },
  Default: { hex: 0x71717a, css: '#71717a', lightHex: 0xa1a1aa, badge: 'CLINICAL RECORD' },
};

// Helper to get primary display name for any node
function getNodeDisplayName(node: GraphNode): string {
  const p = node.properties || {};
  if (node.label === 'Patient') {
    return p.name || 'Eleanor Vance';
  }
  if (node.label === 'Encounter') {
    const isCardio = (p.department || '').toLowerCase().includes('cardio') || (p.reason || '').toLowerCase().includes('cardio');
    const isDerma = (p.department || '').toLowerCase().includes('derm') || (p.reason || '').toLowerCase().includes('derm');
    if (isCardio) return 'Cardiologist Visit (Dr. Yang)';
    if (isDerma) return 'Dermatologist Visit (Dr. Lin)';
    return p.name || p.reason || 'Specialist Encounter';
  }
  if (node.label === 'Condition') {
    if (node.id === 'COND-101') return 'Heart Failure (HFrEF, EF 32%)';
    if (node.id === 'COND-102') return 'Severe Plaque Psoriasis';
    if (node.id === 'COND-103') return 'Essential Hypertension';
    return p.name || 'Diagnosed Condition';
  }
  if (node.label === 'Prescription' || node.label === 'Medication') {
    if (node.id === 'RX-101') return 'Lisinopril 20mg [Stopped]';
    if (node.id === 'RX-102') return 'Entresto 24/26mg [Active]';
    if (node.id === 'RX-103') return 'Clobetasol 0.05% Cream';
    return p.name || p.medicationName || p.medicationId || 'Prescription';
  }
  if (node.label === 'LabResult') {
    if (node.id === 'LAB-101') return 'Potassium: 5.7 mEq/L [High]';
    if (node.id === 'LAB-102') return 'Creatinine: 2.1 mg/dL [High]';
    if (node.id === 'LAB-103') return 'BNP: 1,250 pg/mL [High]';
    return p.name || `${p.testName || 'Lab'}: ${p.value || ''} ${p.unit || ''}`.trim();
  }
  if (node.label === 'ClinicalNote') {
    if (node.id === 'NOTE-101') return 'Cardiology Inpatient Summary';
    if (node.id === 'NOTE-102') return 'Dermatology Consultation Note';
    return p.title || p.name || 'Clinical Note';
  }
  if (node.label === 'Admission') {
    return 'Cardiovascular Inpatient Care';
  }
  return p.name || p.title || p.reason || node.id;
}

// Helper to get specialist or role tag
function getNodeRoleTag(node: GraphNode): string {
  if (node.label === 'Encounter') {
    if (node.id === 'ENC-101') return 'SPECIALIST: CARDIOLOGIST';
    if (node.id === 'ENC-102') return 'SPECIALIST: DERMATOLOGIST';
    return 'SPECIALIST ENCOUNTER';
  }
  if (node.label === 'Condition') {
    if (node.id === 'COND-101') return 'DISEASE 1 OF 3 (CARDIOLOGY)';
    if (node.id === 'COND-102') return 'DISEASE 2 OF 3 (DERMATOLOGY)';
    if (node.id === 'COND-103') return 'DISEASE 3 OF 3 (CARDIOVASCULAR)';
    return 'DIAGNOSED CONDITION';
  }
  if (node.label === 'Prescription' || node.label === 'Medication') {
    if (node.id === 'RX-101') return 'DISCONTINUED ACE INHIBITOR';
    if (node.id === 'RX-102') return 'INITIATED ARNI (GUIDELINE)';
    if (node.id === 'RX-103') return 'TOPICAL DERMATOLOGY THERAPY';
    return 'PRESCRIPTION ORDER';
  }
  if (node.label === 'LabResult') {
    if (node.id === 'LAB-101') return 'CRITICAL POTASSIUM ELEVATION';
    if (node.id === 'LAB-102') return 'ACUTE RENAL INJURY (HIGH)';
    if (node.id === 'LAB-103') return 'DECOMPENSATED HEART FAILURE';
    return 'LABORATORY BIOMARKER';
  }
  if (node.label === 'ClinicalNote') {
    if (node.id === 'NOTE-101') return 'CARDIOLOGIST INPATIENT NOTE';
    if (node.id === 'NOTE-102') return 'DERMATOLOGIST CLINIC NOTE';
    return 'CLINICAL DOCUMENT';
  }
  return CATEGORY_COLORS[node.label]?.badge || 'CLINICAL ENTITY';
}

// Generate dynamic Canvas Text Sprite for 3D View
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

  ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = colorCss;
  ctx.stroke();

  ctx.font = 'bold 30px sans-serif';
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
  sprite.scale.set(40, 10, 1);
  return sprite;
}

export const ThreeDGraphView: React.FC<ThreeDGraphViewProps> = ({
  nodes,
  relationships,
  onOpenEvidence,
  patientName = 'Eleanor Vance',
  patientId = 'P001',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const controlsRef = useRef<OrbitControls | null>(null);

  const filteredNodes = useMemo(() => {
    if (activeCategory === 'ALL') return nodes;
    if (activeCategory === 'Encounter') return nodes.filter((n) => n.label === 'Encounter' || n.label === 'Patient');
    if (activeCategory === 'Condition') return nodes.filter((n) => n.label === 'Condition' || n.label === 'Patient');
    if (activeCategory === 'Medication') return nodes.filter((n) => n.label === 'Medication' || n.label === 'Prescription' || n.label === 'Patient');
    if (activeCategory === 'LabResult') return nodes.filter((n) => n.label === 'LabResult' || n.label === 'LabTest' || n.label === 'Patient');
    if (activeCategory === 'ClinicalNote') return nodes.filter((n) => n.label === 'ClinicalNote' || n.label === 'Patient');
    if (activeCategory === 'Admission') return nodes.filter((n) => n.label === 'Admission' || n.label === 'Patient');
    return nodes.filter((n) => n.label === activeCategory || n.label === 'Patient');
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.0018);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 60, 240);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 0.7;
    controls.maxDistance = 550;
    controls.minDistance = 35;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 0.6;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 3.0, 500);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight1.position.set(120, 150, 120);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.9);
    dirLight2.position.set(-120, -100, -120);
    scene.add(dirLight2);

    // Background Starfield
    const starCount = 500;
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
      size: 1.6,
      transparent: true,
      opacity: 0.45,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    const nodePositions = new Map<string, THREE.Vector3>();
    const nodeMeshes = new Map<string, THREE.Mesh>();
    const interactiveMeshes: THREE.Mesh[] = [];

    // Structured Coordinates for clean demo viewing
    const DEMO_COORDINATES: Record<string, [number, number, number]> = {
      P001: [0, 0, 0],
      'ENC-101': [-75, 30, 25],
      'ADM-101': [-110, 55, -20],
      'COND-101': [-90, -10, 45],
      'COND-103': [-80, -35, -35],
      'RX-101': [-130, 20, 40],
      'RX-102': [-135, -20, 20],
      'LAB-101': [-95, 45, 80],
      'LAB-102': [-125, 40, -70],
      'LAB-103': [-65, 75, 20],
      'NOTE-101': [-145, 60, 10],
      'ENC-102': [85, 25, 20],
      'COND-102': [100, -25, 35],
      'RX-103': [130, 15, 30],
      'NOTE-102': [115, 60, -15],
    };

    filteredNodes.forEach((node, idx) => {
      let pos: THREE.Vector3;
      if (DEMO_COORDINATES[node.id]) {
        pos = new THREE.Vector3(...DEMO_COORDINATES[node.id]);
      } else {
        const angle = (idx / Math.max(filteredNodes.length, 1)) * Math.PI * 2;
        const radius = 100 + (idx % 3) * 20;
        pos = new THREE.Vector3(
          radius * Math.cos(angle),
          ((idx % 4) - 1.5) * 25,
          radius * Math.sin(angle)
        );
      }
      nodePositions.set(node.id, pos);
    });

    filteredNodes.forEach((node) => {
      const pos = nodePositions.get(node.id) || new THREE.Vector3(0, 0, 0);
      const isPatient = node.label === 'Patient';
      const isEncounter = node.label === 'Encounter';
      const radius = isPatient ? 9.5 : isEncounter ? 6.5 : node.label === 'Condition' ? 5.8 : 4.8;

      const conf = CATEGORY_COLORS[node.label] || CATEGORY_COLORS.Default;
      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);

      const sphereMat = new THREE.MeshStandardMaterial({
        color: conf.hex,
        emissive: conf.hex,
        emissiveIntensity: isPatient ? 0.7 : 0.4,
        roughness: 0.2,
        metalness: 0.6,
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(pos);
      mesh.userData = { node, baseRadius: radius, baseEmissive: isPatient ? 0.7 : 0.4 };

      // Glow wireframe shell
      const glowGeo = new THREE.SphereGeometry(radius * 1.35, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: conf.lightHex,
        wireframe: true,
        transparent: true,
        opacity: isPatient ? 0.45 : 0.22,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.name = 'glow';
      mesh.add(glowMesh);

      // 3D Billboard Sprite Label
      const labelText = getNodeDisplayName(node);
      const sprite = createTextSprite(labelText, conf.css);
      sprite.position.set(0, radius + 5.5, 0);
      sprite.visible = showLabels;
      mesh.add(sprite);

      scene.add(mesh);
      nodeMeshes.set(node.id, mesh);
      interactiveMeshes.push(mesh);
    });

    const edgeLines: { line: THREE.Line; source: string; target: string }[] = [];
    const edgePulsePoints: { curve: THREE.LineCurve3; point: THREE.Vector3; progress: number; mesh: THREE.Mesh }[] = [];

    const pulseGeo = new THREE.SphereGeometry(1.4, 8, 8);
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
        edgeLines.push({ line, source: rel.source, target: rel.target });

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

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentHoveredMesh: THREE.Mesh | null = null;

    const resetHighlights = () => {
      nodeMeshes.forEach((mesh) => {
        mesh.scale.set(1, 1, 1);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = mesh.userData.baseEmissive || 0.4;
        mat.opacity = 1.0;
        mat.transparent = false;
        const glow = mesh.getObjectByName('glow') as THREE.Mesh;
        if (glow) {
          const gMat = glow.material as THREE.MeshBasicMaterial;
          gMat.opacity = mesh.userData.node.label === 'Patient' ? 0.45 : 0.22;
        }
      });

      edgeLines.forEach(({ line }) => {
        const mat = line.material as THREE.LineBasicMaterial;
        mat.color.setHex(0x3f3f46);
        mat.opacity = 0.45;
      });
    };

    const onPointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const node = hit.userData.node as GraphNode;

        if (currentHoveredMesh !== hit) {
          resetHighlights();
          currentHoveredMesh = hit;

          // Scale hovered node & boost glow
          hit.scale.set(1.35, 1.35, 1.35);
          const hitMat = hit.material as THREE.MeshStandardMaterial;
          hitMat.emissiveIntensity = 0.95;

          const glow = hit.getObjectByName('glow') as THREE.Mesh;
          if (glow) {
            const gMat = glow.material as THREE.MeshBasicMaterial;
            gMat.opacity = 0.75;
          }

          // Highlight connected edges
          const connectedNodeIds = new Set<string>([node.id]);
          edgeLines.forEach(({ line, source, target }) => {
            if (source === node.id || target === node.id) {
              const mat = line.material as THREE.LineBasicMaterial;
              mat.color.setHex(0x38bdf8);
              mat.opacity = 1.0;
              connectedNodeIds.add(source);
              connectedNodeIds.add(target);
            }
          });

          // Dim unconnected nodes
          nodeMeshes.forEach((mesh, id) => {
            if (!connectedNodeIds.has(id)) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.transparent = true;
              mat.opacity = 0.35;
            }
          });
        }

        setHoveredNode({
          node,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
        container.style.cursor = 'pointer';
      } else {
        if (currentHoveredMesh) {
          resetHighlights();
          currentHoveredMesh = null;
        }
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

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      controls.autoRotate = isAutoRotating;
      controls.update();

      starField.rotation.y += 0.0002;
      starField.rotation.x += 0.0001;

      edgePulsePoints.forEach((p) => {
        p.progress += delta * 0.45;
        if (p.progress > 1.0) p.progress = 0;
        p.curve.getPoint(p.progress, p.point);
        p.mesh.position.copy(p.point);
      });

      const pMesh = nodeMeshes.get(patientId);
      if (pMesh && pMesh !== currentHoveredMesh) {
        const s = 1.0 + Math.sin(clock.getElapsedTime() * 2.2) * 0.05;
        pMesh.scale.set(s, s, s);
      }

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
  }, [filteredNodes, filteredRelationships, isAutoRotating, showLabels, patientId]);

  const toggleLabels = () => {
    setShowLabels((prev) => !prev);
  };

  const categories = [
    { id: 'ALL', label: 'All Entities', count: nodes.length },
    { id: 'Encounter', label: 'Specialists / Visits', count: nodes.filter((n) => n.label === 'Encounter').length },
    { id: 'Condition', label: 'Conditions', count: nodes.filter((n) => n.label === 'Condition').length },
    { id: 'Medication', label: 'Medications', count: nodes.filter((n) => n.label === 'Medication' || n.label === 'Prescription').length },
    { id: 'LabResult', label: 'Lab Results', count: nodes.filter((n) => n.label === 'LabResult' || n.label === 'LabTest').length },
    { id: 'ClinicalNote', label: 'Notes', count: nodes.filter((n) => n.label === 'ClinicalNote').length },
    { id: 'Admission', label: 'Admissions', count: nodes.filter((n) => n.label === 'Admission').length },
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
          {/* Toggle Labels */}
          <button
            onClick={toggleLabels}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
              showLabels
                ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
            title="Toggle 3D Text Labels"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">
              Labels: {showLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Auto Rotation */}
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
              isAutoRotating
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
            title={isAutoRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px] font-semibold">
              {isAutoRotating ? 'Rotating' : 'Paused'}
            </span>
          </button>

          {/* Reset Camera View */}
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
            <span>3D Cosmos</span>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* High-Clarity Floating Hover Card (What is it while hovering) */}
      {hoveredNode && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: Math.max(160, Math.min(window.innerWidth - 340, hoveredNode.x)),
            top: hoveredNode.y,
          }}
        >
          <div
            className="bg-zinc-950/95 border-2 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-sm space-y-2.5"
            style={{ borderColor: CATEGORY_COLORS[hoveredNode.node.label]?.css || '#3f3f46' }}
          >
            {/* Category Badge Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[hoveredNode.node.label]?.css || '#10b981' }}
                />
                <span
                  className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[hoveredNode.node.label]?.css}20`,
                    color: CATEGORY_COLORS[hoveredNode.node.label]?.css || '#ffffff',
                  }}
                >
                  {getNodeRoleTag(hoveredNode.node)}
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {hoveredNode.node.id}
              </span>
            </div>

            {/* Primary Big Title */}
            <div className="text-base font-bold text-white leading-tight">
              {getNodeDisplayName(hoveredNode.node)}
            </div>

            {/* Structured Clinical Details */}
            <div className="space-y-1.5 text-xs text-zinc-300 font-sans border-t border-zinc-850 pt-2">
              {hoveredNode.node.label === 'Encounter' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Specialist:</span>
                    <strong className="text-emerald-300">
                      {hoveredNode.node.id === 'ENC-101' ? 'Dr. Cristina Yang, MD (Cardiologist)' : 'Dr. Maya Lin, MD (Dermatologist)'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Department:</span>
                    <span className="text-white font-medium">{hoveredNode.node.properties.department}</span>
                  </div>
                  {hoveredNode.node.properties.reason && (
                    <div className="text-[11px] text-zinc-400 pt-1 leading-snug">
                      "{hoveredNode.node.properties.reason}"
                    </div>
                  )}
                </>
              )}

              {hoveredNode.node.label === 'Condition' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">ICD-10 Code:</span>
                    <span className="font-mono text-rose-300 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded">
                      {hoveredNode.node.properties.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Clinical Status:</span>
                    <span className="text-white font-medium">{hoveredNode.node.properties.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Domain:</span>
                    <span className="text-zinc-200">{hoveredNode.node.properties.category}</span>
                  </div>
                </>
              )}

              {(hoveredNode.node.label === 'Prescription' || hoveredNode.node.label === 'Medication') && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Status:</span>
                    <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      hoveredNode.node.properties.status === 'Discontinued'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    }`}>
                      {hoveredNode.node.properties.status || 'Active'}
                    </span>
                  </div>
                  {hoveredNode.node.properties.dosage && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400 font-mono">Dosage:</span>
                      <strong className="text-white">{hoveredNode.node.properties.dosage} ({hoveredNode.node.properties.frequency || 'Daily'})</strong>
                    </div>
                  )}
                  {hoveredNode.node.properties.reason && (
                    <div className="text-[11px] text-zinc-300 pt-1 leading-snug">
                      {hoveredNode.node.properties.reason}
                    </div>
                  )}
                </>
              )}

              {hoveredNode.node.label === 'LabResult' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Result Value:</span>
                    <span className="text-amber-300 font-bold font-mono text-sm">
                      {hoveredNode.node.properties.value} {hoveredNode.node.properties.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Flag:</span>
                    <span className="text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                      {hoveredNode.node.properties.flag || 'High'}
                    </span>
                  </div>
                  {hoveredNode.node.properties.notes && (
                    <div className="text-[11px] text-zinc-300 pt-1 leading-snug">
                      {hoveredNode.node.properties.notes}
                    </div>
                  )}
                </>
              )}

              {hoveredNode.node.label === 'ClinicalNote' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Note Type:</span>
                    <span className="text-teal-300 font-medium">{hoveredNode.node.properties.noteType}</span>
                  </div>
                  {hoveredNode.node.properties.text && (
                    <div className="text-[11px] text-zinc-300 italic pt-1 line-clamp-3 leading-relaxed">
                      "{hoveredNode.node.properties.text.slice(0, 160)}..."
                    </div>
                  )}
                </>
              )}

              {hoveredNode.node.label === 'Patient' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Demographics:</span>
                    <span className="text-white font-medium">68y Female</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Specialists:</span>
                    <span className="text-emerald-300 font-medium">Cardiologist & Dermatologist</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400 font-mono">Total Diseases:</span>
                    <span className="text-rose-300 font-bold font-mono">3 Diagnosed Conditions</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-850 flex items-center justify-between">
              <span>Click node to open inspector</span>
              <span className="text-emerald-400">Connected 3D Entity</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Legend Bar */}
      <div className="absolute bottom-4 left-4 z-20 bg-zinc-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800 shadow-xl flex flex-wrap items-center gap-4 text-[11px] font-mono pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-300 font-medium">Patient</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <span className="text-zinc-300 font-medium">Specialists (Cardio & Derm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="text-zinc-300 font-medium">Conditions (3 Diseases)</span>
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
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <span className="text-zinc-300 font-medium">Clinical Notes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span className="text-zinc-300 font-medium">Admissions</span>
        </div>
      </div>

      {/* Right Slide-over Inspector Drawer for Selected Node */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bottom-4 w-88 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-lg z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
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

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">Entity Identifier</div>
              <div className="text-sm font-bold text-white font-mono">{selectedNode.id}</div>
              <div className="text-xs text-zinc-200 font-medium pt-0.5">
                {getNodeDisplayName(selectedNode)}
              </div>
              <div className="text-[11px] font-mono text-emerald-400 pt-0.5">
                {getNodeRoleTag(selectedNode)}
              </div>
            </div>

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
