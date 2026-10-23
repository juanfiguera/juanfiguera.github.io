export const INK = "#0b0a09";
export const BONE = "#ece6da";
export const GOLD = "#e3b23c";

export type Rect = { x: number; y: number; width: number; height: number };

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

// Wide screens get cinema scope bars; tall phones keep the whole frame, where bars would leave a sliver.
export function pictureRect(width: number, height: number): Rect {
  if (width / height < 1.3) return { x: 0, y: 0, width, height };
  const pictureHeight = Math.min(height, width / 2.39);
  return { x: 0, y: (height - pictureHeight) / 2, width, height: pictureHeight };
}

export type Move = { zoomFrom: number; zoomTo: number; fromX: number; fromY: number; toX: number; toY: number };

// Cover-fits the photo, then drifts and pushes in: the slow camera of every gallery documentary.
export function drawPhoto(ctx: CanvasRenderingContext2D, image: HTMLImageElement, rect: Rect, move: Move, progress: number) {
  const t = smooth(progress);
  const zoom = lerp(move.zoomFrom, move.zoomTo, t);
  const cover = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight) * zoom;
  const drawWidth = image.naturalWidth * cover;
  const drawHeight = image.naturalHeight * cover;
  const focusX = lerp(move.fromX, move.toX, t);
  const focusY = lerp(move.fromY, move.toY, t);
  const x = rect.x + rect.width / 2 - drawWidth * focusX;
  const y = rect.y + rect.height / 2 - drawHeight * focusY;
  ctx.drawImage(
    image,
    Math.min(rect.x, Math.max(rect.x + rect.width - drawWidth, x)),
    Math.min(rect.y, Math.max(rect.y + rect.height - drawHeight, y)),
    drawWidth,
    drawHeight,
  );
}

// Pulls the photos toward one palette (lifted blacks, warm paper highlights) so a dozen photographers read as one film.
export function grade(ctx: CanvasRenderingContext2D, rect: Rect, warmth = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "saturation";
  ctx.fillStyle = "rgba(128, 128, 128, 0.22)";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(240, 222, 188, ${0.3 * warmth})`;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(26, 20, 16, 0.4)";
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

// Fine vertical slats in front of the photo, like seeing it through a Penetrable or a Vibration.
export function slats(ctx: CanvasRenderingContext2D, rect: Rect, spacing: number, thickness: number, offset: number, alpha: number) {
  if (thickness <= 0.05 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  const start = rect.x - spacing + (((offset % spacing) + spacing) % spacing);
  for (let x = start; x < rect.x + rect.width; x += spacing) ctx.fillRect(x, rect.y, thickness, rect.height);
  ctx.restore();
}

const hash = (index: number) => {
  const value = Math.sin(index * 127.1) * 43758.5453;
  return value - Math.floor(value);
};

// Cuts between two pictures stripe by stripe, alternating ones first: for a moment both images vibrate together.
export function stripeClip(ctx: CanvasRenderingContext2D, rect: Rect, spacing: number, progress: number) {
  ctx.beginPath();
  const count = Math.ceil(rect.width / spacing);
  for (let index = 0; index < count; index++) {
    const threshold = (index % 2 === 0 ? 0 : 0.45) + hash(index) * 0.5;
    const opened = clamp01((progress * 1.6 - threshold) / 0.15);
    if (opened <= 0) continue;
    ctx.rect(rect.x + index * spacing, rect.y, spacing * opened + 0.5, rect.height);
  }
  ctx.clip();
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

export function drawGrain(ctx: CanvasRenderingContext2D, grain: HTMLCanvasElement, width: number, height: number, amount: number) {
  const pattern = ctx.createPattern(grain, "repeat");
  if (!pattern) return;
  // A new random offset every frame is what makes grain read as film rather than a dirty screen.
  pattern.setTransform(new DOMMatrix().translate(Math.random() * 192, Math.random() * 192));
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
