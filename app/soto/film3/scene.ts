import type { Player } from "../film/player";
import { readFonts, type Fonts } from "../film/shots";
import type { Frame } from "../useCanvasLoop";
import {
  BONE,
  GOLD,
  INK,
  clamp01,
  createGrain,
  drawGrain,
  drawPhoto,
  grade,
  pictureRect,
  slats,
  smooth,
  stripeClip,
  vignette,
  type Rect,
} from "./look";
import { BAR_SECONDS, BPM, PHOTOS, SEGMENTS, segmentAt, type PhotoId, type Quote, type Segment } from "./timeline";

const BEAT_SECONDS = 60 / BPM;
const TRANSITION_BARS = 0.75;
const SLAT_SPACING = 7;

export type Library = {
  get: (id: PhotoId) => HTMLImageElement | null;
  load: () => void;
};

// Photos are fetched only when the film comes near the screen; until one arrives its shot is just dark.
export function createLibrary(): Library {
  const images = new Map<PhotoId, HTMLImageElement>();
  let started = false;
  return {
    get(id) {
      const image = images.get(id);
      return image && image.complete && image.naturalWidth > 0 ? image : null;
    },
    load() {
      if (started) return;
      started = true;
      for (const id of Object.keys(PHOTOS) as PhotoId[]) {
        const image = new Image();
        image.decoding = "async";
        image.onerror = () => console.error(`Soto film: could not load photo ${id}`);
        image.src = `/soto/film/${id}.jpg`;
        images.set(id, image);
      }
    },
  };
}

function wrapWords(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number): string[][] {
  const lines: string[][] = [[]];
  for (const word of words) {
    const line = lines[lines.length - 1];
    if (line.length > 0 && ctx.measureText([...line, word].join(" ")).width > maxWidth) lines.push([word]);
    else line.push(word);
  }
  return lines;
}

function drawQuote(ctx: CanvasRenderingContext2D, rect: Rect, fonts: Fonts, quote: Quote, sinceBars: number, untilEndBars: number, centered: boolean) {
  const exit = clamp01(untilEndBars / 0.4);
  if (sinceBars < 0 || exit <= 0) return;
  const size = Math.max(19, Math.min(60, rect.height * 0.085, rect.width * 0.068));
  const lineHeight = size * 1.16;
  const pad = Math.max(18, rect.width * 0.07);
  const maxWidth = Math.min(rect.width - pad * 2, size * 17);
  const words = quote.text.split(" ");
  // Every quote finishes arriving within about a bar and a half, however long it is.
  const stagger = Math.min(0.11, 1.3 / words.length);

  ctx.save();
  ctx.font = `300 ${size}px ${fonts.sans}`;
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = size * 0.4;
  const lines = wrapWords(ctx, words, maxWidth);
  const blockHeight = lines.length * lineHeight + size * 1.4;
  const top = rect.y + (rect.height - blockHeight) / 2 + size;
  let wordIndex = 0;
  lines.forEach((line, lineIndex) => {
    const lineWidth = ctx.measureText(line.join(" ")).width;
    let x = centered ? rect.x + (rect.width - lineWidth) / 2 : rect.x + pad;
    const y = top + lineIndex * lineHeight;
    for (const word of line) {
      const reveal = smooth((sinceBars - 0.15 - wordIndex * stagger) / 0.35);
      ctx.globalAlpha = exit * reveal;
      ctx.fillStyle = BONE;
      ctx.fillText(word, x, y + (1 - reveal) * size * 0.25);
      x += ctx.measureText(`${word} `).width;
      wordIndex++;
    }
  });

  const attributionSize = Math.max(10, Math.min(13, size * 0.27));
  ctx.font = `400 ${attributionSize}px ${fonts.mono}`;
  ctx.letterSpacing = "0.2em";
  const oneLine = `JESÚS RAFAEL SOTO  ·  ${quote.source.toUpperCase()}`;
  // Narrow screens get the name and the source on separate lines rather than running off the edge.
  const attribution = ctx.measureText(oneLine).width <= rect.width - pad * 2 ? [oneLine] : ["JESÚS RAFAEL SOTO", quote.source.toUpperCase()];
  ctx.globalAlpha = exit * smooth((sinceBars - 0.15 - wordIndex * stagger) / 0.4);
  ctx.fillStyle = GOLD;
  attribution.forEach((text, lineIndex) => {
    const textWidth = ctx.measureText(text).width;
    const x = centered ? rect.x + (rect.width - textWidth) / 2 : rect.x + pad;
    ctx.fillText(text, x, top + lines.length * lineHeight + size * 0.2 + lineIndex * attributionSize * 1.8);
  });
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, rect: Rect, fonts: Fonts, lines: { text: string; mono: boolean }[], sinceBars: number, untilEndBars: number) {
  const alpha = smooth((sinceBars - 0.25) / 0.4) * clamp01(untilEndBars / 0.35);
  if (alpha <= 0) return;
  const pad = Math.max(14, rect.width * 0.03);
  const size = Math.max(10, Math.min(13, rect.width * 0.011));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textBaseline = "alphabetic";
  let y = rect.y + rect.height - pad;
  for (const line of [...lines].reverse()) {
    ctx.font = line.mono ? `400 ${size}px ${fonts.mono}` : `300 ${size * 1.9}px ${fonts.sans}`;
    ctx.letterSpacing = line.mono ? "0.18em" : "0px";
    ctx.fillStyle = line.mono ? GOLD : BONE;
    ctx.fillText(line.mono ? line.text.toUpperCase() : line.text, rect.x + pad, y);
    y -= line.mono ? size * 2 : size * 2.6;
  }
  ctx.restore();
}

function drawTitle(ctx: CanvasRenderingContext2D, rect: Rect, fonts: Fonts, local: number, length: number) {
  const alpha = smooth((local - 0.6) / 0.8) * clamp01((length - local) / 0.6);
  if (alpha <= 0) return;
  const size = Math.max(26, Math.min(84, rect.height * 0.13, rect.width * 0.085));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  ctx.font = `400 ${Math.max(10, size * 0.16)}px ${fonts.mono}`;
  ctx.letterSpacing = "0.42em";
  ctx.fillStyle = GOLD;
  ctx.fillText("JESÚS RAFAEL SOTO", centerX, centerY - size * 0.85);
  ctx.font = `300 ${size}px ${fonts.sans}`;
  ctx.letterSpacing = "-0.02em";
  ctx.fillStyle = BONE;
  ctx.fillText("Inside the vibration", centerX, centerY);
  ctx.font = `400 ${Math.max(9, size * 0.14)}px ${fonts.mono}`;
  ctx.letterSpacing = "0.3em";
  ctx.globalAlpha = alpha * 0.75;
  ctx.fillText("CIUDAD BOLÍVAR 1923  ·  PARIS 2005", centerX, centerY + size * 0.85);
  ctx.restore();
}

// The interlude has no photo at all: two sets of gold rings drifting through each other.
function drawLines(ctx: CanvasRenderingContext2D, rect: Rect, time: number, local: number, centerX: number, centerY: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  const reveal = smooth(local / 1.2);
  const reach = Math.hypot(rect.width, rect.height);
  ctx.strokeStyle = `rgba(227, 178, 60, ${0.55 * reveal})`;
  ctx.lineWidth = 1.6;
  const rings = (x: number, y: number, spacing: number) => {
    ctx.beginPath();
    for (let radius = spacing; radius < reach; radius += spacing) {
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.stroke();
  };
  rings(rect.x + rect.width / 2, rect.y + rect.height / 2, 9);
  rings(centerX, centerY, 9 + Math.sin(time * 0.3) * 0.4);
  ctx.restore();
}

type CreditLine = { text: string; mono?: boolean; gap?: boolean };

const CREDITS: CreditLine[] = [
  { text: "Jesús Rafael Soto", gap: true },
  { text: "Ciudad Bolívar 1923 · Paris 2005", mono: true, gap: true },
  { text: "Words", mono: true },
  { text: "Jesús Rafael Soto, from El Nacional (1966), Le Nouvel Adam (1968),", },
  { text: "Journal de Genève (1970), and Conversaciones con Jesús Soto", gap: true },
  { text: "Photographs, via Wikimedia Commons", mono: true },
  ...[...new Set(SEGMENTS.flatMap((segment) => ("photo" in segment ? [segment.photo] : [])))].map((id) => ({
    text: `${PHOTOS[id].work}: ${PHOTOS[id].author}, ${PHOTOS[id].license}`,
  })),
  { text: "", gap: true },
  { text: "A homage by Juan Figuera", mono: true },
];

function drawCredits(ctx: CanvasRenderingContext2D, rect: Rect, fonts: Fonts, local: number, length: number) {
  const size = Math.max(11, Math.min(16, rect.height * 0.034));
  const lineHeight = size * 1.6;
  const totalHeight = CREDITS.reduce((sum, line) => sum + lineHeight + (line.gap ? lineHeight * 0.8 : 0), 0);
  // Rolls from below the frame until the last line rests at the center, then holds.
  const travel = smooth(local / (length * 0.85));
  let y = rect.y + rect.height + size - travel * (totalHeight + rect.height * 0.5);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.textAlign = "center";
  ctx.globalAlpha = clamp01((length - local) / 0.5);
  for (const line of CREDITS) {
    ctx.font = line.mono ? `400 ${size * 0.8}px ${fonts.mono}` : `300 ${size}px ${fonts.sans}`;
    ctx.letterSpacing = line.mono ? "0.2em" : "0px";
    ctx.fillStyle = line.mono ? GOLD : BONE;
    ctx.fillText(line.mono ? line.text.toUpperCase() : line.text, rect.x + rect.width / 2, y);
    y += lineHeight + (line.gap ? lineHeight * 0.8 : 0);
  }
  ctx.restore();
}

const photoOf = (segment: Segment | undefined) => (segment && "photo" in segment ? segment : null);

export function createFilmScene(player: Player, library: Library) {
  return () => {
    const type = readFonts();
    const grain = createGrain();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastSegment = -1;
    let ringX = 0;
    let ringY = 0;

    return ({ ctx, width, height, dt, time, pointer }: Frame) => {
      player.advance(dt);
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, width, height);
      const rect = pictureRect(width, height);

      const idle = player.state === "idle";
      // Before play, hold on the opening photo with the slats half open: a poster for the film.
      const bar = idle ? 2.2 : Math.min(SEGMENTS[SEGMENTS.length - 1].to - 0.001, player.time / BAR_SECONDS);
      const { segment, index } = segmentAt(bar);
      if (index !== lastSegment) {
        lastSegment = index;
        player.shotChanged(index);
      }
      const local = bar - segment.from;
      const length = segment.to - segment.from;
      const beat = player.time / BEAT_SECONDS;
      const softPulse = Math.exp(-(beat - Math.floor(beat)) * 3);
      const parallax = pointer.active && !reducedMotion ? (pointer.x - width / 2) * 0.06 : 0;

      const targetX = pointer.active ? pointer.x : rect.x + rect.width / 2 + Math.cos(time * 0.4) * rect.width * 0.18;
      const targetY = pointer.active ? pointer.y : rect.y + rect.height / 2 + Math.sin(time * 0.5) * rect.height * 0.2;
      const ease = Math.min(1, dt * 3);
      ringX += (targetX - ringX) * ease;
      ringY += (targetY - ringY) * ease;

      const current = photoOf(segment);
      if (current) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip();
        const previous = photoOf(SEGMENTS[index - 1]);
        const transition = local / TRANSITION_BARS;
        const previousImage = previous ? library.get(previous.photo) : null;
        if (transition < 1 && previous && previousImage) {
          drawPhoto(ctx, previousImage, rect, previous.move, 1);
          ctx.save();
          stripeClip(ctx, rect, SLAT_SPACING * 3, transition);
        }
        const image = library.get(current.photo);
        if (image) drawPhoto(ctx, image, rect, current.move, reducedMotion ? 0.5 : local / length);
        if (transition < 1 && previous && previousImage) ctx.restore();
        grade(ctx, rect);

        const quoted = "quote" in current && current.quote;
        // Shots carrying a quote close their slats and dim, so the words sit on a calmer picture.
        const quoteWeight = quoted ? smooth(local / 0.8) * clamp01((length - local) / 0.5) : 0;
        if (current.kind === "title") {
          const open = idle ? 0.45 : smooth(local / 2.6);
          slats(ctx, rect, SLAT_SPACING, SLAT_SPACING * (1 - open) + 1, parallax, 1);
          ctx.fillStyle = `rgba(11, 10, 9, ${0.45 * (1 - open * 0.4)})`;
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        } else {
          ctx.fillStyle = `rgba(11, 10, 9, ${0.42 * quoteWeight})`;
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
          slats(ctx, rect, SLAT_SPACING, 1 + softPulse * 0.6 + quoteWeight * 2, parallax + time * 3, 0.35 + quoteWeight * 0.4);
        }
        vignette(ctx, rect, 0.5);
        ctx.restore();

        if (current.kind === "title") drawTitle(ctx, rect, type, idle ? 2 : local, length);
        else if (quoted) drawQuote(ctx, rect, type, quoted, local - 0.5, length - local, false);
        else {
          const photo = PHOTOS[current.photo];
          const lines = [{ text: photo.work, mono: false }, { text: photo.place, mono: true }];
          if (current.note) lines.unshift({ text: current.note, mono: true });
          drawLabel(ctx, rect, type, lines, local, length - local);
        }
      } else if (segment.kind === "lines") {
        drawLines(ctx, rect, time, local, ringX, ringY);
        drawQuote(ctx, rect, type, segment.quote, local - 1, length - local, true);
      } else {
        drawCredits(ctx, rect, type, local, length);
      }

      if (!reducedMotion) drawGrain(ctx, grain, width, height, 0.09);
    };
  };
}
