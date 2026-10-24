import type { Player } from "../film/player";
import { readFonts } from "../film/shots";
import type { Frame } from "../useCanvasLoop";
import { INK, PAPER, clamp01, createGrain, drawGrain, drawMedia, grade, pictureRect, smooth, vignette, type Rect } from "./look";
import { BAR_SECONDS, CLIPS, PHOTOS, POSTER, SEGMENTS, segmentAt, type PhotoId, type Quote, type Segment } from "./timeline";

export type Library = {
  photo: (id: PhotoId) => HTMLImageElement | null;
  clip: (id: string) => HTMLVideoElement | null;
  load: () => void;
};

const usedPhotos = [...new Set([POSTER.photo, ...SEGMENTS.flatMap((segment) => ("photo" in segment ? [segment.photo] : []))])];
const usedClips = [...new Set(SEGMENTS.flatMap((segment) => (segment.kind === "clip" ? [segment.clip] : [])))];

// Media is fetched only when the film comes near the screen; until a file arrives its shot is just dark.
export function createLibrary(): Library {
  const images = new Map<PhotoId, HTMLImageElement>();
  const videos = new Map<string, HTMLVideoElement>();
  let started = false;
  return {
    photo(id) {
      const image = images.get(id);
      return image && image.complete && image.naturalWidth > 0 ? image : null;
    },
    clip(id) {
      const video = videos.get(id);
      return video && video.readyState >= 2 ? video : null;
    },
    load() {
      if (started) return;
      started = true;
      for (const id of usedPhotos) {
        const image = new Image();
        image.decoding = "async";
        image.onerror = () => console.error(`Soto film: could not load photo ${id}`);
        image.src = `/soto/film/${id}.jpg`;
        images.set(id, image);
      }
      for (const id of usedClips) {
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.onerror = () => console.error(`Soto film: could not load clip ${id}`);
        video.src = `/soto/film/clips/${id}.mp4`;
        videos.set(id, video);
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

// Small caps metadata, the way a poster or a festival laurel sets it: tiny, tracked, never competing with the picture.
const tinySize = (rect: Rect) => Math.max(11, Math.min(14, rect.width * 0.0115));

function setTiny(ctx: CanvasRenderingContext2D, family: string, size: number) {
  ctx.font = `500 ${size}px ${family}`;
  ctx.letterSpacing = "0.06em";
}

function drawLabel(ctx: CanvasRenderingContext2D, rect: Rect, family: string, work: string, place: string, note: string | undefined, lift: number) {
  const pad = Math.max(16, rect.width * 0.03);
  const size = tinySize(rect);
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 8;
  setTiny(ctx, family, size);
  const bottom = rect.y + rect.height - pad - lift;
  ctx.fillText(work.toUpperCase(), rect.x + pad, bottom - size * 1.5);
  ctx.globalAlpha *= 0.7;
  ctx.fillText(place.toUpperCase(), rect.x + pad, bottom);
  if (note) {
    ctx.textAlign = "right";
    ctx.fillText(note.toUpperCase(), rect.x + rect.width - pad, bottom);
  }
  ctx.restore();
}

// A title card: words alone on black, set big and tight, the attribution small underneath.
function drawCard(ctx: CanvasRenderingContext2D, rect: Rect, family: string, text: string, quote: Quote | null) {
  const size = Math.max(22, Math.min(52, rect.height * 0.075, rect.width * 0.06));
  const lineHeight = size * 1.12;
  const pad = Math.max(20, rect.width * 0.08);
  const maxWidth = Math.min(rect.width - pad * 2, size * 15);
  const tiny = tinySize(rect);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = PAPER;
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = size * 0.4;
  ctx.font = `400 ${size}px ${family}`;
  ctx.letterSpacing = "-0.025em";
  const lines = wrapWords(ctx, text.split(" "), maxWidth);
  const attributionGap = quote ? tiny * 3.4 : 0;
  const top = rect.y + (rect.height - lines.length * lineHeight - attributionGap) / 2 + size * 0.85;
  const centerX = rect.x + rect.width / 2;
  lines.forEach((line, index) => ctx.fillText(line.join(" "), centerX, top + index * lineHeight));
  if (quote) {
    setTiny(ctx, family, tiny);
    ctx.globalAlpha *= 0.6;
    const attribution = `Jesús Rafael Soto, ${quote.source}`.toUpperCase();
    const y = top + (lines.length - 1) * lineHeight + tiny * 3.4;
    // Narrow screens get the name and the source on separate lines rather than running off the edge.
    if (ctx.measureText(attribution).width <= rect.width - pad * 2) ctx.fillText(attribution, centerX, y);
    else {
      ctx.fillText("JESÚS RAFAEL SOTO", centerX, y);
      ctx.fillText(quote.source.toUpperCase(), centerX, y + tiny * 1.6);
    }
  }
  ctx.restore();
}

// The poster: one huge word sitting on the bottom edge of the frame, cropped by it, with tiny metadata in the corners.
function drawTitle(ctx: CanvasRenderingContext2D, rect: Rect, family: string) {
  const pad = Math.max(16, rect.width * 0.03);
  const tiny = tinySize(rect);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.fillStyle = PAPER;
  ctx.font = `500 100px ${family}`;
  ctx.letterSpacing = "-5.5px";
  const size = Math.min(rect.height * 0.92, (100 * rect.width * 0.96) / ctx.measureText("Soto").width);
  ctx.font = `500 ${size}px ${family}`;
  ctx.letterSpacing = `${-size * 0.055}px`;
  const baseline = rect.y + rect.height + size * 0.035;
  ctx.fillText("Soto", rect.x + rect.width * 0.015, baseline);

  setTiny(ctx, family, tiny);
  ctx.fillText("JESÚS RAFAEL", rect.x + pad, baseline - size * 0.76);
  // Sits below the player's sound and fullscreen buttons, which share the top edge once the film is running.
  const top = rect.y + Math.max(pad, 46) + tiny * 1.5;
  ctx.fillText("CIUDAD BOLÍVAR 1923 · PARIS 2005", rect.x + pad, top);
  ctx.restore();
}

type Thread = { x: number; phase: number; speed: number; tone: number };

// The interlude is only hanging threads on black, barely moving: a Penetrable seen from the front.
function createThreads() {
  const count = 70;
  const threads: Thread[] = Array.from({ length: count }, (_, index) => ({
    x: (index + 0.5 + Math.sin(index * 91.7) * 0.3) / count,
    phase: index * 1.7,
    speed: 0.25 + ((index * 37) % 10) / 40,
    tone: 0.12 + 0.25 * (((index * 53) % 17) / 17),
  }));
  return (ctx: CanvasRenderingContext2D, rect: Rect, time: number, local: number, pointerX: number | null) => {
    const reveal = smooth(local / 1.5);
    ctx.save();
    ctx.lineWidth = 1;
    for (const thread of threads) {
      const baseX = rect.x + thread.x * rect.width;
      // Threads near the hand lean aside, gently; the rest only breathe.
      const lean = pointerX === null ? 0 : Math.sign(baseX - pointerX || 1) * Math.max(0, 1 - Math.abs(baseX - pointerX) / 90) * 22;
      const sway = Math.sin(time * thread.speed + thread.phase) * 4;
      ctx.strokeStyle = `rgba(244, 241, 234, ${thread.tone * reveal})`;
      ctx.beginPath();
      ctx.moveTo(baseX, rect.y);
      ctx.quadraticCurveTo(baseX + (sway + lean) * 2, rect.y + rect.height * 0.6, baseX + sway, rect.y + rect.height);
      ctx.stroke();
    }
    ctx.restore();
  };
}

type CreditCard = { role: string; name: string; detail?: string; beats: number };

const photoAuthors = [...new Map(usedPhotos.map((id) => [PHOTOS[id].author, PHOTOS[id].license])).entries()];
const clipAuthors = [...new Map(usedClips.map((id) => [CLIPS[id].author, CLIPS[id].license])).entries()];

// End credits cut on the beat: the role holds while the names flip under it, every two beats for the
// photographers, so the attribution plays like the last bars of the track instead of a list.
const CREDIT_CARDS: CreditCard[] = [
  { role: "Words", name: "Jesús Rafael Soto", beats: 4 },
  ...photoAuthors.map(([name, license]) => ({ role: "Photographs", name, detail: `${license} · Wikimedia Commons`, beats: 2 })),
  ...clipAuthors.map(([name, license]) => ({ role: "Footage", name, detail: `${license} · YouTube`, beats: 4 })),
  { role: "Music and picture", name: "Made live in your browser", beats: 4 },
  { role: "A homage by", name: "Juan Figuera", beats: 16 },
];

function creditAt(beat: number): CreditCard {
  let start = 0;
  for (const card of CREDIT_CARDS) {
    if (beat < start + card.beats) return card;
    start += card.beats;
  }
  return CREDIT_CARDS[CREDIT_CARDS.length - 1];
}

function drawCredits(ctx: CanvasRenderingContext2D, rect: Rect, family: string, local: number) {
  const card = creditAt(local * 4);
  const pad = Math.max(20, rect.width * 0.06);
  const tiny = tinySize(rect);
  const maxWidth = rect.width - pad * 2;
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.font = `500 100px ${family}`;
  ctx.letterSpacing = "-4px";
  // Names fill the frame, shrinking only when a long one would run off the edge.
  const size = Math.min(rect.height * 0.2, (100 * maxWidth) / ctx.measureText(card.name).width);
  ctx.font = `500 ${size}px ${family}`;
  ctx.letterSpacing = `${-size * 0.04}px`;
  const baseline = rect.y + rect.height / 2 + size * 0.35;
  ctx.fillText(card.name, rect.x + pad, baseline);

  setTiny(ctx, family, tiny);
  ctx.fillText(card.role.toUpperCase(), rect.x + pad, baseline - size * 0.95);
  const sameRole = CREDIT_CARDS.filter((other) => other.role === card.role);
  if (sameRole.length > 1) {
    const position = sameRole.indexOf(card) + 1;
    ctx.textAlign = "right";
    ctx.fillText(`${position}/${sameRole.length}`, rect.x + rect.width - pad, baseline - size * 0.95);
    ctx.textAlign = "left";
  }
  if (card.detail) {
    ctx.globalAlpha *= 0.6;
    ctx.fillText(card.detail.toUpperCase(), rect.x + pad, baseline + tiny * 2.6);
  }
  ctx.restore();
}

type Shared = {
  ctx: CanvasRenderingContext2D;
  rect: Rect;
  family: string;
  library: Library;
  time: number;
  pointerX: number | null;
  reducedMotion: boolean;
  threads: ReturnType<typeof createThreads>;
  labelLift: number;
};

const STILL = { zoomFrom: 1, zoomTo: 1.04, fromX: 0.5, fromY: 0.5, toX: 0.5, toY: 0.5 };

function drawPicture(shared: Shared, source: { image: HTMLImageElement | null } | { video: HTMLVideoElement | null }, move: typeof STILL, progress: number, darken: number) {
  const { ctx, rect } = shared;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  if ("image" in source && source.image) drawMedia(ctx, source.image, source.image.naturalWidth, source.image.naturalHeight, rect, move, progress);
  if ("video" in source && source.video) drawMedia(ctx, source.video, source.video.videoWidth, source.video.videoHeight, rect, move, progress);
  grade(ctx, rect);
  if (darken > 0) {
    ctx.fillStyle = `rgba(6, 6, 5, ${darken})`;
    ctx.fillRect(rect.x - 2, rect.y - 2, rect.width + 4, rect.height + 4);
  }
  vignette(ctx, rect, 0.5);
  ctx.restore();
}

// A small archival print shown whole, framed by black, rather than blown up past its resolution.
function drawPortrait(ctx: CanvasRenderingContext2D, rect: Rect, image: HTMLImageElement, progress: number) {
  const scale = 1 + progress * 0.03;
  const height = Math.min(rect.height * 0.78, image.naturalHeight * 1.6) * scale;
  const width = (height * image.naturalWidth) / image.naturalHeight;
  const frame = { x: rect.x + (rect.width - width) / 2, y: rect.y + (rect.height - height) / 2, width, height };
  ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height);
  grade(ctx, frame);
}

function drawSegment(shared: Shared, segment: Segment, local: number) {
  const { ctx, rect, family, library, time, pointerX, reducedMotion, threads, labelLift } = shared;
  const length = segment.to - segment.from;
  const progress = reducedMotion ? 0.5 : local / length;

  if (segment.kind === "black") return;
  if (segment.kind === "card") {
    drawCard(ctx, rect, family, segment.text, segment.attribute ? segment.quote : null);
    return;
  }
  if (segment.kind === "lines") {
    threads(ctx, rect, time, local, pointerX);
    if (local >= 1) drawCard(ctx, rect, family, segment.quote.text, segment.quote);
    return;
  }
  if (segment.kind === "credits") {
    drawCredits(ctx, rect, family, local);
    return;
  }
  if (segment.kind === "portrait") {
    const image = library.photo(segment.photo);
    if (image) drawPortrait(ctx, rect, image, progress);
    const photo = PHOTOS[segment.photo];
    drawLabel(ctx, rect, family, photo.work, `${photo.place}, by ${photo.author}`, undefined, labelLift);
    return;
  }
  if (segment.kind === "clip") {
    drawPicture(shared, { video: library.clip(segment.clip) }, STILL, progress, 0);
    const clip = CLIPS[segment.clip];
    if (length >= 1.5) drawLabel(ctx, rect, family, clip.work, clip.place, segment.note, labelLift);
    return;
  }
  drawPicture(shared, { image: library.photo(segment.photo) }, segment.move, progress, 0);
  const photo = PHOTOS[segment.photo];
  // The fast cuts at the end of the build go by too quickly to read, so they carry no label.
  if (length >= 1.5) drawLabel(ctx, rect, family, photo.work, photo.place, segment.note, labelLift);
}

// Keeps each clip's playhead on the film's clock, nudging it only when it drifts so playback stays smooth.
function syncClips(library: Library, bar: number, playing: boolean) {
  for (const segment of SEGMENTS) {
    if (segment.kind !== "clip") continue;
    const video = library.clip(segment.clip);
    if (!video) continue;
    const active = bar >= segment.from && bar < segment.to;
    if (!active) {
      if (!video.paused) video.pause();
      continue;
    }
    const target = CLIPS[segment.clip].start + (bar - segment.from) * BAR_SECONDS;
    if (Math.abs(video.currentTime - target) > 0.3) video.currentTime = target;
    if (playing && video.paused) video.play().catch((error: unknown) => console.error("Soto film: clip would not play", error));
    if (!playing && !video.paused) video.pause();
  }
}

// Whether the player's controls are on screen. Read by the canvas loop every frame, so it lives outside React state.
export function createControlsFlag() {
  let showing = false;
  return {
    isShowing: () => showing,
    setShowing: (next: boolean) => {
      showing = next;
    },
  };
}

// How far the corner labels rise to clear the player's controls when they show, in CSS pixels.
const CONTROLS_CLEARANCE = 64;

export function createFilmScene(player: Player, library: Library, controlsShowing: () => boolean) {
  return () => {
    const grain = createGrain();
    const threads = createThreads();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let family: string | null = null;
    let lastSegment = -1;
    let labelLift = 0;

    return ({ ctx, width, height, dt, time, pointer }: Frame) => {
      // The display face is scoped to the film's section, so it is read off the canvas rather than the root.
      if (!family) {
        family = getComputedStyle(ctx.canvas).getPropertyValue("--font-tight").trim() || readFonts().sans;
        document.fonts.load(`500 40px ${family}`).catch((error: unknown) => console.error("Soto film: display font did not load", error));
      }
      player.advance(dt);
      // Eased rather than snapped, so the labels glide out of the controls' way instead of jumping.
      const liftTarget = controlsShowing() ? CONTROLS_CLEARANCE : 0;
      labelLift += (liftTarget - labelLift) * Math.min(1, dt * 10);
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, width, height);
      const rect = pictureRect(width, height);
      const idle = player.state === "idle";
      const bar = idle ? 0 : Math.min(SEGMENTS[SEGMENTS.length - 1].to - 0.001, player.time / BAR_SECONDS);
      const { segment, index } = segmentAt(bar);
      if (index !== lastSegment) {
        lastSegment = index;
        player.shotChanged(index);
      }
      syncClips(library, bar, player.state === "playing");

      const local = bar - segment.from;
      const length = segment.to - segment.from;
      // Every cut is hard. Only the cold open comes up out of black and the credits go back into it.
      const fadeIn = index === 0 ? smooth(local / 0.6) : 1;
      const fadeOut = index === SEGMENTS.length - 1 ? smooth((length - local) / 1) : 1;
      ctx.save();
      ctx.globalAlpha = idle ? 1 : clamp01(Math.min(fadeIn, fadeOut));
      const shared = { ctx, rect, family, library, time, pointerX: pointer.active && !reducedMotion ? pointer.x : null, reducedMotion, threads, labelLift };
      if (idle) {
        drawPicture(shared, { image: library.photo(POSTER.photo) }, POSTER.move, 0, 0.3);
        drawTitle(ctx, rect, family);
      } else drawSegment(shared, segment, local);
      ctx.restore();

      if (!reducedMotion) drawGrain(ctx, grain, width, height, 0.06, time);
    };
  };
}
