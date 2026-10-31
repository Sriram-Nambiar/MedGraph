import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface VoxelHeartbeatProps {
  compact?: boolean;
  bpm?: number;
  rhythm?: 'normal' | 'arrhythmia' | 'tachycardia' | 'bradycardia';
  autoRotate?: boolean;
  interactive?: boolean;
  className?: string;
  onBeat?: (intensity: number) => void;
}

interface CubeData {
  baseX: number;
  baseY: number;
  baseZ: number;
  nx: number;
  ny: number;
  layer: number;
  layerNorm: number;
  yNorm: number;
}

// Parametric concentric rings configuration matching Hesam Sanei's Dribbble 'Voxel Heartbeat'
const RINGS_CONFIG = [
  // Inner crater rings stepping outward and forward from deep cavity
  { scale: 0.32, z: -0.35, count: 28, layer: 0 },
  { scale: 0.46, z: -0.15, count: 40, layer: 1 },
  { scale: 0.60, z:  0.08, count: 52, layer: 2 },
  { scale: 0.74, z:  0.30, count: 66, layer: 3 },
  { scale: 0.88, z:  0.48, count: 80, layer: 4 }, // Main front ridge
  // Cascading outer shell volume tapering backward in Z
  { scale: 0.96, z:  0.32, count: 88, layer: 5 },
  { scale: 1.00, z:  0.10, count: 92, layer: 6 },
  { scale: 1.02, z: -0.12, count: 94, layer: 7 },
  { scale: 0.98, z: -0.34, count: 90, layer: 8 },
  { scale: 0.92, z: -0.56, count: 84, layer: 9 },
  { scale: 0.84, z: -0.76, count: 76, layer: 10 },
  { scale: 0.72, z: -0.96, count: 64, layer: 11 },
  { scale: 0.58, z: -1.14, count: 50, layer: 12 },
  { scale: 0.42, z: -1.30, count: 36, layer: 13 },
  { scale: 0.26, z: -1.44, count: 22, layer: 14 },
  { scale: 0.12, z: -1.54, count: 12, layer: 15 },
];

function generateVoxelHeartData(): CubeData[] {
  const cubes: CubeData[] = [];
  const maxLayer = RINGS_CONFIG.length - 1;

  for (const ring of RINGS_CONFIG) {
    const { scale, z, count, layer } = ring;
    const layerNorm = layer / maxLayer;

    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2.0;

      // Mathematical 2D Heart Curve:
      // x = 16 * sin^3(t)
      // y = 13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t)
      const rawX = 16.0 * Math.pow(Math.sin(t), 3);
      const rawY =
        13.0 * Math.cos(t) -
        5.0 * Math.cos(2.0 * t) -
        2.0 * Math.cos(3.0 * t) -
        Math.cos(4.0 * t);

      // Centered coordinates scaled to 3D world space
      const x = (rawX / 16.0) * scale * 2.45;
      const y = ((rawY + 2.0) / 16.0) * scale * 2.45;
      const cubeZ = z * 2.1;

      // Radial 2D normal vector for heartbeat expansion
      const len = Math.hypot(rawX, rawY) || 1.0;
      const nx = rawX / len;
      const ny = rawY / len;

      const yNorm = (y + 2.5) / 5.0; // 0..1 normalized height

      cubes.push({
        baseX: x,
        baseY: y,
        baseZ: cubeZ,
        nx,
        ny,
        layer,
        layerNorm,
        yNorm,
      });
    }
  }

  return cubes;
}

// Physiological cardiac waveform: dual-pulse (Lub-Dub) with systolic ejection and diastolic rebound
function evaluateCardiacWave(phase: number, rhythm: string): number {
  let p = phase % 1.0;
  if (p < 0) p += 1.0;

  if (rhythm === 'arrhythmia') {
    // Irregular fibrillatory jitter + premature ectopic beats
    const jitter = Math.sin(phase * Math.PI * 8.0) * 0.15;
    if (p < 0.2) return Math.max(0, Math.sin((p / 0.2) * Math.PI) + jitter);
    if (p > 0.4 && p < 0.6) return Math.max(0, 0.6 * Math.sin(((p - 0.4) / 0.2) * Math.PI) + jitter);
    return Math.max(0, jitter);
  }

  // Normal Sinus Rhythm (Lub-Dub)
  // 1. Primary Systolic Contraction (Lub): fast spike up at p ~ 0.08, smooth descent to p ~ 0.24
  if (p < 0.24) {
    if (p < 0.08) {
      return Math.sin((p / 0.08) * (Math.PI / 2.0));
    } else {
      return Math.cos(((p - 0.08) / 0.16) * (Math.PI / 2.0));
    }
  }
  // 2. Secondary Diastolic Rebound (Dub): secondary wave from 0.26 to 0.44
  else if (p >= 0.26 && p < 0.44) {
    const subP = (p - 0.26) / 0.18;
    return 0.42 * Math.sin(subP * Math.PI);
  }

  // 3. Resting Diastolic Baseline
  return 0.0;
}

export const VoxelHeartbeatCanvas: React.FC<VoxelHeartbeatProps> = ({
  compact = false,
  bpm = 75,
  rhythm = 'normal',
  autoRotate = true,
  interactive = true,
  className = '',
  onBeat,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References for animation loop
  const animFrameIdRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const coreLightRef = useRef<THREE.PointLight | null>(null);

  const cubesDataRef = useRef<CubeData[]>([]);

  // Reactive state refs to avoid tearing down WebGL on setting changes
  const bpmRef = useRef(bpm);
  const rhythmRef = useRef(rhythm);
  const autoRotateRef = useRef(autoRotate);
  const onBeatRef = useRef(onBeat);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    rhythmRef.current = rhythm;
  }, [rhythm]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    onBeatRef.current = onBeat;
  }, [onBeat]);

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || (compact ? 120 : 600);
    const height = container.clientHeight || (compact ? 120 : 450);

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // 2. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    if (compact) {
      camera.position.set(0, 0.35, 5.8);
    } else {
      // Perspective matching Hesam Sanei's Dribbble render:
      // Three-quarter isometric view from front-right slightly elevated
      camera.position.set(2.8, 1.8, 5.4);
    }
    camera.lookAt(0, 0.2, 0);
    cameraRef.current = camera;

    // 4. Controls
    if (interactive && !compact) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.minDistance = 3.0;
      controls.maxDistance = 12.0;
      controls.maxPolarAngle = Math.PI / 1.5;
      controls.minPolarAngle = Math.PI / 6.0;
      controls.target.set(0, 0.2, 0);
      controlsRef.current = controls;
    }

    // 5. Lighting: Specifically calibrated to create the signature Dribbble specular highlights
    // Key light from high-front-right creating crisp reflections on top cube faces
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(4.0, 7.0, 6.0);
    scene.add(keyLight);

    // Fill light with cool ambient tone
    const fillLight = new THREE.DirectionalLight(0xffd5dc, 1.4);
    fillLight.position.set(-5.0, 4.0, 3.0);
    scene.add(fillLight);

    // Rim light from behind for silhouette pop
    const rimLight = new THREE.DirectionalLight(0xff3355, 2.0);
    rimLight.position.set(0, -4.0, -5.0);
    scene.add(rimLight);

    // Ambient light with subtle deep crimson shadow
    const ambientLight = new THREE.AmbientLight(0x28050e, 1.2);
    scene.add(ambientLight);

    // Interior pulsing point light inside heart core
    const coreLight = new THREE.PointLight(0xff1838, 3.5, 8.0);
    coreLight.position.set(0, 0.2, 0.2);
    scene.add(coreLight);
    coreLightRef.current = coreLight;

    // 6. Generate Cubes & InstancedMesh
    const cubes = generateVoxelHeartData();
    cubesDataRef.current = cubes;
    const totalCubes = cubes.length;

    // Cube size calibrated for discrete voxel spacing
    const cubeSize = compact ? 0.17 : 0.165;
    const boxGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    // High-specular Physical Material for glossy metallic red look
    const boxMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb91c1c, // Vibrant Crimson Base
      roughness: 0.18,
      metalness: 0.12,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      emissive: 0x3b020a,
      emissiveIntensity: 0.35,
    });

    const instancedMesh = new THREE.InstancedMesh(boxGeometry, boxMaterial, totalCubes);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Initialize base matrices and colors
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < totalCubes; i++) {
      const c = cubes[i];
      dummy.position.set(c.baseX, c.baseY, c.baseZ);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      // Gradient color: Front ridge is brighter red, inner and deep layers are richer crimson
      if (c.layer <= 4) {
        // Front crater rings: brighter ruby
        color.setHSL(0.98, 0.95, 0.42 + c.layer * 0.03);
      } else {
        // Outer cascading shell
        color.setHSL(0.98, 0.90, 0.48 - (c.layer - 4) * 0.02);
      }
      instancedMesh.setColorAt(i, color);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;

    // 7. Subtle background floating ember micro-particles (for full mode)
    let emberParticles: THREE.Points | null = null;
    if (!compact) {
      const emberCount = 180;
      const emberGeo = new THREE.BufferGeometry();
      const emberPos = new Float32Array(emberCount * 3);
      for (let i = 0; i < emberCount; i++) {
        emberPos[i * 3] = (Math.random() - 0.5) * 14;
        emberPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
        emberPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1.0;
      }
      emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
      const emberMat = new THREE.PointsMaterial({
        color: 0xff3b5c,
        size: 0.045,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      });
      emberParticles = new THREE.Points(emberGeo, emberMat);
      scene.add(emberParticles);
    }

    // 8. Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || (compact ? 120 : 600);
      const h = container.clientHeight || (compact ? 120 : 450);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    const clock = new THREE.Clock();
    const dummyObj = new THREE.Object3D();
    const dynColor = new THREE.Color();
    let prevPeakTriggered = false;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Calculate cardiac cycle phase
      const currentBpm = bpmRef.current;
      const currentRhythm = rhythmRef.current;
      const beatPeriod = 60.0 / Math.max(30, currentBpm);
      const globalCyclePhase = (elapsedTime / beatPeriod) % 1.0;

      // Detect peak beat for external callback
      const mainWave = evaluateCardiacWave(globalCyclePhase, currentRhythm);
      if (mainWave > 0.8 && !prevPeakTriggered) {
        prevPeakTriggered = true;
        onBeatRef.current?.(mainWave);
      } else if (mainWave < 0.2) {
        prevPeakTriggered = false;
      }

      // Update core light intensity in sync with heartbeat
      if (coreLightRef.current) {
        coreLightRef.current.intensity = 2.5 + mainWave * 6.5;
      }

      // Update OrbitControls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Auto-rotation of the heart group
      if (instancedMeshRef.current) {
        if (autoRotateRef.current) {
          if (compact) {
            instancedMeshRef.current.rotation.y = Math.sin(elapsedTime * 0.8) * 0.25;
            instancedMeshRef.current.rotation.x = Math.sin(elapsedTime * 0.5) * 0.08;
          } else {
            instancedMeshRef.current.rotation.y += 0.0035;
          }
        }

        // Animate each voxel cube with physiological cardiac propagation wave
        const mesh = instancedMeshRef.current;
        const cubesList = cubesDataRef.current;
        const total = cubesList.length;

        for (let i = 0; i < total; i++) {
          const c = cubesList[i];

          // Traveling wave: inner crater leads, outer cascading layers lag; atria lead ventricles
          const wavePhaseDelay = c.layerNorm * 0.14 + (1.0 - c.yNorm) * 0.06;
          const cubePhase = (globalCyclePhase - wavePhaseDelay + 1.0) % 1.0;
          const wave = evaluateCardiacWave(cubePhase, currentRhythm);

          // Displacements
          // 1. Radial expansion along normal
          const radialPush = wave * 0.18;
          // 2. Forward push along Z axis (creates the iconic deep pumping pulse)
          const zPush = wave * 0.32;
          // 3. Dynamic scaling of each cube
          const scale = 1.0 + wave * 0.20;

          dummyObj.position.set(
            c.baseX + c.nx * radialPush,
            c.baseY + c.ny * radialPush,
            c.baseZ + zPush
          );
          dummyObj.scale.set(scale, scale, scale);
          dummyObj.updateMatrix();
          mesh.setMatrixAt(i, dummyObj.matrix);

          // Dynamic Color & Emissive Surge during contraction
          if (mesh.instanceColor) {
            if (wave > 0.05) {
              // Pulse towards glowing vermilion/hot pink
              dynColor.setRGB(
                0.85 + wave * 0.15,
                0.08 + wave * 0.35,
                0.12 + wave * 0.25
              );
            } else {
              // Resting deep ruby red
              if (c.layer <= 4) {
                dynColor.setHSL(0.98, 0.95, 0.42 + c.layer * 0.03);
              } else {
                dynColor.setHSL(0.98, 0.90, 0.48 - (c.layer - 4) * 0.02);
              }
            }
            mesh.setColorAt(i, dynColor);
          }
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }

      // Drift ember particles
      if (emberParticles) {
        emberParticles.rotation.y = elapsedTime * 0.02;
        emberParticles.rotation.x = Math.sin(elapsedTime * 0.015) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      boxGeometry.dispose();
      boxMaterial.dispose();
      renderer.dispose();
    };
  }, [compact, interactive]);

  // Synchronize dynamic prop updates without tearing down the WebGL context
  useEffect(() => {
    // BPM and rhythm are consumed inside animate() via closure ref or dynamic evaluation
  }, [bpm, rhythm, autoRotate]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden ${className}`}
      style={{ touchAction: interactive && !compact ? 'none' : 'auto' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
