import type { ShotName } from "./timeline";

export const INK = "#0c0b0a";
export const PAPER = "#f3f1ec";
export const YELLOW = "#f2c12e";
export const RED = "#d4321f";
export const BLUE = "#1d4fb8";

export type Fonts = { sans: string; mono: string };

export type FilmPointer = { x: number; y: number; active: boolean; moved: boolean };

export type ShotFrame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dt: number;
  time: number;
  beat: number;
  // Beats since this shot started, and its length in beats.
  local: number;
  length: number;
  entered: boolean;
  pointer: FilmPointer;
};

export type Pluck = (frequency: number, strength: number) => void;

type DrawShot = (frame: ShotFrame) => void;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (value: number) => 1 - (1 - clamp01(value)) ** 3;
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

// Sharp attack on every beat, decaying before the next: the visual twin of the kick drum.
export const pulse = (beat: number, sharpness = 5) => Math.exp(-(beat - Math.floor(beat)) * sharpness);

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A minor pentatonic across three octaves, low on the left.
const PENTATONIC = [0, 3, 5, 7, 10];
export const noteFor = (index: number, count: number) => {
  const step = Math.round((index / Math.max(1, count - 1)) * (PENTATONIC.length * 3 - 1));
  const semitones = PENTATONIC[step % PENTATONIC.length] + Math.floor(step / PENTATONIC.length) * 12;
  return 110 * 2 ** (semitones / 12);
};

export type VibratingString = { x: number; amplitude: number; phase: number; note: number };

const STRING_HZ = 9;
const STRING_DECAY = 1.4;

// Pointer crossing a string plucks it, the way a hand brushing a Penetrable sets threads swinging.
export function brushStrings(
  strings: VibratingString[],
  pointer: FilmPointer,
  lastX: number | null,
  dt: number,
  maxAmplitude: number,
  pluck: Pluck,
) {
  const speed = lastX === null || dt <= 0 ? 0 : Math.abs(pointer.x - lastX) / dt;
  for (const string of strings) {
    if (pointer.active && lastX !== null && (lastX - string.x) * (pointer.x - string.x) < 0) {
      const strength = clamp01(speed / 2500);
      string.amplitude = Math.min(maxAmplitude, string.amplitude + maxAmplitude * (0.35 + strength * 0.65));
      pluck(string.note, strength);
    }
    string.amplitude *= Math.exp(-dt * STRING_DECAY);
    string.phase += dt * Math.PI * 2 * STRING_HZ;
  }
}

export function drawStrings(
  ctx: CanvasRenderingContext2D,
  strings: VibratingString[],
  top: number,
  bottom: number,
  lineWidth: number,
) {
  const steps = 28;
  for (const string of strings) {
    const span = bottom - top;
    // The blur a fast-vibrating string leaves in your eye: a soft lens between its two extremes.
    if (string.amplitude > 0.5) {
      ctx.fillStyle = "rgba(242, 193, 46, 0.16)";
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        ctx.lineTo(string.x + string.amplitude * Math.sin(Math.PI * u), top + span * u);
      }
      for (let i = steps; i >= 0; i--) {
        const u = i / steps;
        ctx.lineTo(string.x - string.amplitude * Math.sin(Math.PI * u), top + span * u);
      }
      ctx.fill();
    }
    ctx.strokeStyle = YELLOW;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const x = string.x + string.amplitude * Math.sin(Math.PI * u) * Math.cos(string.phase);
      if (i === 0) ctx.moveTo(x, top + span * u);
      else ctx.lineTo(x, top + span * u);
    }
    ctx.stroke();
  }
}

export function vignette(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.hypot(width, height) * 0.62);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function createThread(pluck: Pluck): DrawShot {
  const strings: VibratingString[] = [{ x: 0, amplitude: 0, phase: 0, note: 220 }];
  let lastX: number | null = null;
  let lastBeat = -1;

  return ({ ctx, width, height, dt, local, entered, pointer }) => {
    const top = height * 0.08;
    const bottom = top + height * 0.84 * easeOut(local / 1.2);
    const string = strings[0];
    string.x = width / 2;
    if (entered) {
      string.amplitude = 0;
      lastBeat = -1;
    }
    // The score plucks this string on every beat; the picture answers on the same beat.
    const beatIndex = Math.floor(local);
    if (beatIndex !== lastBeat) {
      lastBeat = beatIndex;
      string.amplitude = Math.max(string.amplitude, height * (beatIndex % 4 === 3 ? 0.05 : 0.03));
    }
    brushStrings(strings, pointer, lastX, dt, height * 0.08, pluck);
    lastX = pointer.active ? pointer.x : null;

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, width, height);

    // In the last bar the one line becomes many: the river is next.
    const multiply = easeInOut((local - 5) / 3);
    if (multiply > 0) {
      const count = Math.floor(multiply * 60);
      const spacing = width / 62;
      ctx.strokeStyle = `rgba(242, 193, 46, ${0.25 + multiply * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i <= count; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const x = width / 2 + side * Math.ceil(i / 2) * spacing * (0.4 + multiply * 0.6);
        const wobble = Math.sin(local * 9 + i) * pulse(local, 4) * 3;
        ctx.moveTo(x, top);
        ctx.quadraticCurveTo(x + wobble * 2, (top + bottom) / 2, x, bottom);
      }
      ctx.stroke();
    }
    drawStrings(ctx, strings, top, bottom, 2);
    vignette(ctx, width, height, 0.5);
  };
}

function drawRiver({ ctx, width, height, time, beat, local, pointer }: ShotFrame) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, width, height);
  const horizon = height * 0.16;
  const lines = 64;
  const segments = 56;
  const kick = pulse(beat, 4);
  const reveal = easeOut(local / 1.5);
  for (let i = 0; i < lines; i++) {
    const depth = (i + 1) / lines;
    if (depth > reveal * 1.05) continue;
    const baseY = horizon + (height - horizon) * depth ** 1.7;
    const amplitude = (3 + 24 * depth) * (0.7 + 0.6 * kick);
    const frequency = 0.006 / (0.25 + depth);
    ctx.strokeStyle = `rgba(242, 193, 46, ${0.18 + depth * 0.8})`;
    ctx.lineWidth = 0.6 + depth * 2.4;
    ctx.beginPath();
    for (let s = 0; s <= segments; s++) {
      const x = (s / segments) * width;
      let y = baseY + amplitude * Math.sin(x * frequency + time * 1.5 + i * 0.55) + amplitude * 0.4 * Math.sin(x * frequency * 2.3 - time * 1.1 + i);
      if (pointer.active) {
        // Rings spreading from the pointer, like a hand trailing in the water.
        const distance = Math.hypot(x - pointer.x, baseY - pointer.y);
        y += Math.exp(-distance / 140) * 26 * Math.sin(time * 7 - distance * 0.06);
      }
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  vignette(ctx, width, height, 0.55);
}

type Poster = { background: string; ink: string; accent: string; word: string; layout: 0 | 1 | 2 };

// Spanish cinema billboard words, the kind he painted in Ciudad Bolívar as a teenager.
const POSTERS: Poster[] = [
  { background: RED, ink: YELLOW, accent: INK, word: "CINE", layout: 0 },
  { background: YELLOW, ink: INK, accent: RED, word: "HOY", layout: 1 },
  { background: INK, ink: PAPER, accent: RED, word: "ESTRENO", layout: 2 },
  { background: BLUE, ink: YELLOW, accent: PAPER, word: "FUNCIÓN", layout: 0 },
  { background: PAPER, ink: RED, accent: BLUE, word: "CINE", layout: 1 },
  { background: RED, ink: INK, accent: YELLOW, word: "GRAN", layout: 2 },
  { background: YELLOW, ink: BLUE, accent: INK, word: "ESTRENO", layout: 0 },
  { background: INK, ink: YELLOW, accent: RED, word: "SOTO", layout: 1 },
];

function createPosters(fonts: Fonts): DrawShot {
  const fitText = (ctx: CanvasRenderingContext2D, word: string, targetWidth: number) => {
    ctx.font = `500 100px ${fonts.sans}`;
    return (100 * targetWidth) / ctx.measureText(word).width;
  };

  return ({ ctx, width, height, local }) => {
    const poster = POSTERS[Math.min(POSTERS.length - 1, Math.floor(local))];
    // Each cut lands slightly zoomed and settles, which reads as a hard hit on the beat.
    const zoom = 1 + 0.07 * pulse(local, 5);
    ctx.save();
    ctx.fillStyle = poster.background;
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);
    ctx.textBaseline = "alphabetic";

    if (poster.layout === 0) {
      ctx.fillStyle = poster.accent;
      const bandTop = height * 0.62;
      for (let x = 0; x < width; x += 18) ctx.fillRect(x, bandTop, 9, height * 0.2);
      const size = fitText(ctx, poster.word, width * 0.92);
      ctx.font = `500 ${size}px ${fonts.sans}`;
      ctx.fillStyle = poster.ink;
      ctx.fillText(poster.word, width * 0.04, height * 0.18 + size * 0.72);
    } else if (poster.layout === 1) {
      ctx.fillStyle = poster.accent;
      ctx.beginPath();
      ctx.arc(width * 0.68, height * 0.42, Math.min(width, height) * 0.3, 0, Math.PI * 2);
      ctx.fill();
      const size = fitText(ctx, poster.word, height * 0.9);
      ctx.font = `500 ${size}px ${fonts.sans}`;
      ctx.fillStyle = poster.ink;
      ctx.save();
      ctx.translate(width * 0.04 + size * 0.74, height * 0.95);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(poster.word, 0, 0);
      ctx.restore();
    } else {
      ctx.fillStyle = poster.accent;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-0.12);
      ctx.fillRect(-width * 0.7, -height * 0.14, width * 1.4, height * 0.28);
      ctx.restore();
      const size = fitText(ctx, poster.word, width * 0.86);
      ctx.font = `500 ${size}px ${fonts.sans}`;
      ctx.fillStyle = poster.ink;
      ctx.fillText(poster.word, width * 0.07, height * 0.5 + size * 0.36);
    }
    ctx.restore();
  };
}

type Bar = { x: number; width: number };

function createParis(): DrawShot {
  let rows: Bar[][] = [];
  let builtFor = "";
  const ROWS = 7;

  return ({ ctx, width, height, time, local }) => {
    const key = `${width}x${height}`;
    if (key !== builtFor) {
      builtFor = key;
      const random = seeded(1950);
      rows = Array.from({ length: ROWS }, () => {
        const bars: Bar[] = [];
        for (let x = 0; x < width; ) {
          const barWidth = 3 + random() * 26;
          bars.push({ x, width: barWidth });
          x += barWidth + 6 + random() * 40;
        }
        return bars;
      });
    }

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, width, height);
    const rowHeight = height / ROWS;
    // Over the second bar the free composition locks into an even grating: the moiré is about to start.
    const order = easeInOut((local - 4) / 4);

    ctx.fillStyle = PAPER;
    rows.forEach((bars, row) => {
      let offset = 0;
      for (let step = 0; step <= Math.min(7, Math.floor(local)); step++) {
        const delta = (((row * 7 + step * 3) % 5) - 2) * width * 0.05;
        offset += step === Math.floor(local) ? delta * easeOut((local - step) / 0.3) : delta;
      }
      offset += Math.sin(time * 7 + row * 1.7) * order * 6;
      const y = row * rowHeight + 3;
      bars.forEach((bar, index) => {
        const evenX = (index / bars.length) * width;
        const x = lerp(bar.x, evenX, order) + offset;
        const barWidth = lerp(bar.width, 2.6, order);
        const wrapped = ((x % width) + width) % width;
        ctx.fillRect(wrapped, y, barWidth, rowHeight - 6);
      });
    });
    vignette(ctx, width, height, 0.45);
  };
}

function createMoire(): DrawShot {
  let centerX = 0;
  let centerY = 0;

  return ({ ctx, width, height, time, beat, local, entered, pointer, dt }) => {
    const kick = pulse(beat, 6);
    const targetX = pointer.active ? pointer.x : width / 2 + Math.cos(time * 0.7) * width * 0.22;
    const targetY = pointer.active ? pointer.y : height / 2 + Math.sin(time * 0.9) * height * 0.2;
    const ease = entered ? 1 : Math.min(1, dt * 6);
    centerX += (targetX - centerX) * ease;
    centerY += (targetY - centerY) * ease;

    ctx.save();
    // The drop: the screen flips from black to white and lands with a small zoom.
    const punch = 1 + 0.12 * Math.exp(-local * 3);
    ctx.translate(width / 2, height / 2);
    ctx.scale(punch, punch);
    ctx.translate(-width / 2, -height / 2);
    ctx.fillStyle = PAPER;
    ctx.fillRect(-width, -height, width * 3, height * 3);
    ctx.fillStyle = INK;
    ctx.strokeStyle = INK;
    const diagonal = Math.hypot(width, height);

    if (local < 8) {
      const spacing = 7;
      const lineWidth = 3 + kick * 0.6;
      for (let x = -spacing; x < width + spacing; x += spacing) ctx.fillRect(x, -height, lineWidth, height * 3);
      const angle = 0.05 + 0.035 * Math.sin(time * 0.6) + ((centerX - width / 2) / width) * 0.12 + kick * 0.012;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      for (let x = -diagonal; x < diagonal; x += spacing) ctx.fillRect(x, -diagonal, lineWidth, diagonal * 2);
      ctx.restore();
    } else {
      // Two sets of rings, one fixed and one riding the pointer, bloom into Soto's interference waves.
      const spacing = 8;
      ctx.lineWidth = 3.4 + kick * 0.8;
      const rings = (x: number, y: number) => {
        ctx.beginPath();
        for (let radius = spacing; radius < diagonal * 1.2; radius += spacing) {
          ctx.moveTo(x + radius, y);
          ctx.arc(x, y, radius, 0, Math.PI * 2);
        }
        ctx.stroke();
      };
      rings(width / 2, height / 2);
      rings(lerp(width / 2, centerX, 0.6), lerp(height / 2, centerY, 0.6));
    }
    ctx.restore();
  };
}

function createVibration(): DrawShot {
  return ({ ctx, width, height, time, beat, pointer }) => {
    const kick = pulse(beat, 5);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = INK;
    for (let x = 0; x < width; x += 5) ctx.fillRect(x, 0, 2, height);

    const unit = Math.min(width, height);
    const scale = 1 + kick * 0.04;
    ctx.fillStyle = RED;
    const red = unit * 0.3 * scale;
    ctx.fillRect(width * 0.18, height * 0.16, red, red);
    ctx.fillStyle = BLUE;
    const blue = unit * 0.22 * scale;
    ctx.fillRect(width * 0.66, height * 0.5, blue, blue);

    // A striped square tilted against the background: where the two gratings meet, it vibrates.
    ctx.save();
    ctx.translate(width * 0.5, height * 0.48);
    ctx.rotate(0.07 + Math.sin(time * 0.8) * 0.03 + kick * 0.03);
    const size = unit * 0.36;
    ctx.fillStyle = PAPER;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.fillStyle = INK;
    for (let x = -size / 2; x < size / 2; x += 5) ctx.fillRect(x, -size / 2, 2, size);
    ctx.restore();

    // Hanging wires, the "Escrituras": they dissolve wherever they cross the stripes.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const anchor = width * (0.1 + i * 0.13);
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) {
        const u = s / 40;
        const y = height * (0.05 + u * 0.8);
        let x = anchor + Math.sin(u * 5 + time * 1.3 + i * 2.1) * 40 * u + Math.sin(beat * Math.PI + i) * kick * 14 * u;
        if (pointer.active) {
          const distance = Math.hypot(x - pointer.x, y - pointer.y);
          x += Math.sign(x - pointer.x || 1) * Math.max(0, 90 - distance) * 0.6;
        }
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };
}

type Thread = { x: number; z: number; phase: number };

function createPenetrable(): DrawShot {
  const DEPTH = 36;
  const threads: Thread[] = [];
  const random = seeded(1993);
  for (let x = -9; x <= 9; x += 0.7) {
    for (let z = 0; z < DEPTH; z += 1.1) {
      threads.push({ x: x + (random() - 0.5) * 0.2, z: z + random() * 0.5, phase: random() * Math.PI * 2 });
    }
  }
  const BUCKETS = 10;
  let cameraZ = 0;
  let cameraX = 0;

  return ({ ctx, width, height, dt, time, beat, local, entered, pointer }) => {
    if (entered) {
      cameraZ = 0;
      cameraX = 0;
    }
    // A slow walk through the breakdown, then a run when the beat drops back in.
    const dropped = local >= 8;
    const speed = dropped ? 5.2 : 1.4 + local * 0.2;
    cameraZ += speed * dt;
    const targetX = pointer.active ? (pointer.x / width - 0.5) * 7 : Math.sin(time * 0.35) * 2.4;
    cameraX += (targetX - cameraX) * Math.min(1, dt * 2.5);

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, width, height);

    const kick = pulse(beat, 5);
    const punch = dropped ? 1 + 0.22 * Math.exp(-(local - 8) * 3) : 1;
    const focal = height * 0.85 * punch;
    const centerX = width / 2;
    const centerY = height * 0.46;
    const CEILING = -2.5;
    const BODY = 0.1;
    const FLOOR = 1.7;
    const paths = Array.from({ length: BUCKETS }, () => new Path2D());

    for (const thread of threads) {
      const relativeZ = (((thread.z - cameraZ) % DEPTH) + DEPTH) % DEPTH;
      if (relativeZ < 0.3) continue;
      const offset = thread.x - cameraX;
      // You are the visitor: threads close to you part around your body.
      const nearness = relativeZ < 5 ? 1 - relativeZ / 5 : 0;
      const push = nearness * Math.max(0, 1.6 - Math.abs(offset)) * Math.sign(offset || 1) * 1.2;
      const sway = Math.sin(thread.phase + beat * Math.PI) * 0.05 * kick;
      const project = (x: number, y: number): [number, number] => [centerX + (x / relativeZ) * focal, centerY + (y / relativeZ) * focal];
      const [topX, topY] = project(offset + sway, CEILING);
      const [bodyX, bodyY] = project(offset + push + sway * 2, BODY);
      const [floorX, floorY] = project(offset + push * 0.6 + sway * 2, FLOOR);
      if (Math.max(topX, bodyX, floorX) < -10 || Math.min(topX, bodyX, floorX) > width + 10) continue;
      // Threads right in front of your face would be blurry giants; the first bucket is drawn faint instead.
      const path = paths[relativeZ < 1.4 ? 0 : Math.min(BUCKETS - 1, 1 + Math.floor((relativeZ / DEPTH) * (BUCKETS - 1)))];
      path.moveTo(topX, topY);
      path.quadraticCurveTo(bodyX * 2 - (topX + floorX) / 2, bodyY * 2 - (topY + floorY) / 2, floorX, floorY);
    }

    const reveal = easeOut(local / 1.5);
    for (let bucket = BUCKETS - 1; bucket >= 0; bucket--) {
      const middleZ = bucket === 0 ? 1 : ((bucket - 0.5) / (BUCKETS - 1)) * DEPTH;
      const fog = bucket === 0 ? 0.22 : (1 - middleZ / DEPTH) ** 2.2;
      ctx.strokeStyle = `rgba(242, 193, 46, ${fog * reveal * (0.75 + kick * 0.25)})`;
      ctx.lineWidth = Math.min(4, Math.max(0.5, (0.035 * focal) / middleZ));
      ctx.stroke(paths[bucket]);
    }
    vignette(ctx, width, height, 0.7);
  };
}

type Column = { x: number; z: number; half: number; scatterX: number; scatterZ: number };

function createEsfera(): DrawShot {
  const GRID = 18;
  const columns: Column[] = [];
  const random = seeded(1996);
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = -1 + ((i + 0.5) * 2) / GRID;
      const z = -1 + ((j + 0.5) * 2) / GRID;
      const squared = 1 - x * x - z * z;
      if (squared <= 0.02) continue;
      columns.push({ x, z, half: Math.sqrt(squared), scatterX: x * 3 + (random() - 0.5) * 2, scatterZ: z * 3 + (random() - 0.5) * 2 });
    }
  }
  let heading = 0;

  return ({ ctx, width, height, dt, beat, local, entered, pointer }) => {
    if (entered) heading = 0;
    const steer = pointer.active ? (pointer.x / width - 0.5) * 2.2 : 0;
    heading += (0.55 + steer) * dt;

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, width, height);
    const kick = pulse(beat, 5);
    // The Penetrable's threads gather and shorten into the sphere over the first bar.
    const assemble = easeInOut(local / 2.5);
    const distance = lerp(4.6, 3.3, easeOut(local / 16)) * (1 - kick * 0.015);
    const focal = Math.min(width, height) * 1.25;
    const centerX = width / 2;
    const centerY = height * 0.47;
    const cos = Math.cos(heading);
    const sin = Math.sin(heading);
    // A bright band sweeps across the rods once per bar, like sun moving over the aluminum.
    const sweep = -1.3 + (((beat % 4) + 4) % 4) * 0.65;

    const placed = columns.map((column) => {
      const x = lerp(column.scatterX, column.x, assemble);
      const z = lerp(column.scatterZ, column.z, assemble);
      const half = lerp(1.8, column.half, assemble);
      const turnedX = x * cos - z * sin;
      const depth = x * sin + z * cos + distance;
      return { turnedX, depth, half };
    });
    placed.sort((a, b) => b.depth - a.depth);

    ctx.lineCap = "butt";
    for (const rod of placed) {
      if (rod.depth < 0.3) continue;
      const screenX = centerX + (rod.turnedX / rod.depth) * focal;
      const top = centerY - (rod.half / rod.depth) * focal;
      const bottom = centerY + (rod.half / rod.depth) * focal;
      const near = clamp01((distance + 1 - rod.depth) / 2);
      const glint = Math.exp(-((rod.turnedX - sweep) ** 2) / 0.03) * (0.4 + kick * 0.6);
      const red = Math.round(lerp(242, 236, assemble) + glint * 13);
      const green = Math.round(lerp(193, 128, assemble) * (0.55 + near * 0.45) + glint * 110);
      const blue = Math.round(lerp(46, 40, assemble) * (0.6 + near * 0.4) + glint * 150);
      ctx.strokeStyle = `rgb(${Math.min(255, red)}, ${Math.min(255, green)}, ${Math.min(255, blue)})`;
      ctx.globalAlpha = (0.35 + near * 0.65) * (0.45 + assemble * 0.55);
      ctx.lineWidth = Math.max(0.8, (0.018 * focal) / rod.depth);
      ctx.beginPath();
      ctx.moveTo(screenX, top);
      ctx.lineTo(screenX, bottom);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    vignette(ctx, width, height, 0.6);
  };
}

function createFarewell(pluck: Pluck): DrawShot {
  const strings: VibratingString[] = [{ x: 0, amplitude: 0, phase: 0, note: 220 }];
  let lastX: number | null = null;
  let lastBeat = -1;

  return ({ ctx, width, height, dt, local, entered, pointer }) => {
    const string = strings[0];
    string.x = width / 2;
    if (entered) {
      string.amplitude = 0;
      lastBeat = -1;
    }
    const beatIndex = Math.floor(local);
    if (beatIndex !== lastBeat) {
      lastBeat = beatIndex;
      if (beatIndex < 8) string.amplitude = Math.max(string.amplitude, height * 0.03);
      if (beatIndex === 8) string.amplitude = height * 0.08;
    }
    brushStrings(strings, pointer, lastX, dt, height * 0.08, pluck);
    lastX = pointer.active ? pointer.x : null;

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, width, height);
    drawStrings(ctx, strings, height * 0.08, height * 0.92, 2);
    vignette(ctx, width, height, 0.5);
  };
}

export function createShots(fonts: Fonts, pluck: Pluck): Record<ShotName, DrawShot> {
  return {
    thread: createThread(pluck),
    river: drawRiver,
    posters: createPosters(fonts),
    paris: createParis(),
    moire: createMoire(),
    vibration: createVibration(),
    penetrable: createPenetrable(),
    esfera: createEsfera(),
    farewell: createFarewell(pluck),
  };
}
