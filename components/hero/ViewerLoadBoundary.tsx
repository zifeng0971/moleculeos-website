'use client';
import { Component, type ReactNode } from 'react';
// Catch lazy chunk failures separately from WebGL/CIF errors inside the viewer.
export class ViewerLoadBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
