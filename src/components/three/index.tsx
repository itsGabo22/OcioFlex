"use client";
/* eslint-disable react-hooks/immutability -- three.js objects are mutated imperatively inside the render loop by design */

/**
 * The only module that imports three.js. Both scenes live here so they ship as ONE lazy chunk:
 * - StageScene: full-window canvas behind the splash, login and questionnaire
 * - HeroScene:  the Home hero orb with its balance ring
 * Everything is procedural: no textures, no HDRIs, no model files.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, MeshDistortMaterial, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { stage, splashFreeze, type Palette } from "@/lib/stage";

const FREEZE = typeof window !== "undefined" ? splashFreeze() : null;

const PAL = {
  foco: { base: new THREE.Color("#0f8077"), glow: new THREE.Color("#7fd9cb"), distort: 0.24, speed: 1.0, a: new THREE.Color("#1f9a8f"), b: new THREE.Color("#7fd9cb"), light: "#9fe6da", room: "#a9cfc6" },
  ocio: { base: new THREE.Color("#e0653a"), glow: new THREE.Color("#ffb38a"), distort: 0.34, speed: 1.7, a: new THREE.Color("#d9532f"), b: new THREE.Color("#f7a072"), light: "#ffc29e", room: "#e9c1aa" },
};
const FOCUS_COL = new THREE.Color("#1f8a80");
const LEISURE_COL = new THREE.Color("#e2683d");

type DistortMat = THREE.MeshPhysicalMaterial & { distort: number; speed: number };
const ease = (k: number, dt: number) => 1 - Math.pow(k, dt);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ───────────────────────── shared look ───────────────────────── */

function OrbMaterial({ mat }: { mat: React.RefObject<DistortMat | null> }) {
  return (
    <MeshDistortMaterial
      ref={mat as never}
      color={PAL.foco.base}
      emissive={PAL.foco.glow}
      emissiveIntensity={0.07}
      distort={0.24}
      speed={1}
      roughness={0.12}
      metalness={0.04}
      clearcoat={1}
      clearcoatRoughness={0.1}
      iridescence={0.45}
      iridescenceIOR={1.25}
      envMapIntensity={1.15}
      transparent
    />
  );
}

/** Warm "paper studio": a light room so grazing reflections stay luminous instead of going dark. */
function Studio({ palette }: { palette: Palette }) {
  return (
    <Environment resolution={256} frames={1}>
      <mesh scale={60}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={PAL[palette].room} side={THREE.BackSide} />
      </mesh>
      <Lightformer form="rect" intensity={1.7} position={[0, 5, 2]} scale={[16, 6, 1]} color="#ffffff" />
      <Lightformer form="rect" intensity={1.2} position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[12, 8, 1]} color="#fff6ea" />
      <Lightformer form="circle" intensity={1.4} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={6} color={PAL[palette].light} />
      <Lightformer form="rect" intensity={1.3} position={[0, -4, 1]} rotation-x={-Math.PI / 2} scale={[10, 4, 1]} color="#f7f3ec" />
    </Environment>
  );
}

/* ───────────────────────── particles ───────────────────────── */

const VERT = /* glsl */ `
uniform float uTime, uConverge, uIgnite, uBurst, uSize, uPR, uRingSpeed, uRatio, uMode, uTilt;
uniform vec3 uColA, uColB, uColFocus, uColLeisure;
attribute vec3 aStart;
attribute vec3 aDir;
attribute vec4 aRing;
attribute float aSeed;
attribute float aKind;
varying vec3 vCol;
varying float vAlpha;
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotZ(float a){ float c=cos(a), s=sin(a); return mat3(c,s,0., -s,c,0., 0.,0.,1.); }
void main(){
  float ang = aRing.x + uTime * uRingSpeed * (0.55 + aRing.w);
  vec3 ring = vec3(cos(ang) * aRing.y, aRing.z + 0.03 * sin(uTime * 1.3 + aSeed * 40.), sin(ang) * aRing.y);
  ring = rotZ(0.28) * rotX(uTilt) * ring;
  vec3 target = aKind < 0.5 ? aDir * (1.02 + 0.03 * sin(uTime * 2. + aSeed * 30.)) : ring;
  float p = clamp((uConverge - aSeed * 0.4) / 0.6, 0., 1.);
  p = 1. - pow(1. - p, 3.);
  vec3 s = rotY((1. - p) * (2. + aSeed * 3.)) * aStart;
  vec3 pos = mix(s, target, p);
  pos += normalize(pos + 1e-4) * uBurst * (1.5 + aSeed * 6.);
  vec4 mv = modelViewMatrix * vec4(pos, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + aSeed) * uPR * (8. / -mv.z);
  float orbFade = aKind < 0.5 ? 1. - uIgnite : 1.;
  vAlpha = orbFade * (1. - uBurst) * (0.42 + 0.58 * p);
  vec3 c = mix(uColA, uColB, fract(aSeed * 7.13));
  if (uMode > .5) c = aSeed < uRatio ? uColFocus : uColLeisure;
  vCol = c;
}`;

const FRAG = /* glsl */ `
varying vec3 vCol;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - .5;
  float r = length(c);
  if (r > .5) discard;
  float a = smoothstep(.5, 0., r);
  vec3 col = mix(vCol, vec3(1.), smoothstep(.25, 0., r) * .7);
  gl_FragColor = vec4(col, min(1., a * vAlpha * 1.15));
}`;

function makeParticleGeometry(count: number, ringShare: number, ringR: [number, number]) {
  const g = new THREE.BufferGeometry();
  const start = new Float32Array(count * 3);
  const dir = new Float32Array(count * 3);
  const ring = new Float32Array(count * 4);
  const seed = new Float32Array(count);
  const kind = new Float32Array(count);
  const rnd = mulberry(7);
  for (let i = 0; i < count; i++) {
    // start: a wide shell around the orb
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const rr = 2.6 + rnd() * 4;
    const sq = Math.sqrt(1 - u * u);
    start.set([sq * Math.cos(th) * rr, u * rr * 0.75, sq * Math.sin(th) * rr], i * 3);
    // orb surface (fibonacci sphere keeps it even)
    const k = (i + 0.5) / count;
    const phi = Math.acos(1 - 2 * k);
    const ga = Math.PI * (3 - Math.sqrt(5)) * i;
    dir.set([Math.sin(phi) * Math.cos(ga), Math.cos(phi), Math.sin(phi) * Math.sin(ga)], i * 3);
    ring.set([rnd() * Math.PI * 2, ringR[0] + Math.pow(rnd(), 1.6) * (ringR[1] - ringR[0]), (rnd() - 0.5) * 0.07, rnd()], i * 4);
    seed[i] = rnd();
    kind[i] = rnd() < ringShare ? 1 : 0;
  }
  g.setAttribute("position", new THREE.BufferAttribute(dir.slice(), 3));
  g.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
  g.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
  g.setAttribute("aRing", new THREE.BufferAttribute(ring, 4));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
  return g;
}

function mulberry(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useParticles(max: number, ringShare: number, ringR: [number, number], mode: 0 | 1) {
  const gl = useThree((s) => s.gl);
  const geometry = useMemo(() => makeParticleGeometry(max, ringShare, ringR), [max, ringShare, ringR]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 }, uConverge: { value: mode ? 1 : 0 }, uIgnite: { value: mode ? 1 : 0 }, uBurst: { value: 0 },
          uSize: { value: mode ? 3.3 : 4.3 }, uPR: { value: gl.getPixelRatio() }, uRingSpeed: { value: 0.25 }, uRatio: { value: 0.5 }, uMode: { value: mode }, uTilt: { value: 0.42 },
          uColA: { value: PAL.foco.a.clone() }, uColB: { value: PAL.foco.b.clone() }, uColFocus: { value: FOCUS_COL }, uColLeisure: { value: LEISURE_COL },
        },
      }),
    [gl, mode],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return { geometry, material };
}

/* ───────────────────────── stage (splash · login · questionnaire) ───────────────────────── */

const RING_STAGE: [number, number] = [1.5, 1.82];

function StageOrb({ low }: { low: boolean }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const mat = useRef<DistortMat>(null);
  const sweep = useRef<THREE.PointLight>(null);
  const orb = useRef<THREE.Mesh>(null);
  const { viewport, size } = useThree();
  const { geometry, material } = useParticles(4000, 0.3, RING_STAGE, 0);
  const clock = useRef({ t: 0, started: false, scale: 0.0001, x: 0, y: 0, burst: 0 });

  useEffect(() => {
    geometry.setDrawRange(0, low ? 1500 : 4000);
  }, [geometry, low]);

  useFrame((state, rawDt) => {
    const g = group.current;
    const m = mat.current;
    const sp = spin.current;
    if (!g || !m || !sp) return;
    const dt = Math.min(rawDt, 1 / 20);
    const c = clock.current;
    if (!c.started) {
      c.started = true;
      stage.markReady();
    }
    // timeline runs on wall-clock time (capped), so a slow or throttled frame never desyncs it from the DOM
    c.t += Math.min(rawDt, 0.5) * (stage.skip && c.t < 2.4 ? 4 : 1);
    if (FREEZE !== null) c.t = Math.min(c.t, FREEZE);
    const t = c.t;
    const now = performance.now();
    const pal = PAL[stage.palette];

    // map the DOM anchor (px) into world units at z = 0
    const a = stage.anchor;
    const tx = (a.x / size.width - 0.5) * viewport.width;
    const ty = -(a.y / size.height - 0.5) * viewport.height;
    let ts = (a.d / size.height) * viewport.height * 0.5;

    // intro: orb scales in once the particles have arrived
    const intro = smooth(1.05, 1.9, t);
    const back = intro < 1 ? 1 + Math.sin(intro * Math.PI) * 0.06 : 1;
    const burstT = stage.burstAt ? (now - stage.burstAt) / 1000 : 0;
    c.burst = stage.burstAt ? smooth(0, 0.9, burstT) : 0;
    ts *= 1 + c.burst * 3.2;

    const k = ease(0.02, dt);
    const firstPlace = c.x === 0 && c.y === 0;
    c.x = firstPlace ? tx : THREE.MathUtils.lerp(c.x, tx, k);
    c.y = firstPlace ? ty : THREE.MathUtils.lerp(c.y, ty, k);
    c.scale = c.scale < 0.001 ? ts : THREE.MathUtils.lerp(c.scale, ts, ease(0.01, dt));
    if (orb.current) orb.current.scale.setScalar(Math.max(0.0001, intro * back));
    g.position.set(c.x + stage.lean.x * 0.08 * c.scale, c.y + stage.lean.y * 0.06 * c.scale, 0);
    g.scale.setScalar(Math.max(0.0001, c.scale) * (1 + 0.045 * Math.exp(-(now - stage.pulseAt) / 140)));

    // pointer + focused-field lean
    const ptr = stage.pointer;
    sp.rotation.y += dt * (0.12 + c.burst * 2.5);
    sp.rotation.x = THREE.MathUtils.lerp(sp.rotation.x, -ptr.y * 0.18 + stage.lean.y * 0.25, ease(0.05, dt));
    sp.rotation.z = THREE.MathUtils.lerp(sp.rotation.z, -ptr.x * 0.12 - stage.lean.x * 0.2, ease(0.05, dt));

    // material: fade in, palette morph, livelier per onboarding step
    m.opacity = smooth(1.05, 1.6, t) * (1 - smooth(0.25, 0.85, burstT * (stage.burstAt ? 1 : 0)));
    m.transparent = m.opacity < 0.999;
    m.depthWrite = m.opacity > 0.6;
    const kc = ease(0.08, dt);
    m.color.lerp(pal.base, kc);
    m.emissive.lerp(pal.glow, kc);
    m.distort = THREE.MathUtils.lerp(m.distort, pal.distort + (stage.step % 2) * 0.015, ease(0.1, dt));
    m.speed = THREE.MathUtils.lerp(m.speed, pal.speed, ease(0.1, dt));

    // rim-light sweep across the clearcoat as the orb ignites
    if (sweep.current) {
      const s = smooth(1.25, 2.1, t);
      sweep.current.position.set(-4 + s * 8, 1.8 - s * 0.6, 2.4);
      sweep.current.intensity = Math.sin(s * Math.PI) * 28;
    }

    // particles
    const u = material.uniforms;
    u.uTime.value += dt;
    u.uConverge.value = smooth(0, 1.25, t);
    u.uIgnite.value = smooth(1.05, 1.7, t);
    u.uBurst.value = c.burst;
    u.uRingSpeed.value = stage.palette === "ocio" ? 0.42 : 0.24;
    u.uPR.value = state.gl.getPixelRatio();
    // particles switch palette almost at once: a slow RGB blend between teal and coral passes through grey
    const kp = ease(1e-6, dt);
    (u.uColA.value as THREE.Color).lerp(pal.a, kp);
    (u.uColB.value as THREE.Color).lerp(pal.b, kp);
  });

  return (
    <group ref={group}>
      <group ref={spin}>
        <mesh ref={orb} renderOrder={0}>
          <sphereGeometry args={[1, 128, 128]} />
          <OrbMaterial mat={mat} />
        </mesh>
        <points geometry={geometry} material={material} renderOrder={1} frustumCulled={false} />
      </group>
      <pointLight ref={sweep} distance={12} decay={1.4} color="#ffffff" intensity={0} />
    </group>
  );
}

function usePointer() {
  useEffect(() => {
    const on = (e: PointerEvent) => {
      stage.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      stage.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, []);
}

function useRunning(alwaysDuringSplash: boolean) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const upd = () => setOn(!document.hidden && (alwaysDuringSplash || document.hasFocus()));
    document.addEventListener("visibilitychange", upd);
    window.addEventListener("focus", upd);
    window.addEventListener("blur", upd);
    return () => {
      document.removeEventListener("visibilitychange", upd);
      window.removeEventListener("focus", upd);
      window.removeEventListener("blur", upd);
    };
  }, [alwaysDuringSplash]);
  return on;
}

function onCreated(onLost: () => void) {
  return ({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(0x000000, 0);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      onLost();
    });
  };
}

export function StageScene({ onLost, active = true }: { onLost: () => void; active?: boolean }) {
  usePointer();
  const [low, setLow] = useState(false);
  const running = useRunning(true);
  return (
    <Canvas
      frameloop={running && active ? "always" : "never"}
      dpr={low ? 1 : [1, 1.6]}
      camera={{ position: [0, 0, 9], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={onCreated(onLost)}
      style={{ position: "absolute", inset: 0 }}
    >
      <PerformanceMonitor onDecline={() => setLow(true)} onIncline={() => setLow(false)} flipflops={3} onFallback={() => setLow(true)} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 3]} intensity={1.3} />
      <StageOrb low={low} />
      <PaletteStudio />
    </Canvas>
  );
}

/** Re-renders the (static, one-frame) environment only when the palette changes. */
function PaletteStudio() {
  const [p, setP] = useState<Palette>(stage.palette);
  useFrame(() => {
    if (stage.palette !== p) setP(stage.palette);
  });
  return <Studio key={p} palette={p} />;
}

/* ───────────────────────── Home hero ───────────────────────── */

const RING_HERO: [number, number] = [1.38, 1.72];

function HeroOrbMesh({ palette, ratio, low }: { palette: Palette; ratio: number; low: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<DistortMat>(null);
  const { geometry, material } = useParticles(1800, 1, RING_HERO, 1);
  const intro = useRef(0);

  useEffect(() => {
    geometry.setDrawRange(0, low ? 700 : 1800);
  }, [geometry, low]);

  useFrame((state, rawDt) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const dt = Math.min(rawDt, 1 / 20);
    const target = PAL[palette];
    const k = ease(0.0015, dt);
    intro.current = Math.min(1, intro.current + dt / 0.9);
    const e = 1 - Math.pow(1 - intro.current, 3);
    g.scale.setScalar(0.82 + 0.18 * e);
    g.rotation.y += dt * 0.14;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.15, k);
    g.position.x = THREE.MathUtils.lerp(g.position.x, state.pointer.x * 0.12, k);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.07;
    m.opacity = e;
    m.transparent = e < 0.999;
    m.color.lerp(target.base, k * 0.6);
    m.emissive.lerp(target.glow, k * 0.6);
    m.distort = THREE.MathUtils.lerp(m.distort, target.distort, k);
    m.speed = THREE.MathUtils.lerp(m.speed, target.speed, k);
    const u = material.uniforms;
    u.uTime.value += dt;
    u.uRatio.value = THREE.MathUtils.lerp(u.uRatio.value, ratio, k);
    u.uRingSpeed.value = THREE.MathUtils.lerp(u.uRingSpeed.value, palette === "ocio" ? 0.5 : 0.22, k);
    u.uTilt.value = THREE.MathUtils.lerp(u.uTilt.value, palette === "ocio" ? 0.55 : 0.4, k);
    u.uIgnite.value = 1;
    u.uConverge.value = e;
    u.uPR.value = state.gl.getPixelRatio();
  });

  return (
    <group ref={group}>
      <mesh renderOrder={0}>
        <sphereGeometry args={[1, 128, 128]} />
        <OrbMaterial mat={mat} />
      </mesh>
      <points geometry={geometry} material={material} renderOrder={1} frustumCulled={false} />
    </group>
  );
}

export function HeroScene({ palette, ratio, running, onLost }: { palette: Palette; ratio: number; running: boolean; onLost: () => void }) {
  const [low, setLow] = useState(false);
  const focused = useRunning(false);
  return (
    <Canvas
      frameloop={running && focused ? "always" : "never"}
      dpr={low ? 1 : [1, 1.75]}
      camera={{ position: [0, 0, 6.2], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={onCreated(onLost)}
    >
      <PerformanceMonitor onDecline={() => setLow(true)} onIncline={() => setLow(false)} flipflops={3} onFallback={() => setLow(true)} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 3]} intensity={1.35} />
      <HeroOrbMesh palette={palette} ratio={ratio} low={low} />
      <ContactShadows position={[0, -1.55, 0]} opacity={0.32} scale={7} blur={2.8} far={2.5} color={palette === "foco" ? "#0f5f58" : "#c2431f"} />
      <Studio palette={palette} />
    </Canvas>
  );
}
