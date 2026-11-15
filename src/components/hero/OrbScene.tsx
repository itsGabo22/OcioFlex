"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

type Mood = "foco" | "ocio";
const PALETTE = {
  foco: { base: new THREE.Color("#2fa39a"), glow: new THREE.Color("#9fe6da"), distort: 0.26, speed: 1.1, shadow: "#0f5f58" },
  ocio: { base: new THREE.Color("#f08a58"), glow: new THREE.Color("#ffc9a8"), distort: 0.46, speed: 2.1, shadow: "#c2431f" },
};

type DistortMat = THREE.MeshPhysicalMaterial & { distort: number; speed: number };

function Orb({ mood, ratio }: { mood: Mood; ratio: number }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<DistortMat>(null);
  const target = PALETTE[mood];
  // leisure share nudges liveliness a little on top of the mood preset
  const lively = 1 + (1 - Math.min(1, Math.max(0, ratio))) * 0.25;

  useFrame((state, dt) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent ease
    g.rotation.y += dt * 0.14;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.15, k);
    g.position.x = THREE.MathUtils.lerp(g.position.x, state.pointer.x * 0.12, k);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.07;
    m.color.lerp(target.base, k * 0.6);
    m.emissive.lerp(target.glow, k * 0.6);
    m.distort = THREE.MathUtils.lerp(m.distort, target.distort * lively, k);
    m.speed = THREE.MathUtils.lerp(m.speed, target.speed, k);
  });

  return (
    <group ref={group}>
      <mesh castShadow>
        <sphereGeometry args={[1.08, 128, 128]} />
        <MeshDistortMaterial
          ref={mat as never}
          color={PALETTE.foco.base}
          emissive={PALETTE.foco.glow}
          emissiveIntensity={0.18}
          distort={0.26}
          speed={1.1}
          roughness={0.16}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.08}
          iridescence={0.85}
          iridescenceIOR={1.3}
          envMapIntensity={1.35}
        />
      </mesh>
    </group>
  );
}

export default function OrbScene({ mood, ratio, running, onLost }: { mood: Mood; ratio: number; running: boolean; onLost: () => void }) {
  return (
    <Canvas
      frameloop={running ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4.4], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onLost();
        });
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 3]} intensity={1.4} />
      <Orb mood={mood} ratio={ratio} />
      <ContactShadows position={[0, -1.4, 0]} opacity={0.38} scale={6} blur={2.6} far={2.5} color={PALETTE[mood].shadow} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 5, 2]} scale={[16, 6, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.1} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[12, 8, 1]} color="#fff3e6" />
        <Lightformer form="circle" intensity={1.5} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={6} color={mood === "foco" ? "#9fe6da" : "#ffb38a"} />
        <Lightformer form="rect" intensity={1.2} position={[0, -4, 1]} scale={[10, 2, 1]} color="#f7f3ec" />
      </Environment>
    </Canvas>
  );
}
