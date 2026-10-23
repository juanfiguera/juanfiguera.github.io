"use client";

import { useRef } from "react";
import { useCanvasLoop, type Frame } from "./useCanvasLoop";

const INK = "#14120f";

// Hanging wires in the spirit of Soto's "Escritura" series: x and length as fractions of the panel.
const WIRES = [
  { x: 0.58, top: 0.14, length: 0.5, curl: 18, turns: 2.2, phase: 0 },
  { x: 0.66, top: 0.22, length: 0.42, curl: 26, turns: 1.4, phase: 1.3 },
  { x: 0.73, top: 0.1, length: 0.62, curl: 14, turns: 3.1, phase: 2.1 },
  { x: 0.81, top: 0.26, length: 0.38, curl: 22, turns: 1.8, phase: 0.6 },
  { x: 0.88, top: 0.16, length: 0.54, curl: 16, turns: 2.6, phase: 2.8 },
];

const SQUARES = [
  { x: 0.62, y: 0.78, size: 0.07, color: "#b8281d", phase: 0.4 },
  { x: 0.9, y: 0.82, size: 0.05, color: "#1e3f8f", phase: 2.2 },
];

function drawStripes(ctx: CanvasRenderingContext2D, extent: number, period: number, ink: number) {
  for (let x = -extent; x < extent; x += period) ctx.fillRect(x, -extent, ink, extent * 2);
}

function createVibracion() {
  let sway = 0;

  return ({ ctx, width, height, dpr, time, dt, pointer }: Frame) => {
    const target = pointer.active ? (pointer.x / width - 0.5) * 2 : 0;
    sway += (target - sway) * Math.min(1, dt * 3);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Background stripes snapped to whole device pixels; blurry stripes kill the moiré.
    const period = Math.round(6 * dpr);
    const ink = Math.round(2 * dpr);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = INK;
    for (let x = 0; x < width * dpr; x += period) ctx.fillRect(x, 0, ink, height * dpr);
    ctx.restore();

    // A striped plane floating in front, a few degrees off: where it overlaps, the bands appear.
    const side = Math.min(width, height) * 0.5;
    const angle = (3.5 * Math.sin(time * 0.22) + sway * 4) * (Math.PI / 180);
    ctx.save();
    ctx.translate(width * 0.3, height * 0.5);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.rect(-side / 2, -side / 2, side, side);
    ctx.clip();
    ctx.fillStyle = INK;
    drawStripes(ctx, side, period / dpr, ink / dpr);
    ctx.restore();

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const wire of WIRES) {
      const anchorX = wire.x * width;
      const topY = wire.top * height;
      const length = wire.length * height;
      const swing = 0.06 * Math.sin(time * 0.8 + wire.phase) + sway * 0.12;

      ctx.strokeStyle = "rgba(20, 18, 15, 0.25)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(anchorX, 0);
      ctx.lineTo(anchorX + Math.sin(swing) * topY, topY);
      ctx.stroke();

      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const along = topY + t * length;
        const curl =
          wire.curl * Math.sin(t * Math.PI * 2 * wire.turns + wire.phase + time * 0.5) * Math.sin(t * Math.PI);
        const x = anchorX + Math.sin(swing) * along + curl;
        if (i === 0) ctx.moveTo(x, along);
        else ctx.lineTo(x, along);
      }
      ctx.stroke();
    }

    for (const square of SQUARES) {
      const size = square.size * Math.min(width, height) * 2;
      ctx.save();
      ctx.translate(square.x * width + sway * 10, square.y * height);
      ctx.rotate(0.12 * Math.sin(time * 0.5 + square.phase) + sway * 0.2);
      ctx.fillStyle = square.color;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
  };
}

export function Vibracion() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvasLoop(canvasRef, createVibracion);
  return (
    <canvas
      ref={canvasRef}
      className="soto-canvas"
      role="img"
      aria-label="Fine black vertical stripes with a tilted striped square floating in front, curling black wires and two small colored squares. Where the layers overlap, the stripes appear to vibrate."
    />
  );
}
