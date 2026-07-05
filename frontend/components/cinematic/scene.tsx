"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import { introState } from "./state";

/* ── Scroll choreography keyframes ─────────────────────────────
   cam = camera position, rotY = model heading, tilt = [x, z]
   tumble pose, explode = 0..1 disassembly, mon = screen glow.
   Sampled by progress with smoothstep easing between keys.      */
type Key = {
  p: number; cam: [number, number, number]; rotY: number;
  tilt: [number, number]; explode: number; mon: number;
};
const KEYS: Key[] = [
  { p: 0.0,  cam: [0.0, 0.15, 4.2],  rotY: -0.3, tilt: [-0.12, -0.3],  explode: 0,   mon: 0 },
  { p: 0.13, cam: [0.7, 0.25, 3.3],  rotY: 0.9,  tilt: [-0.05, -0.15], explode: 0,   mon: 0 },
  { p: 0.22, cam: [0.15, 0.1, 2.5],  rotY: 1.9,  tilt: [0.3, 0.45],    explode: 1,   mon: 0 },    // exploded, diagonal
  { p: 0.38, cam: [-0.2, 0.15, 3.2], rotY: 3.2,  tilt: [0.1, 0.2],     explode: 0,   mon: 0 },    // reassembled
  { p: 0.46, cam: [0.1, -0.25, 2.9], rotY: 3.9,  tilt: [-0.2, -0.1],   explode: 0,   mon: 0 },    // ch1 — low angle
  { p: 0.58, cam: [1.4, 0.3, 2.7],   rotY: 4.9,  tilt: [0.05, -0.35],  explode: 0,   mon: 0.25 }, // ch2 — side profile
  { p: 0.70, cam: [-1.05, 0.4, 2.3], rotY: 6.1,  tilt: [0.15, 0.25],   explode: 0,   mon: 1 },    // ch3 — flip-screen
  { p: 0.82, cam: [-0.9, 0.55, 2.9], rotY: 7.1,  tilt: [0.45, 0.5],    explode: 0.3, mon: 0.5 },  // ch4 — tumbled, rings drift
  { p: 1.0,  cam: [0.0, 0.3, 3.9],   rotY: 8.2,  tilt: [-0.1, -0.28],  explode: 0,   mon: 0.6 },  // beauty shot
];

// Finale hotspot camera views (index matches the DOM hotspot list).
export const HOTSPOT_VIEWS: { cam: [number, number, number]; rotY: number }[] = [
  { cam: [0.1, -0.15, 2.7], rotY: 0.35 },   // CHALLENGES — front, low
  { cam: [1.5, 0.35, 2.4],  rotY: 1.15 },   // LEARNING HUB — side
  { cam: [-1.35, 0.35, 2.2], rotY: 0.35 },  // AI TOOLS — flip screen
  { cam: [-1.2, 0.65, 2.6], rotY: 2.2 },    // YOUR PROGRESS — top-left
];

const smooth = (t: number) => t * t * (3 - 2 * t);

function sampleKeys(p: number) {
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
    tiltX: a.tilt[0] + (b.tilt[0] - a.tilt[0]) * t,
    tiltZ: a.tilt[1] + (b.tilt[1] - a.tilt[1]) * t,
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

/* ── Screen: a tiny editing-timeline UI drawn to a canvas ── */
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

/* ── Glossy black DSLR, matched to the reference animation:
   piano-black reflective body, leather grips, pentaprism + dials,
   fat lens with two knurled rings and ONE thin red stripe near the
   front, big reflective front glass. Tumbles in a pure black void;
   the front lens elements explode out and reassemble.           */
const BODY = "#0e0f12";   // piano black — reads via speculars
const GRIP = "#0a0b0d";   // matte leather
const BARREL = "#0b0c0f";
const KNURL = "#101216";
const METAL = "#454c5c";
const RED = "#c1121f";    // the single L-series stripe

function CineCamera({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const lens = useRef<THREE.Group>(null);
  const frontEls = useRef<THREE.Group>(null);
  const ringKnurlA = useRef<THREE.Mesh>(null);
  const ringKnurlB = useRef<THREE.Mesh>(null);
  const ringRed = useRef<THREE.Mesh>(null);
  const top = useRef<THREE.Group>(null);
  const screen = useRef<THREE.Group>(null);
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

    // Tumbling pose: scroll keys + slow zero-g idle + pointer parallax
    const idleY = animate ? Math.sin(t * 0.4) * 0.07 : 0;
    const idleX = animate ? Math.sin(t * 0.31) * 0.05 : 0;
    const idleZ = animate ? Math.cos(t * 0.27) * 0.05 : 0;
    const targetY = (hot ? hot.rotY : k.rotY) + idleY + introState.px * 0.18;
    const targetX = (hot ? 0.05 : k.tiltX) + idleX - introState.py * 0.12;
    const targetZ = (hot ? -0.15 : k.tiltZ) + idleZ;
    g.rotation.y = approachAngle(g.rotation.y, targetY, d);
    g.rotation.x += (targetX - g.rotation.x) * d;
    g.rotation.z += (targetZ - g.rotation.z) * d;
    g.position.y = animate ? Math.sin(t * 0.8) * 0.05 : 0;

    // Explode / reassemble — front elements lead, rings trail
    const e = hot ? 0 : k.explode;
    if (lens.current) {
      lens.current.position.z = 0.3 + e * 0.7;
      const breathe = animate ? 1 + Math.sin(t * 1.4) * 0.012 : 1; // lens breathing
      lens.current.scale.setScalar(breathe);
    }
    if (frontEls.current) frontEls.current.position.z = 0.68 + e * 0.55;
    if (ringKnurlA.current) { ringKnurlA.current.position.z = 0.44 + e * 0.95; ringKnurlA.current.rotation.z += dt * (0.2 + e * 1.8); }
    if (ringKnurlB.current) { ringKnurlB.current.position.z = 0.6 + e * 1.15; ringKnurlB.current.rotation.z -= dt * (0.25 + e * 2.2); }
    if (ringRed.current) { ringRed.current.position.z = 0.7 + e * 1.4; ringRed.current.rotation.z += dt * (0.18 + e * 1.5); }
    if (top.current) top.current.position.y = 0.55 + e * 0.4;
    if (sensorMat.current) sensorMat.current.emissiveIntensity = e * 4;

    // Flip screen: tucked flat against the body, swings out as `mon` rises
    const mon = introState.focus === 2 ? 1 : k.mon;
    if (screen.current) {
      screen.current.rotation.y = 1.5 - mon * 0.95;
      screen.current.position.x = -0.8 - mon * 0.12 - e * 0.3;
    }
    if (screenMat.current) screenMat.current.color.setScalar(0.12 + mon * 1.15);

    // Camera dolly
    const cam = state.camera;
    const target = hot ? new THREE.Vector3(...hot.cam) : k.cam;
    cam.position.lerp(target, d * 0.8);
    cam.lookAt(introState.px * 0.12, 0.08 - introState.py * 0.08, 0);
  });

  return (
    <group ref={group}>
      {/* Body — glossy piano black */}
      <RoundedBox args={[1.5, 0.95, 0.55]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color={BODY} metalness={0.55} roughness={0.22} />
      </RoundedBox>
      {/* Leather grip panels */}
      <RoundedBox args={[0.4, 0.82, 0.58]} radius={0.06} smoothness={4} position={[-0.52, -0.02, 0]}>
        <meshStandardMaterial color={GRIP} metalness={0.15} roughness={0.75} />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.82, 0.57]} radius={0.06} smoothness={4} position={[0.56, -0.02, 0]}>
        <meshStandardMaterial color={GRIP} metalness={0.15} roughness={0.75} />
      </RoundedBox>
      {/* Side port flaps (like the reference's MIC/HDMI panel) */}
      <mesh position={[-0.73, 0.05, 0.08]}>
        <boxGeometry args={[0.06, 0.42, 0.3]} />
        <meshStandardMaterial color={GRIP} metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Red dot logo + grip button */}
      <mesh position={[-0.52, 0.14, 0.3]}>
        <circleGeometry args={[0.03, 20]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[-0.52, -0.06, 0.3]}>
        <boxGeometry args={[0.1, 0.16, 0.03]} />
        <meshStandardMaterial color="#08090b" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Strap lugs */}
      <mesh position={[-0.77, 0.22, 0]}>
        <sphereGeometry args={[0.045, 14, 14]} />
        <meshStandardMaterial color={METAL} metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[0.77, 0.22, 0]}>
        <sphereGeometry args={[0.045, 14, 14]} />
        <meshStandardMaterial color={METAL} metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Top assembly: pentaprism hump, hot shoe, dials (lifts on explode) */}
      <group ref={top} position={[0, 0.55, 0]}>
        <mesh>
          <boxGeometry args={[0.55, 0.28, 0.46]} />
          <meshStandardMaterial color={BODY} metalness={0.55} roughness={0.22} />
        </mesh>
        <mesh position={[0, -0.02, 0.24]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.48, 0.24, 0.06]} />
          <meshStandardMaterial color={BODY} metalness={0.55} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.24]} />
          <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Mode + shutter dials (knurled), shutter button */}
        <mesh position={[-0.56, -0.02, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.09, 28]} />
          <meshStandardMaterial color={KNURL} metalness={0.7} roughness={0.5} />
        </mesh>
        <mesh position={[0.5, -0.03, 0.06]}>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 28]} />
          <meshStandardMaterial color={KNURL} metalness={0.7} roughness={0.5} />
        </mesh>
        <mesh position={[0.32, -0.02, 0.14]}>
          <cylinderGeometry args={[0.035, 0.035, 0.06, 14]} />
          <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.25} />
        </mesh>
      </group>

      {/* Sensor (revealed + glowing when the lens separates) */}
      <mesh position={[0, 0, 0.283]}>
        <planeGeometry args={[0.42, 0.3]} />
        <meshStandardMaterial ref={sensorMat} color="#241a05" emissive="#fbbf24" emissiveIntensity={0} />
      </mesh>
      {/* Lens mount ring (stays on the body) */}
      <mesh position={[0, 0, 0.28]}>
        <torusGeometry args={[0.345, 0.022, 14, 56]} />
        <meshStandardMaterial color={METAL} metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Lens assembly (barrel + big reflective front glass) */}
      <group ref={lens} position={[0, 0, 0.3]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.32]}>
          <cylinderGeometry args={[0.31, 0.33, 0.68, 48]} />
          <meshStandardMaterial color={BARREL} metalness={0.8} roughness={0.28} />
        </mesh>
        {/* Front elements — these lead the explode like the reference */}
        <group ref={frontEls} position={[0, 0, 0.68]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.31, 0.08, 48]} />
            <meshStandardMaterial color={BARREL} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.042]}>
            <circleGeometry args={[0.28, 48]} />
            <meshStandardMaterial color="#05070d" metalness={1} roughness={0.02} emissive="#101c3c" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.046]}>
            <circleGeometry args={[0.15, 32]} />
            <meshStandardMaterial color="#02030a" metalness={1} roughness={0.01} emissive="#251a4d" emissiveIntensity={0.7} />
          </mesh>
        </group>
      </group>

      {/* Knurled zoom + focus rings */}
      <mesh ref={ringKnurlA} position={[0, 0, 0.44]}>
        <torusGeometry args={[0.36, 0.062, 16, 64]} />
        <meshStandardMaterial color={KNURL} metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh ref={ringKnurlB} position={[0, 0, 0.6]}>
        <torusGeometry args={[0.35, 0.05, 16, 64]} />
        <meshStandardMaterial color={KNURL} metalness={0.7} roughness={0.5} />
      </mesh>
      {/* The single thin red stripe near the front */}
      <mesh ref={ringRed} position={[0, 0, 0.7]}>
        <torusGeometry args={[0.335, 0.016, 14, 56]} />
        <meshStandardMaterial color={RED} metalness={0.5} roughness={0.3} emissive={RED} emissiveIntensity={0.35} />
      </mesh>

      {/* Flip-out screen with the timeline UI (tucked until its beat) */}
      <group ref={screen} position={[-0.8, 0, 0.1]} rotation={[0, 1.5, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.3, 0, -0.06]}>
          <cylinderGeometry args={[0.02, 0.02, 0.14, 12]} />
          <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.56, 0.4, 0.04]} />
          <meshStandardMaterial color={GRIP} metalness={0.5} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.5, 0.34]} />
          <meshBasicMaterial ref={screenMat} map={screenTex ?? undefined} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Faint drifting dust (kept very subtle — the void stays black) ── */
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
      <pointsMaterial size={0.018} color="#aebbdd" transparent opacity={0.22} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
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
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 6, 13]} />

      {/* Product-shot lighting: hard key from upper-left, strong white
          edge lights so the glossy black body reads through speculars */}
      <ambientLight intensity={0.22} color="#9daccc" />
      <hemisphereLight args={["#3c4970", "#000000", 0.7]} />
      <spotLight position={[-4.5, 5, 3.5]} angle={0.55} penumbra={0.6} intensity={300} color="#ffffff" />
      <pointLight position={[3.2, 1.4, -2.6]} intensity={70} color="#dfe8ff" />
      <pointLight position={[1.8, -1.4, 2.6]} intensity={18} color="#fff1d6" />
      <pointLight position={[0, 0.4, 4.2]} intensity={16} color="#ffffff" />

      <CineCamera animate={animate} />
      <Particles count={mobile ? 250 : 800} animate={animate} />

      {mobile ? (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.55} luminanceThreshold={0.35} mipmapBlur />
          <Noise opacity={0.045} />
          <Vignette darkness={0.6} offset={0.2} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.65} luminanceThreshold={0.32} mipmapBlur />
          <DepthOfField focusDistance={0.028} focalLength={0.06} bokehScale={2.2} />
          <Noise opacity={0.05} />
          <Vignette darkness={0.6} offset={0.2} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
