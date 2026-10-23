"use client";

import { useRef } from "react";
import { useCanvasLoop, type Frame } from "./useCanvasLoop";

const SEGMENTS = 20;
const SPACING = 11;
const TENSION = 1400;
const STIFFNESS = 4;
const DAMPING = 3;
const PUSH = 220;
const MAX_SWING = 140;
const HAND_RADIUS = 58;
const IDLE_BEFORE_VISITORS = 2.5;

// Three depth rows, back to front, so the field reads as a volume rather than a flat curtain.
const LAYERS = [
  { offset: 0, lineWidth: 1, color: "rgba(214, 168, 18, 0.4)" },
  { offset: SPACING / 3, lineWidth: 1.4, color: "rgba(230, 178, 8, 0.7)" },
  { offset: (SPACING * 2) / 3, lineWidth: 1.9, color: "#efb500" },
];

type Thread = {
  x: number;
  layer: number;
  dx: Float32Array;
  vx: Float32Array;
};

// A body is a head circle on top of a torso column that runs to the floor.
type Body = { x: number; headY: number; headRadius: number; bodyRadius: number };

function bodyRadiusAt(body: Body, y: number): number {
  if (y < body.headY - body.headRadius) return 0;
  if (y < body.headY + body.headRadius) {
    const dy = y - body.headY;
    return Math.sqrt(body.headRadius ** 2 - dy * dy);
  }
  return body.bodyRadius;
}

function handRadiusAt(hand: { x: number; y: number }, y: number): number {
  const dy = y - hand.y;
  if (Math.abs(dy) >= HAND_RADIUS) return 0;
  return Math.sqrt(HAND_RADIUS ** 2 - dy * dy);
}

// Force, not position: a fast hand slips through the threads, a slow one drags them along.
function pushForce(position: number, restX: number, bodyX: number, radius: number): number {
  if (radius <= 0) return 0;
  const gap = position - bodyX;
  const overlap = radius - Math.abs(gap);
  if (overlap <= 0) return 0;
  const side = gap === 0 ? Math.sign(restX - bodyX) || 1 : Math.sign(gap);
  return side * overlap * PUSH;
}

function buildThreads(width: number): Thread[] {
  const threads: Thread[] = [];
  LAYERS.forEach((layer, layerIndex) => {
    for (let x = layer.offset - SPACING; x < width + SPACING; x += SPACING) {
      threads.push({
        x,
        layer: layerIndex,
        dx: new Float32Array(SEGMENTS + 1),
        vx: new Float32Array(SEGMENTS + 1),
      });
    }
  });
  return threads;
}

// A tall visitor and two small ones walking through together, the way we did with my dad.
function familyAt(time: number, width: number, height: number): Body[] {
  const loop = width + 520;
  const lead = width + 260 - ((time * width) / 16) % loop;
  const bob = (phase: number) => Math.sin(time * 6 + phase) * 3;
  return [
    { x: lead, headY: height * 0.3 + bob(0), headRadius: 22, bodyRadius: 34 },
    { x: lead + 70, headY: height * 0.56 + bob(1.7), headRadius: 17, bodyRadius: 24 },
    { x: lead + 130, headY: height * 0.6 + bob(3.1), headRadius: 16, bodyRadius: 22 },
  ];
}

function createPenetrable() {
  let threads: Thread[] = [];
  let builtWidth = -1;
  let lastTouch = -Infinity;

  return ({ ctx, width, height, time, dt, pointer }: Frame) => {
    if (width !== builtWidth) {
      threads = buildThreads(width);
      builtWidth = width;
    }

    if (pointer.active) lastTouch = time;
    const visitors = time - lastTouch > IDLE_BEFORE_VISITORS ? familyAt(time, width, height) : [];
    const segmentLength = (height * 0.97) / SEGMENTS;
    const step = dt / 2;

    for (let substep = 0; substep < 2 && dt > 0; substep++) {
      for (const thread of threads) {
        const { dx, vx } = thread;
        for (let j = 1; j <= SEGMENTS; j++) {
          const y = j * segmentLength;
          const position = thread.x + dx[j];
          const below = j < SEGMENTS ? dx[j + 1] : dx[j];
          const wind = 5 * Math.sin(time * 0.6 + thread.x * 0.004) * (j / SEGMENTS);
          let acceleration =
            TENSION * (dx[j - 1] + below - 2 * dx[j]) - STIFFNESS * dx[j] - DAMPING * vx[j] + wind;

          if (pointer.active) {
            acceleration += pushForce(position, thread.x, pointer.x, handRadiusAt(pointer, y));
          }
          for (const visitor of visitors) {
            acceleration += pushForce(position, thread.x, visitor.x, bodyRadiusAt(visitor, y));
          }

          vx[j] += acceleration * step;
        }
        for (let j = 1; j <= SEGMENTS; j++) {
          dx[j] = Math.max(-MAX_SWING, Math.min(MAX_SWING, dx[j] + vx[j] * step));
        }
      }
    }

    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    LAYERS.forEach((layer, layerIndex) => {
      ctx.beginPath();
      for (const thread of threads) {
        if (thread.layer !== layerIndex) continue;
        const { x, dx } = thread;
        ctx.moveTo(x, 0);
        for (let j = 1; j < SEGMENTS; j++) {
          const midX = x + (dx[j] + dx[j + 1]) / 2;
          const midY = (j + 0.5) * segmentLength;
          ctx.quadraticCurveTo(x + dx[j], j * segmentLength, midX, midY);
        }
        ctx.lineTo(x + dx[SEGMENTS], SEGMENTS * segmentLength);
      }
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = layer.lineWidth;
      ctx.stroke();
    });
  };
}

export function Penetrable() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvasLoop(canvasRef, createPenetrable);
  return (
    <canvas
      ref={canvasRef}
      className="soto-canvas"
      role="img"
      aria-label="Hundreds of thin yellow threads hanging from the ceiling to the floor. They part and sway as you move through them."
    />
  );
}
