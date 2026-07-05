"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import { introState } from "./state";

const MODEL_URL = "/models/camera.glb"; // Exakta VX 1954 (user-supplied USDZ, converted)

/* ── Scroll choreography keyframes ─────────────────────────────
   cam = camera position, rotY = model heading, tilt = [x, z]
   tumble pose. Sampled by progress with smoothstep easing.     */
type Key = { p: number; cam: [number, number, number]; rotY: number; tilt: [number, number] };
const KEYS: Key[] = [
  { p: 0.0,  cam: [0.0, 0.15, 4.0],  rotY: -0.3, tilt: [-0.1, -0.25] },
  { p: 0.13, cam: [0.7, 0.25, 3.2],  rotY: 0.9,  tilt: [-0.05, -0.12] },
  { p: 0.22, cam: [0.15, 0.05, 2.0], rotY: 1.9,  tilt: [0.3, 0.42] },    // dramatic close orbit
  { p: 0.38, cam: [-0.2, 0.15, 3.1], rotY: 3.2,  tilt: [0.1, 0.18] },
  { p: 0.46, cam: [0.1, -0.25, 2.8], rotY: 3.9,  tilt: [-0.2, -0.1] },   // ch1 — low angle
  { p: 0.58, cam: [1.35, 0.3, 2.6],  rotY: 4.9,  tilt: [0.05, -0.3] },   // ch2 — side profile
  { p: 0.70, cam: [0.05, 0.18, 1.9], rotY: 6.28, tilt: [0.12, 0.2] },    // ch3 — lens close-up
  { p: 0.82, cam: [-0.9, 0.55, 2.8], rotY: 7.1,  tilt: [0.4, 0.45] },    // ch4 — tumbled top view
  { p: 1.0,  cam: [0.0, 0.3, 3.7],   rotY: 8.2,  tilt: [-0.08, -0.22] }, // beauty shot
];

// Finale hotspot camera views (index matches the DOM hotspot list).
export const HOTSPOT_VIEWS: { cam: [number, number, number]; rotY: number }[] = [
  { cam: [0.1, -0.15, 2.6], rotY: 0.35 },  // CHALLENGES — front, low
  { cam: [1.45, 0.35, 2.3], rotY: 1.15 },  // LEARNING HUB — side
  { cam: [0.05, 0.15, 1.8], rotY: 0.0 },   // AI TOOLS — lens close-up
  { cam: [-1.15, 0.65, 2.5], rotY: 2.2 },  // YOUR PROGRESS — top-left
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

/* ── The real camera model, normalized and tumbling ── */
function CameraModel({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  // Normalize: center at origin, fit the longest side to ~1.9 units.
  useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const s = 1.9 / Math.max(size.x, size.y, size.z, 1e-5);
    scene.scale.setScalar(s);
    const c = box.getCenter(new THREE.Vector3()).multiplyScalar(s);
    scene.position.set(-c.x, -c.y, -c.z);
  }, [scene]);

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
    const targetZ = (hot ? -0.12 : k.tiltZ) + idleZ;
    g.rotation.y = approachAngle(g.rotation.y, targetY, d);
    g.rotation.x += (targetX - g.rotation.x) * d;
    g.rotation.z += (targetZ - g.rotation.z) * d;
    g.position.y = animate ? Math.sin(t * 0.8) * 0.05 : 0;

    // Camera dolly
    const cam = state.camera;
    const target = hot ? new THREE.Vector3(...hot.cam) : k.cam;
    cam.position.lerp(target, d * 0.8);
    cam.lookAt(introState.px * 0.12, 0.08 - introState.py * 0.08, 0);
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload(MODEL_URL);

/* ── Faint drifting dust for depth ── */
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
      camera={{ fov: 35, position: [0, 0.15, 4.0], near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={onReady}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 6, 13]} />

      {/* Product-shot lighting — the model carries baked PBR textures,
          so light it generously and let the maps do the work */}
      <ambientLight intensity={1.1} color="#ffffff" />
      <hemisphereLight args={["#8fa0c8", "#101318", 1.2]} />
      <directionalLight position={[-4, 5, 4]} intensity={3.2} color="#ffffff" />
      <directionalLight position={[3.5, 1.5, -3]} intensity={1.6} color="#dfe8ff" />
      <pointLight position={[0, 0.4, 4.2]} intensity={20} color="#ffffff" />

      <CameraModel animate={animate} />
      <Particles count={mobile ? 250 : 800} animate={animate} />

      {mobile ? (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.4} luminanceThreshold={0.5} mipmapBlur />
          <Noise opacity={0.04} />
          <Vignette darkness={0.6} offset={0.2} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.45} luminanceThreshold={0.45} mipmapBlur />
          <DepthOfField focusDistance={0.028} focalLength={0.06} bokehScale={2} />
          <Noise opacity={0.045} />
          <Vignette darkness={0.6} offset={0.2} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
