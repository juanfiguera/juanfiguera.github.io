export const INK = "#0b0a09";
export const PAPER = "#f4f1ea";

export type Rect = { x: number; y: number; width: number; height: number };

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

// Wide screens get a 1.85 frame, the flat ratio most indie features shoot; tall phones keep the whole frame.
export function pictureRect(width: number, height: number): Rect {
  if (width / height < 1.3) return { x: 0, y: 0, width, height };
  const pictureHeight = Math.min(height, width / 1.85);
  return { x: 0, y: (height - pictureHeight) / 2, width, height: pictureHeight };
}

export type Move = { zoomFrom: number; zoomTo: number; fromX: number; fromY: number; toX: number; toY: number };

// Cover-fits a photo or video frame, then drifts at a constant speed: an even, slow camera, never easing in and out.
export function drawMedia(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  rect: Rect,
  move: Move,
  progress: number,
) {
  if (sourceWidth <= 0 || sourceHeight <= 0) return;
  const t = clamp01(progress);
  // The browser's default smoothing is the cheap one; scaled-up video frames look blocky without this.
  ctx.imageSmoothingQuality = "high";
  const zoom = lerp(move.zoomFrom, move.zoomTo, t);
  const cover = Math.max(rect.width / sourceWidth, rect.height / sourceHeight) * zoom;
  const drawWidth = sourceWidth * cover;
  const drawHeight = sourceHeight * cover;
  const x = rect.x + rect.width / 2 - drawWidth * lerp(move.fromX, move.toX, t);
  const y = rect.y + rect.height / 2 - drawHeight * lerp(move.fromY, move.toY, t);
  ctx.drawImage(
    source,
    Math.min(rect.x, Math.max(rect.x + rect.width - drawWidth, x)),
    Math.min(rect.y, Math.max(rect.y + rect.height - drawHeight, y)),
    drawWidth,
    drawHeight,
  );
}

// Pulls the photos toward one 35mm palette (soft blacks, warm mids, a little green in the shadows)
// so a handful of photographers read as one film.
export function grade(ctx: CanvasRenderingContext2D, rect: Rect) {
  ctx.save();
  ctx.globalCompositeOperation = "saturation";
  ctx.fillStyle = "rgba(128, 128, 128, 0.12)";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = "rgba(255, 196, 140, 0.35)";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(14, 22, 18, 0.32)";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

export function createGrain(): HTMLCanvasElement {
  const size = 192;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Soto film: no 2D context for grain");
  const pixels = context.createImageData(size, size);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const value = Math.random() * 255;
    pixels.data[i] = value;
    pixels.data[i + 1] = value;
    pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

const GRAIN_FPS = 12;

export function drawGrain(ctx: CanvasRenderingContext2D, grain: HTMLCanvasElement, width: number, height: number, amount: number, time: number) {
  const pattern = ctx.createPattern(grain, "repeat");
  if (!pattern) return;
  // Grain moves at a film-like 12 frames a second; re-rolling it every display frame reads as flicker.
  const frame = Math.floor(time * GRAIN_FPS);
  pattern.setTransform(new DOMMatrix().translate((frame * 73) % 192, (frame * 131) % 192));
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = amount;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function vignette(ctx: CanvasRenderingContext2D, rect: Rect, strength: number) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const gradient = ctx.createRadialGradient(centerX, centerY, Math.min(rect.width, rect.height) * 0.35, centerX, centerY, Math.hypot(rect.width, rect.height) * 0.6);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}
