// "A life in lines": every chapter is drawn by the same set of lines, which flow from one shape into the next.
// Layouts are pure functions of (line index, seconds into the chapter), so seeking anywhere is free.

export const CHAPTER_SECONDS = 7;
export const LINE_COUNT = 150;
const MORPH_SECONDS = 1.6;
const STAGGER_SECONDS = 0.6;

export type Chapter = { year: string; title: string; body: string };

export const CHAPTERS: Chapter[] = [
  {
    year: "1923",
    title: "Ciudad Bolívar",
    body: "Jesús Rafael Soto is born on the banks of the Orinoco, in southern Venezuela.",
  },
  {
    year: "Age 16",
    title: "Cinema posters",
    body: "He paints posters for the town's movie theaters to help support his family.",
  },
  {
    year: "1942",
    title: "Caracas",
    body: "A scholarship takes him to art school in Caracas. Afterwards he teaches in Maracaibo.",
  },
  {
    year: "1950",
    title: "Paris",
    body: "He moves to Paris, where he will live for the rest of his life.",
  },
  {
    year: "1955",
    title: "Le Mouvement",
    body: "At Galerie Denise René, beside Duchamp and Vasarely, his spirals move without a motor. You are the motor.",
  },
  {
    year: "",
    title: "Vibrations",
    body: "Fine lines behind, objects in front. Where they meet, solid things start to dissolve.",
  },
  {
    year: "",
    title: "Penetrables",
    body: "The work opens up to let people in. You don't look at it. You walk through it.",
  },
  {
    year: "1973",
    title: "Back home",
    body: "His museum opens in Ciudad Bolívar: five buildings by Carlos Raúl Villanueva.",
  },
  {
    year: "",
    title: "Esfera Caracas",
    body: "About 1,800 orange aluminum rods along a Caracas highway, shimmering with the light and the wind.",
  },
  {
    year: "2005",
    title: "Paris",
    body: "Soto dies in Paris. The work keeps moving, as long as someone moves around it.",
  },
];

export const TOTAL_SECONDS = CHAPTERS.length * CHAPTER_SECONDS;

type Color = [number, number, number];

// Positions are fractions of the stage: x, lean and width of its width, top and bottom of its height.
export type LineState = {
  x: number;
  top: number;
  bottom: number;
  lean: number;
  width: number;
  alpha: number;
  color: Color;
  depth: number;
};

const INK: Color = [20, 18, 15];
const RIVER: Color = [72, 118, 132];
const RED: Color = [184, 40, 29];
const YELLOW: Color = [239, 181, 0];
const BLUE: Color = [30, 63, 143];
const STONE: Color = [178, 170, 152];
const ORANGE_NEAR: Color = [214, 86, 34];
const ORANGE_FAR: Color = [130, 48, 24];

function random(i: number, salt = 0): number {
  const value = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function line(partial: Partial<LineState> & Pick<LineState, "x" | "top" | "bottom">): LineState {
  return { lean: 0, width: 0.0026, alpha: 1, color: INK, depth: 0, ...partial };
}

// Lattice points for the Esfera, one per line; extra lines stay hidden in the middle.
const SPHERE_GRID = 7;
const SPHERE_POINTS: { x: number; z: number; half: number }[] = [];
for (let gx = -SPHERE_GRID; gx <= SPHERE_GRID; gx++) {
  for (let gz = -SPHERE_GRID; gz <= SPHERE_GRID; gz++) {
    const x = gx / SPHERE_GRID;
    const z = gz / SPHERE_GRID;
    if (x * x + z * z < 1) SPHERE_POINTS.push({ x, z, half: Math.sqrt(1 - x * x - z * z) });
  }
}

const MUSEUM_BLOCKS = [
  { from: 0.1, to: 0.24, top: 0.38 },
  { from: 0.27, to: 0.4, top: 0.3 },
  { from: 0.43, to: 0.6, top: 0.42 },
  { from: 0.63, to: 0.75, top: 0.33 },
  { from: 0.78, to: 0.9, top: 0.39 },
];

const LAYOUTS: ((i: number, t: number) => LineState)[] = [
  // The Orinoco: short strokes rippling along a river.
  (i, t) => {
    const x = 0.04 + (i / (LINE_COUNT - 1)) * 0.92;
    const center = 0.66 + 0.025 * Math.sin(x * 11 + t * 0.9);
    const half = 0.012 + 0.012 * (0.5 + 0.5 * Math.sin(x * 37 + t * 1.6 + random(i) * 3));
    return line({ x, top: center - half, bottom: center + half, color: RIVER, width: 0.003 });
  },
  // A cinema poster: a tall frame filled with bands of color.
  (i) => {
    const u = i / (LINE_COUNT - 1);
    const x = 0.5 + u * 0.24;
    const band = Math.min(5, Math.floor(u * 6));
    const color = [RED, YELLOW, RED, INK, YELLOW, RED][band];
    const title = band === 3 ? 0.06 : 0;
    return line({ x, top: 0.1 + title, bottom: 0.72 - (band === 5 ? 0.16 : 0), color, width: 0.0034 });
  },
  // Art school: a disciplined grid stepping in fives.
  (i) => {
    const u = i / (LINE_COUNT - 1);
    const step = (i % 5) / 5;
    return line({ x: 0.2 + u * 0.6, top: 0.28 + step * 0.12, bottom: 0.72 - step * 0.06 });
  },
  // Paris: the whole group crosses the stage.
  (i, t) => {
    const progress = Math.min(1, t / (CHAPTER_SECONDS - 1));
    const eased = progress * progress * (3 - 2 * progress);
    const center = 0.18 + eased * 0.64;
    const offset = (i / (LINE_COUNT - 1) - 0.5) * 0.26;
    return line({ x: center + offset, top: 0.14 + random(i) * 0.08, bottom: 0.62 - random(i, 1) * 0.08, width: 0.0014, alpha: 0.85 });
  },
  // Le Mouvement: lines fold away to make room for the spiral overlay.
  (i) => line({ x: 0.5 + (i / (LINE_COUNT - 1) - 0.5) * 0.02, top: 0.5, bottom: 0.5, alpha: 0 }),
  // Vibrations: fine full-height stripes for the floating square to vibrate against.
  (i) => line({ x: i / (LINE_COUNT - 1), top: 0, bottom: 1, width: 0.0022 }),
  // Penetrables: yellow threads parting around an unseen visitor.
  (i, t) => {
    const x = 0.02 + (i / (LINE_COUNT - 1)) * 0.96;
    const visitor = 0.08 + (t / CHAPTER_SECONDS) * 0.84;
    const gap = x - visitor;
    const push = Math.sign(gap || 1) * Math.max(0, 0.07 - Math.abs(gap)) * 0.9;
    return line({ x, top: 0, bottom: 1, lean: push, color: YELLOW, width: 0.0024 });
  },
  // The museum: five low buildings.
  (i) => {
    const u = i / (LINE_COUNT - 1);
    const block = MUSEUM_BLOCKS[Math.min(MUSEUM_BLOCKS.length - 1, Math.floor(u * MUSEUM_BLOCKS.length))];
    const within = (u * MUSEUM_BLOCKS.length) % 1;
    return line({ x: block.from + within * (block.to - block.from), top: block.top, bottom: 0.58, color: STONE, width: 0.0032 });
  },
  // Esfera Caracas: rods of a slowly turning sphere.
  (i, t) => {
    const point = SPHERE_POINTS[i];
    if (!point) return line({ x: 0.5, top: 0.5, bottom: 0.5, alpha: 0 });
    const angle = 0.4 + t * 0.12;
    const depth = -point.x * Math.sin(angle) + point.z * Math.cos(angle);
    const screen = point.x * Math.cos(angle) + point.z * Math.sin(angle);
    const near = (depth + 1) / 2;
    const scale = 3.2 / (3.2 - depth);
    const color = ORANGE_FAR.map((value, c) => value + (ORANGE_NEAR[c] - value) * near) as Color;
    return line({
      x: 0.6 + screen * 0.17 * scale,
      top: 0.42 - point.half * 0.3 * scale,
      bottom: 0.42 + point.half * 0.3 * scale,
      color,
      width: 0.0018,
      depth,
    });
  },
  // 2005: everything hangs straight and still, then fades from the edges inward.
  (i, t) => {
    const u = i / (LINE_COUNT - 1);
    const fromCenter = Math.abs(u - 0.5) * 2;
    const fade = Math.min(1, Math.max(0, (t - 2.5 - (1 - fromCenter) * 3) / 1.2));
    return line({ x: 0.4 + u * 0.4, top: 0.16, bottom: 0.56, width: 0.0018, alpha: 1 - fade * (fromCenter > 0.02 ? 1 : 0.4) });
  },
];

function mix(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

function ease(k: number): number {
  return k * k * (3 - 2 * k);
}

// Each line morphs from where it ended in the previous chapter, a little out of step with its neighbors.
export function lineAt(chapter: number, i: number, t: number): LineState {
  const target = LAYOUTS[chapter](i, t);
  if (chapter === 0) return target;
  const delay = random(i, 7) * STAGGER_SECONDS;
  const k = ease(Math.min(1, Math.max(0, (t - delay) / MORPH_SECONDS)));
  if (k >= 1) return target;
  const from = LAYOUTS[chapter - 1](i, CHAPTER_SECONDS);
  return {
    x: mix(from.x, target.x, k),
    top: mix(from.top, target.top, k),
    bottom: mix(from.bottom, target.bottom, k),
    lean: mix(from.lean, target.lean, k),
    width: mix(from.width, target.width, k),
    alpha: mix(from.alpha, target.alpha, k),
    color: from.color.map((value, c) => mix(value, target.color[c], k)) as Color,
    depth: mix(from.depth, target.depth, k),
  };
}

// Fades an overlay in after the lines have cleared and out before the next chapter's morph begins.
function overlayAlpha(t: number): number {
  return Math.min(1, Math.max(0, (t - 0.8) / 0.8)) * Math.min(1, Math.max(0, (CHAPTER_SECONDS - t) / 0.7));
}

function spiral(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, pitch: number, twist: number) {
  const turns = radius / pitch;
  const steps = Math.ceil(turns * 120);
  ctx.beginPath();
  for (let s = 0; s <= steps; s++) {
    const theta = (s / steps) * turns * Math.PI * 2;
    const r = (theta / (Math.PI * 2)) * pitch;
    const x = cx + Math.cos(theta + twist) * r;
    const y = cy + Math.sin(theta + twist) * r;
    if (s === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// Works whose shape the lines alone can't carry: the 1955 spiral and the Vibration's floating square.
export function drawOverlay(ctx: CanvasRenderingContext2D, chapter: number, t: number, width: number, height: number) {
  const title = CHAPTERS[chapter].title;
  const alpha = overlayAlpha(t);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  if (title === "Le Mouvement") {
    const radius = height * 0.3;
    const cx = width / 2;
    const cy = height * 0.44;
    const pitch = Math.max(5, height / 75);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#14120f";
    ctx.lineWidth = pitch * 0.5;
    spiral(ctx, cx, cy, radius, pitch, 0);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = pitch * 0.42;
    spiral(ctx, cx + Math.cos(t * 0.9) * pitch * 1.6, cy + Math.sin(t * 0.9) * pitch * 1.6, radius, pitch, Math.PI);
  }

  if (title === "Vibrations") {
    const side = height * 0.42;
    const period = width / (LINE_COUNT - 1);
    ctx.translate(width * 0.36, height * 0.44);
    ctx.rotate((4 * Math.sin(t * 0.7) * Math.PI) / 180);
    ctx.beginPath();
    ctx.rect(-side / 2, -side / 2, side, side);
    ctx.clip();
    ctx.fillStyle = "#14120f";
    for (let x = -side; x < side; x += period) ctx.fillRect(x, -side, width * 0.0022, side * 2);
  }

  ctx.restore();

  if (title === "Vibrations") {
    ctx.save();
    ctx.globalAlpha = alpha;
    const size = height * 0.12;
    ctx.translate(width * 0.7, height * 0.62);
    ctx.rotate(0.1 * Math.sin(t * 0.8));
    ctx.fillStyle = `rgb(${RED.join(",")})`;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.translate(width * 0.12, -height * 0.24);
    ctx.fillStyle = `rgb(${BLUE.join(",")})`;
    ctx.fillRect(-size / 3, -size / 3, (size * 2) / 3, (size * 2) / 3);
    ctx.restore();
  }
}
