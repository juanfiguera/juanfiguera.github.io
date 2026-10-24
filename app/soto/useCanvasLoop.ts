"use client";

import { useEffect, type RefObject } from "react";

export type Pointer = { x: number; y: number; active: boolean; down: boolean };

export type Frame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  time: number;
  dt: number;
  pointer: Pointer;
  still: boolean;
};

export type Scene = (frame: Frame) => void;

// Each scene factory owns its simulation state in a closure, so React never re-renders per frame.
type Options = {
  // For animation the user starts and can pause (like a video), which reduced-motion guidance allows.
  alwaysAnimate?: boolean;
};

export function useCanvasLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  createScene: () => Scene,
  { alwaysAnimate = false }: Options = {},
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scene = createScene();
    const still = !alwaysAnimate && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer: Pointer = { x: 0, y: 0, active: false, down: false };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    let last = 0;
    let rafId = 0;

    const render = (dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene({ ctx, width, height, dpr, time, dt, pointer, still });
    };

    const tick = (now: number) => {
      // Clamp so a backgrounded tab doesn't feed the physics one giant step.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      time += dt;
      render(dt);
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (still || rafId) return;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      render(0);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onDown = (event: PointerEvent) => {
      onMove(event);
      pointer.down = true;
    };

    const onUp = () => {
      pointer.down = false;
    };

    const onLeave = () => {
      pointer.active = false;
      pointer.down = false;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Only animate while on screen; several canvases running at once is wasted battery.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    visibilityObserver.observe(canvas);

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
    };
  }, [canvasRef, createScene, alwaysAnimate]);
}
