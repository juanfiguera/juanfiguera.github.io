"use client";

import { useRef } from "react";
import { useCanvasLoop, type Frame } from "./useCanvasLoop";

const PITCH = 7;
const PARALLAX = 22;

function traceSpiral(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, maxRadius: number, twist: number) {
  const turns = maxRadius / PITCH;
  const steps = Math.ceil(turns * 140);
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * turns * Math.PI * 2;
    const r = (theta / (Math.PI * 2)) * PITCH;
    const x = centerX + Math.cos(theta + twist) * r;
    const y = centerY + Math.sin(theta + twist) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function createEspiral() {
  let offsetX = 0;
  let offsetY = 0;

  return ({ ctx, width, height, time, dt, pointer, still }: Frame) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.42;

    // The plexiglass sits in front of the support, so moving your head shifts it against the spiral behind.
    const targetX = pointer.active ? ((pointer.x - centerX) / width) * PARALLAX * 2 : Math.cos(time * 0.35) * PARALLAX * 0.5;
    const targetY = pointer.active ? ((pointer.y - centerY) / height) * PARALLAX * 2 : Math.sin(time * 0.35) * PARALLAX * 0.5;
    const ease = still ? 1 : Math.min(1, dt * 4);
    offsetX += (targetX - offsetX) * ease;
    offsetY += (targetY - offsetY) * ease;

    ctx.fillStyle = "#f7f5f0";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineCap = "round";
    ctx.strokeStyle = "#14120f";
    ctx.lineWidth = PITCH * 0.5;
    traceSpiral(ctx, centerX, centerY, radius, 0);

    const frontX = centerX + offsetX;
    const frontY = centerY + offsetY;

    ctx.save();
    ctx.shadowColor = "rgba(20, 18, 15, 0.18)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.beginPath();
    ctx.arc(frontX, frontY, radius + 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = PITCH * 0.42;
    traceSpiral(ctx, frontX, frontY, radius, Math.PI);

    ctx.strokeStyle = "rgba(20, 18, 15, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(frontX, frontY, radius + 26, 0, Math.PI * 2);
    ctx.stroke();

    // Four metal standoffs holding the plexiglass off the support.
    ctx.fillStyle = "#9a958a";
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(frontX + Math.cos(a) * (radius + 16), frontY + Math.sin(a) * (radius + 16), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // A single red accent, after "Espiral con rojo".
    ctx.fillStyle = "#b8281d";
    ctx.beginPath();
    ctx.arc(centerX + radius * 0.92, centerY - radius * 0.92, radius * 0.07, 0, Math.PI * 2);
    ctx.fill();
  };
}

export function Espiral() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvasLoop(canvasRef, createEspiral);
  return (
    <canvas
      ref={canvasRef}
      className="soto-canvas"
      role="img"
      aria-label="A black spiral with a white spiral on a clear sheet floating just above it. As you move, the sheet shifts and the two spirals produce swirling moiré patterns."
    />
  );
}
