"use client";

import React from "react";
import dynamic from "next/dynamic";

/** The 3D stage, loaded on demand from the shared three.js chunk. */
export const StageScene = dynamic(() => import("@/components/three").then((m) => m.StageScene), { ssr: false });

export class GlBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
