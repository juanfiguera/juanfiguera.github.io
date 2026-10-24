"use client";

import { useRef } from "react";
import { useCanvasLoop, type Frame } from "./useCanvasLoop";

// pi * 12^2 ≈ 450 rods. The real one has ~1,800; at screen size that many fine lines vibrate enough to make people dizzy.
const GRID = 12;
const PERSPECTIVE = 14;
// Starting view: a three-quarter angle where rows of rods don't line up, so it reads as a solid sphere.
const START_ANGLE = 0.38;
// Drag sets where the sphere is headed; the view eases after it, so turns start and stop softly.
const FOLLOW = 9;
// After release the heading keeps gliding and slows down; it never turns on its own.
const FRICTION = 1.8;
const DEPTH_STEPS = 8;
const BACKGROUND = "#f3f1ec";
// Pendulum tuning: rods hang from the top of the panel on long nylon lines, so they swing slowly.
const GRAVITY = 1800;
const DAMPING = 0.55;
// Swings get harder to push the farther they go, instead of hitting a wall.
const STIFFENING = 900;
// How strongly lattice neighbors tug on each other, so a push ripples outward through the sphere.
const COUPLING = 0.5;
// The hand: rods within this many pixels of the cursor get carried along with it, fading toward the edge.
const HAND_RADIUS = 46;
const HAND_GRIP = 9;
// Rods slip past a moving hand instead of keeping pace with it, so they only take part of its speed.
const HAND_CARRY = 0.35;
// How much a rod lags behind when the sphere starts or stops turning.
const INERTIA = 0.45;
// Below this a rod is treated as hanging straight; it moves less than half a pixel.
const AT_REST = 0.0006;

type Rod = {
  // Position in the lattice (sphere radius = 1) and its fixed shade offset.
  latticeX: number;
  latticeZ: number;
  half: number;
  tone: number;
  neighbors: Rod[];
  // Pendulum state survives rotation: a rod you set swinging keeps swinging as you turn the sphere.
  angle: number;
  spin: number;
  // Screen projection, refreshed whenever the view angle or panel size changes.
  x: number;
  top: number;
  bottom: number;
  depth: number;
  bucket: number;
};

function buildRods(): Rod[] {
  const rods: Rod[] = [];
  const byCell = new Map<string, Rod>();
  for (let gx = -GRID; gx <= GRID; gx++) {
    for (let gz = -GRID; gz <= GRID; gz++) {
      const latticeX = gx / GRID;
      const latticeZ = gz / GRID;
      const r2 = latticeX * latticeX + latticeZ * latticeZ;
      if (r2 >= 1) continue;
      const hash = Math.sin(gx * 12.9898 + gz * 78.233) * 43758.5453;
      const rod: Rod = {
        latticeX,
        latticeZ,
        half: Math.sqrt(1 - r2),
        tone: (hash - Math.floor(hash)) * 2 - 1,
        neighbors: [],
        angle: 0,
        spin: 0,
        x: 0,
        top: 0,
        bottom: 0,
        depth: 0,
        bucket: 0,
      };
      rods.push(rod);
      byCell.set(`${gx},${gz}`, rod);
    }
  }
  byCell.forEach((rod, key) => {
    const [gx, gz] = key.split(",").map(Number);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const neighbor = byCell.get(`${gx + dx},${gz + dz}`);
      if (neighbor) rod.neighbors.push(neighbor);
    }
  });
  return rods;
}

// Rotation is only ever about the vertical axis, the one turn that keeps every rod hanging straight down.
function projectRods(rods: Rod[], view: number, width: number, height: number) {
  const radius = Math.min(width, height) * 0.4;
  const centerX = width / 2;
  const centerY = height / 2;
  const cos = Math.cos(view);
  const sin = Math.sin(view);
  for (const rod of rods) {
    const depth = -rod.latticeX * sin + rod.latticeZ * cos;
    const scale = PERSPECTIVE / (PERSPECTIVE - depth);
    rod.x = centerX + (rod.latticeX * cos + rod.latticeZ * sin) * radius * scale;
    rod.top = centerY - rod.half * radius * scale;
    rod.bottom = centerY + rod.half * radius * scale;
    rod.depth = depth;
    // Weathering: a per-rod offset nudges some rods a shade nearer or farther, so they read as individual rods.
    // Rods near the silhouette are pushed darker, which is what gives the real one its roundness.
    const rim = ((rod.x - centerX) / radius) ** 4;
    const bucket = Math.round(((depth + 1) / 2) * (DEPTH_STEPS - 1) + rod.tone * 0.9 - rim * 3);
    rod.bucket = Math.min(DEPTH_STEPS - 1, Math.max(0, bucket));
  }
  // Back to front, so nearer rods paint over farther ones within the same shade.
  rods.sort((a, b) => a.depth - b.depth);
}

function createEsfera() {
  const rods = buildRods();
  let view = START_ANGLE;
  let heading = START_ANGLE;
  let glide = 0;
  let projectedFor = "";
  let lastPointer = { x: 0, y: 0, active: false, down: false };
  let pointerVelocityX = 0;
  let viewVelocity = 0;
  let viewAcceleration = 0;
  let settled = false;

  return ({ ctx, width, height, dpr, dt, pointer }: Frame) => {
    const radius = Math.min(width, height) * 0.4;

    if (dt > 0) {
      // Smoothed pointer speed: a single frame's delta is too noisy to throw with or to brush with.
      const instant = lastPointer.active && pointer.active ? (pointer.x - lastPointer.x) / dt : 0;
      pointerVelocityX += (instant - pointerVelocityX) * Math.min(1, dt * 18);
    }

    if (pointer.down && lastPointer.down && dt > 0) {
      heading += (pointer.x - lastPointer.x) / radius;
      glide = pointerVelocityX / radius;
      settled = false;
    } else if (glide !== 0) {
      heading += glide * dt;
      glide *= Math.exp(-FRICTION * dt);
      if (Math.abs(glide) < 0.001) glide = 0;
      settled = false;
    }
    const previousView = view;
    if (Math.abs(heading - view) > 1e-5) {
      view += (heading - view) * Math.min(1, dt * FOLLOW);
      settled = false;
    } else {
      view = heading;
    }
    if (dt > 0) {
      // Smoothed, because frame timing jitter turns a raw second derivative into noise.
      const velocity = (view - previousView) / dt;
      viewAcceleration += ((velocity - viewVelocity) / dt - viewAcceleration) * Math.min(1, dt * 12);
      viewVelocity = velocity;
    }

    const projection = `${view}|${width}x${height}x${dpr}`;
    if (projection !== projectedFor) {
      projectRods(rods, view, width, height);
      projectedFor = projection;
      settled = false;
    }

    const brushing = pointer.active && !pointer.down && Math.abs(pointerVelocityX) > 5;
    if (brushing) settled = false;
    lastPointer = { x: pointer.x, y: pointer.y, active: pointer.active, down: pointer.down };

    // Nothing swinging, turning or being touched: leave the last frame on screen.
    if (settled) return;

    const turning = glide !== 0 || Math.abs(heading - view) > 1e-5;
    let moving = turning || Math.abs(viewAcceleration) > 0.01;
    for (const rod of rods) {
      const pivotLength = (rod.top + rod.bottom) / 2;
      // When the sphere turns, each rod's hook moves sideways at depth * radius * turn speed. Rods hang back
      // as it speeds up and swing on as it slows: front rods one way, back rods the other.
      const accelerationX = rod.depth * radius * viewAcceleration;

      let force =
        -(GRAVITY / pivotLength) * Math.sin(rod.angle) -
        STIFFENING * rod.angle ** 3 -
        DAMPING * rod.spin -
        (INERTIA * accelerationX) / pivotLength;
      for (const neighbor of rod.neighbors) force += COUPLING * (neighbor.angle - rod.angle);

      // The hand carries nearby rods with it: they are pulled toward moving at the cursor's speed.
      if (brushing && pointer.y > rod.top - HAND_RADIUS && pointer.y < rod.bottom + HAND_RADIUS) {
        const reachX = (pointer.x - (rod.x + Math.sin(rod.angle) * pointer.y)) / HAND_RADIUS;
        const reachY = pointer.y < rod.top ? (rod.top - pointer.y) / HAND_RADIUS : pointer.y > rod.bottom ? (pointer.y - rod.bottom) / HAND_RADIUS : 0;
        const contact = Math.exp(-(reachX * reachX + reachY * reachY) * 2);
        if (contact > 0.01) {
          const handSpin = (pointerVelocityX * HAND_CARRY) / pointer.y;
          force += (handSpin - rod.spin) * HAND_GRIP * contact;
        }
      }

      rod.spin += force * dt;
    }
    for (const rod of rods) {
      rod.angle += rod.spin * dt;
      if (Math.abs(rod.angle) < AT_REST && Math.abs(rod.spin) < AT_REST) {
        rod.angle = 0;
        rod.spin = 0;
        continue;
      }
      moving = true;
    }

    const top = height / 2 - radius * 1.1;
    const bottom = height / 2 + radius * 1.1;
    const snap = (value: number) => Math.round(value * dpr) / dpr;
    // Snapped rods are cheap and crisp at rest, but while turning they would step a pixel at a time.
    const place = turning ? (value: number) => value : snap;
    const pixel = 1 / dpr;
    const rodWidth = Math.max(pixel, radius / 260);

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // Nylon suspension lines: barely there, but they are what make it hang instead of float.
    ctx.fillStyle = "#eeebe5";
    ctx.strokeStyle = "#eeebe5";
    ctx.lineWidth = pixel;
    ctx.beginPath();
    for (const rod of rods) {
      if (rod.angle === 0) {
        ctx.fillRect(place(rod.x), 0, pixel, snap(rod.top));
        continue;
      }
      ctx.moveTo(rod.x, 0);
      ctx.lineTo(rod.x + Math.sin(rod.angle) * rod.top, rod.top * Math.cos(rod.angle));
    }
    ctx.stroke();

    for (let index = 0; index < DEPTH_STEPS; index++) {
      const t = index / (DEPTH_STEPS - 1);
      // Sunlight from above: tops of the rods catch more light than the bottoms.
      // Far rods sit in the sphere's own shade, so they get darker, not paler.
      const haze = 0.12 * (1 - t);
      const dark = 1 - t;
      const tint = (r: number, g: number, b: number) =>
        `rgb(${Math.round(r + (243 - r) * haze)}, ${Math.round(g + (241 - g) * haze)}, ${Math.round(b + (236 - b) * haze)})`;
      const light = ctx.createLinearGradient(0, top, 0, bottom);
      light.addColorStop(0, tint(230 - 70 * dark, 114 - 50 * dark, 50 - 24 * dark));
      light.addColorStop(0.55, tint(210 - 80 * dark, 82 - 42 * dark, 32 - 16 * dark));
      light.addColorStop(1, tint(152 - 64 * dark, 52 - 26 * dark, 22 - 10 * dark));
      ctx.fillStyle = light;
      ctx.strokeStyle = light;
      const barWidth = Math.max(pixel, snap(rodWidth * (0.9 + t * 0.25)));
      ctx.lineWidth = barWidth;

      // Hanging-straight rods are drawn as rectangles, which are nearly free. Only the ones that are
      // swinging get stroked as tilted lines.
      ctx.beginPath();
      for (const rod of rods) {
        if (rod.bucket !== index) continue;
        if (rod.angle === 0) {
          const rodTop = snap(rod.top);
          ctx.fillRect(place(rod.x - barWidth / 2), rodTop, barWidth, snap(rod.bottom) - rodTop);
          continue;
        }
        const sin = Math.sin(rod.angle);
        const cos = Math.cos(rod.angle);
        ctx.moveTo(rod.x + sin * rod.top, rod.top * cos);
        ctx.lineTo(rod.x + sin * rod.bottom, rod.bottom * cos);
      }
      ctx.stroke();
    }

    // While a drag is held the frame may not change, but the next pointer move must still redraw.
    settled = !moving && !pointer.down && !brushing;
  };
}

export function Esfera() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useCanvasLoop(canvasRef, createEsfera);
  return (
    <canvas
      ref={canvasRef}
      className="soto-canvas soto-canvas--grab"
      role="img"
      aria-label="A sphere made only of about 450 thin burnt-orange rods hanging on nylon lines. Drag to turn it around its vertical axis; brushing through it sets the rods you pass swinging gently before they settle back into place."
    />
  );
}
