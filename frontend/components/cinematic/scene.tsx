"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import { introState } from "./state";

/* ── Scroll choreography keyframes ─────────────────────────────
   cam = camera position, rotY = model heading, explode = 0..1
   disassembly, mon = monitor screen brightness. Sampled by
   progress with smoothstep easing between neighbours.          */
type Key = { p: number; cam: [number, number, number]; rotY: number; explode: number; mon: number };
const KEYS: Key[] = [
  { p: 0.0,  cam: [0.0, 0.15, 4.2],  rotY: -0.3, explode: 0,   mon: 0 },
  { p: 0.13, cam: [0.7, 0.25, 3.3],  rotY: 0.9,  explode: 0,   mon: 0 },
  { p: 0.22, cam: [0.15, 0.1, 2.5],  rotY: 1.9,  explode: 1,   mon: 0 },    // exploded
  { p: 0.38, cam: [-0.2, 0.15, 3.2], rotY: 3.2,  explode: 0,   mon: 0 },    // reassembled
  { p: 0.46, cam: [0.1, -0.25, 2.9], rotY: 3.9,  explode: 0,   mon: 0 },    // ch1 — low angle
  { p: 0.58, cam: [1.4, 0.3, 2.7],   rotY: 4.9,  explode: 0,   mon: 0.25 }, // ch2 — side profile
  { p: 0.70, cam: [0.55, 0.65, 2.1], rotY: 6.1,  explode: 0,   mon: 1 },    // ch3 — monitor close-up
  { p: 0.82, cam: [-0.9, 0.55, 2.9], rotY: 7.1,  explode: 0.3, mon: 0.5 },  // ch4 — rings drift
  { p: 1.0,  cam: [0.0, 0.3, 3.9],   rotY: 8.2,  explode: 0,   mon: 0.6 },  // beauty shot
];

// Finale hotspot camera views (index matches the DOM hotspot list).
export const HOTSPOT_VIEWS: { cam: [number, number, number]; rotY: number }[] = [
  { cam: [0.1, -0.15, 2.7], rotY: 0.35 },  // CHALLENGES — front, low
  { cam: [1.5, 0.35, 2.4],  rotY: 1.15 },  // LEARNING HUB — side
  { cam: [0.55, 0.7, 2.0],  rotY: -0.4 },  // AI TOOLS — monitor
  { cam: [-1.2, 0.65, 2.6], rotY: 2.2 },   // YOUR PROGRESS — top-left
];

const smooth = (t: number) => t * t * (3 - 2 * t);

function sampleKeys(p: number): { cam: THREE.Vector3; rotY: number; explode: number; mon: number } {
  let a = KEYS[0];
  let b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (p >= KEYS[i].p && p <= KEYS[i + 1].p) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  }
  const t = smooth(Math.min(1, Math.max(0, (p - a.p) / Math.max(1e-5, b.p - a.p))));
  return {
    cam: new THREE.Vector3(
      a.cam[0] + (b.cam[0] - a.cam[0]) * t,
      a.cam[1] + (b.cam[1] - a.cam[1]) * t,
      a.cam[2] + (b.cam[2] - a.cam[2]) * t,
    ),
    rotY: a.rotY + (b.rotY - a.rotY) * t,
    explode: a.explode + (b.explode - a.explode) * t,
    mon: a.mon + (b.mon - a.mon) * t,
  };
}

// Shortest-path angle approach so hotspot moves never spin the long way.
function approachAngle(current: number, target: number, k: number) {
  const TWO_PI = Math.PI * 2;
  let d = (target - current) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return current + d * k;
}

/* ── Monitor screen: a tiny editing-timeline UI drawn to a canvas ── */
function makeTimelineTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 512; c.height = 320;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#0a0e1a"; g.fillRect(0, 0, 512, 320);
  g.fillStyle = "#131a2c"; g.fillRect(0, 0, 512, 42);           // top bar
  g.fillStyle = "#f5b942"; g.font = "bold 20px monospace"; g.fillText("EDITMENTOR", 14, 28);
  // preview area
  g.fillStyle = "#101527"; g.fillRect(14, 56, 484, 120);
  g.strokeStyle = "#26304e"; g.strokeRect(14, 56, 484, 120);
  // timeline tracks
  const rows = [
    { y: 196, clips: [[14, 120, "#3b82f6"], [142, 90, "#3b82f6"], [240, 150, "#2563eb"], [398, 100, "#3b82f6"]] },
    { y: 232, clips: [[40, 90, "#8a5cf6"], [138, 170, "#7c4dee"], [316, 120, "#8a5cf6"]] },
    { y: 268, clips: [[14, 200, "#f5b942"], [222, 130, "#e8a52e"], [360, 138, "#f5b942"]] },
  ];
  for (const r of rows) {
    g.fillStyle = "#121830"; g.fillRect(14, r.y, 484, 26);
    for (const [x, w, col] of r.clips as [number, number, string][]) {
      g.fillStyle = col; g.fillRect(x, r.y + 2, w, 22);
      g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(x, r.y + 2, w, 4);
    }
  }
  // playhead
  g.fillStyle = "#ffd166"; g.fillRect(255, 186, 3, 112);
  g.beginPath(); g.moveTo(246, 186); g.lineTo(268, 186); g.lineTo(257, 198); g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

const BODY = "#191d26";
const DARK = "#101318";
const RING = "#2a3040";

function CineCamera({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const lens = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const matte = useRef<THREE.Group>(null);
  const monitor = useRef<THREE.Group>(null);
  const handle = useRef<THREE.Group>(null);
  const sensorMat = useRef<THREE.MeshStandardMaterial>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const screenTex = useMemo(makeTimelineTexture, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const d = Math.min(1, dt * 3.5);
    const p = animate ? introState.progress : 0;
    const k = sampleKeys(p);
    const hot = introState.focus >= 0 ? HOTSPOT_VIEWS[introState.focus] : null;

    // Model heading: scroll pose + idle sway + pointer parallax
    const idle = animate ? Math.sin(t * 0.4) * 0.06 : 0;
    const targetY = (hot ? hot.rotY : k.rotY) + idle + introState.px * 0.18;
    const targetX = (animate ? Math.sin(t * 0.3) * 0.03 : 0) - introState.py * 0.12;
    g.rotation.y = approachAngle(g.rotation.y, targetY, d);
    g.rotation.x += (targetX - g.rotation.x) * d;
    g.position.y = animate ? Math.sin(t * 0.8) * 0.04 : 0;

    // Explode / reassemble
    const e = hot ? 0 : k.explode;
    if (lens.current) {
      lens.current.position.z = 0.5 + e * 0.85;
      const breathe = animate ? 1 + Math.sin(t * 1.4) * 0.012 : 1; // lens breathing
      lens.current.scale.setScalar(breathe);
    }
    if (ringA.current) { ringA.current.position.z = 0.18 + e * 0.4; ringA.current.rotation.z += dt * (0.25 + e * 2.5); }
    if (ringB.current) { ringB.current.position.z = 0.42 + e * 0.62; ringB.current.rotation.z -= dt * (0.2 + e * 2); }
    if (matte.current) matte.current.position.z = 1.08 + e * 1.35;
    if (monitor.current) monitor.current.position.y = 0.72 + e * 0.45;
    if (handle.current) handle.current.position.y = 0.62 + e * 0.3;
    if (sensorMat.current) sensorMat.current.emissiveIntensity = e * 4;

    // Monitor brightness (full glow while the AI TOOLS hotspot is focused)
    const mon = introState.focus === 2 ? 1 : k.mon;
    if (screenMat.current) screenMat.current.color.setScalar(0.15 + mon * 1.1);

    // Camera dolly
    const cam = state.camera;
    const target = hot ? new THREE.Vector3(...hot.cam) : k.cam;
    cam.position.lerp(target, d * 0.8);
    cam.lookAt(introState.px * 0.12, 0.08 - introState.py * 0.08, 0);
  });

  return (
    <group ref={group}>
      {/* Body */}
      <RoundedBox args={[1.1, 0.85, 0.95]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color={BODY} metalness={0.85} roughness={0.35} />
      </RoundedBox>
      {/* Side vents + record light */}
      <mesh position={[-0.56, 0.1, 0]}>
        <boxGeometry args={[0.02, 0.3, 0.5]} />
        <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 0.32, 0.42]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={2.2} />
      </mesh>
      {/* Sensor (revealed + glowing when the lens separates) */}
      <mesh position={[0, 0.02, 0.49]}>
        <planeGeometry args={[0.3, 0.24]} />
        <meshStandardMaterial ref={sensorMat} color="#241a05" emissive="#fbbf24" emissiveIntensity={0} />
      </mesh>

      {/* Lens assembly (barrel + glass) */}
      <group ref={lens} position={[0, 0.02, 0.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.26, 0.28, 0.65, 40]} />
          <meshStandardMaterial color={DARK} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.64]}>
          <circleGeometry args={[0.21, 40]} />
          <meshStandardMaterial color="#0b1e3a" metalness={1} roughness={0.05} emissive="#1d4ed8" emissiveIntensity={0.35} />
        </mesh>
      </group>
      {/* Focus rings (drift apart on explode) */}
      <mesh ref={ringA} position={[0, 0.02, 0.18]}>
        <torusGeometry args={[0.295, 0.038, 14, 48]} />
        <meshStandardMaterial color={RING} metalness={0.8} roughness={0.45} />
      </mesh>
      <mesh ref={ringB} position={[0, 0.02, 0.42]}>
        <torusGeometry args={[0.29, 0.032, 14, 48]} />
        <meshStandardMaterial color="#8a6a1f" metalness={0.85} roughness={0.35} emissive="#7a5a10" emissiveIntensity={0.25} />
      </mesh>

      {/* Matte box */}
      <group ref={matte} position={[0, 0.02, 1.08]}>
        <mesh>
          <boxGeometry args={[0.66, 0.5, 0.26]} />
          <meshStandardMaterial color={DARK} metalness={0.7} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.34, 0.02]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.66, 0.3, 0.02]} />
          <meshStandardMaterial color={DARK} metalness={0.7} roughness={0.5} />
        </mesh>
      </group>

      {/* Top handle */}
      <group ref={handle} position={[0, 0.62, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.55, 0.1, 0.16]} />
          <meshStandardMaterial color={BODY} metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[-0.18, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.18, 16]} />
          <meshStandardMaterial color={DARK} metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[0.18, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.18, 16]} />
          <meshStandardMaterial color={DARK} metalness={0.8} roughness={0.4} />
        </mesh>
      </group>

      {/* Rig rails */}
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, -0.52, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 16]} />
          <meshStandardMaterial color="#3a4152" metalness={0.95} roughness={0.25} />
        </mesh>
      ))}

      {/* Mounted monitor with the timeline UI */}
      <group ref={monitor} position={[0.42, 0.72, 0.05]} rotation={[-0.12, 0.35, 0]}>
        <mesh position={[-0.2, -0.18, 0]} rotation={[0, 0, 0.7]}>
          <cylinderGeometry args={[0.022, 0.022, 0.3, 12]} />
          <meshStandardMaterial color="#3a4152" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.62, 0.4, 0.05]} />
          <meshStandardMaterial color={DARK} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[0.56, 0.34]} />
          <meshBasicMaterial ref={screenMat} map={screenTex ?? undefined} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Drifting dust / bokeh particles ── */
function Particles({ count, animate }: { count: number; animate: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 13;
      a[i * 3 + 1] = (Math.random() - 0.5) * 7;
      a[i * 3 + 2] = -4.5 + Math.random() * 8;
    }
    return a;
  }, [count]);

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts || !animate) return;
    pts.rotation.y += dt * 0.015;
    // stream past on scroll to sell depth
    pts.position.z += ((introState.progress * 3 - pts.position.z) * Math.min(1, dt * 2));
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.022} color="#9db4ff" transparent opacity={0.45} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function IntroScene({
  mobile,
  animate,
  frameloop,
  onReady,
}: {
  mobile: boolean;
  animate: boolean;
  frameloop: "always" | "never" | "demand";
  onReady: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={frameloop}
      camera={{ fov: 35, position: [0, 0.15, 4.2], near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={onReady}
    >
      <color attach="background" args={["#050508"]} />
      <fog attach="fog" args={["#050508", 6, 13]} />

      {/* Volumetric-feel key light from upper-left; half the body falls to shadow */}
      <hemisphereLight args={["#33406b", "#04050a", 0.6]} />
      <spotLight position={[-4.5, 5, 3.5]} angle={0.55} penumbra={0.6} intensity={140} color="#dbe6ff" />
      <pointLight position={[3, 1.2, -3]} intensity={26} color="#4c6fff" />
      <pointLight position={[1.6, -1.2, 2.4]} intensity={7} color="#fbbf24" />

      <CineCamera animate={animate} />
      <Particles count={mobile ? 350 : 1200} animate={animate} />

      {mobile ? (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.6} luminanceThreshold={0.3} mipmapBlur />
          <Noise opacity={0.045} />
          <Vignette darkness={0.75} offset={0.25} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.7} luminanceThreshold={0.28} mipmapBlur />
          <DepthOfField focusDistance={0.028} focalLength={0.06} bokehScale={2.2} />
          <Noise opacity={0.05} />
          <Vignette darkness={0.75} offset={0.25} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
