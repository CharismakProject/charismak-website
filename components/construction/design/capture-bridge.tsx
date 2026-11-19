"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

export type CaptureFn = () => Promise<Blob | null>;

/**
 * Lives inside the 3D viewer and hands the page a function that photographs the current view.
 * Pascal's viewer draws in a priority-1 frame callback; this one runs straight after it (priority 2),
 * so the canvas still holds the finished frame when it is read.
 */
export default function CaptureBridge({ onReady }: { onReady: (capture: CaptureFn | null) => void }) {
  const gl = useThree((state) => state.gl);
  const advance = useThree((state) => state.advance);
  const pending = useRef<((blob: Blob | null) => void)[]>([]);

  useFrame(() => {
    if (!pending.current.length) return;
    const waiting = pending.current.splice(0);
    const canvas = (gl as unknown as { domElement: HTMLCanvasElement }).domElement;
    canvas.toBlob((blob) => { waiting.forEach((resolve) => resolve(blob && blob.size > 2000 ? blob : null)); }, "image/png");
  }, 2);

  useEffect(() => {
    const capture: CaptureFn = () =>
      new Promise((resolve) => {
        const timer = setTimeout(() => {
          pending.current = pending.current.filter((fn) => fn !== done);
          resolve(null);
        }, 60000);
        const done = (blob: Blob | null) => { clearTimeout(timer); resolve(blob); };
        pending.current.push(done);
        requestAnimationFrame(() => advance(performance.now(), true));
      });
    onReady(capture);
    return () => onReady(null);
  }, [onReady, advance]);
  return null;
}
