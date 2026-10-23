import { INK, PAPER, YELLOW, type Fonts } from "./shots";

const WORD_STAGGER = 0.22;
const WORD_REVEAL = 0.35;
const EXIT_BEATS = 0.45;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[][] {
  const lines: string[][] = [[]];
  for (const word of text.split(" ")) {
    const line = lines[lines.length - 1];
    const candidate = [...line, word].join(" ");
    if (line.length > 0 && ctx.measureText(candidate).width > maxWidth) lines.push([word]);
    else line.push(word);
  }
  return lines;
}

// Captions are drawn into the film, not laid over it, so they cut and land on the beat with the picture.
export function drawCaption(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fonts: Fonts,
  caption: { kicker: string; title: string },
  sinceBeats: number,
  untilEndBeats: number,
) {
  if (sinceBeats < 0) return;
  const exit = clamp01(untilEndBeats / EXIT_BEATS);
  if (exit <= 0) return;

  const unit = Math.min(width, height * 1.6);
  const titleSize = Math.max(18, Math.min(56, unit * 0.05));
  const kickerSize = Math.max(10, Math.min(13, titleSize * 0.34));
  const pad = Math.max(14, unit * 0.035);
  const blockPadX = titleSize * 0.28;
  const lineHeight = titleSize * 1.18;

  ctx.save();
  ctx.globalAlpha = exit;
  ctx.textBaseline = "middle";
  ctx.font = `400 ${titleSize}px ${fonts.sans}`;
  const lines = wrap(ctx, caption.title, Math.min(width - pad * 2 - blockPadX * 2, titleSize * 15));
  const titleTop = height - pad - lines.length * lineHeight;

  let wordIndex = 0;
  lines.forEach((words, lineIndex) => {
    const text = words.join(" ");
    const lineWidth = ctx.measureText(text).width + blockPadX * 2;
    const y = titleTop + lineIndex * lineHeight;
    const wipe = clamp01((sinceBeats - wordIndex * WORD_STAGGER) / WORD_REVEAL);
    ctx.fillStyle = INK;
    ctx.fillRect(pad, y, lineWidth * (1 - (1 - wipe) ** 3), lineHeight + 1);

    let x = pad + blockPadX;
    for (const word of words) {
      const reveal = clamp01((sinceBeats - wordIndex * WORD_STAGGER - 0.1) / WORD_REVEAL);
      ctx.globalAlpha = exit * reveal;
      ctx.fillStyle = PAPER;
      ctx.fillText(word, x, y + lineHeight / 2 + (1 - reveal) * titleSize * 0.35);
      x += ctx.measureText(`${word} `).width;
      wordIndex++;
    }
    ctx.globalAlpha = exit;
  });

  ctx.font = `400 ${kickerSize}px ${fonts.mono}`;
  ctx.letterSpacing = "0.18em";
  const kicker = caption.kicker.toUpperCase();
  const kickerWidth = ctx.measureText(kicker).width + kickerSize * 1.6;
  const kickerHeight = kickerSize * 2.2;
  const kickerReveal = clamp01(sinceBeats / WORD_REVEAL);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(pad, titleTop - kickerHeight, kickerWidth * kickerReveal, kickerHeight);
  ctx.globalAlpha = exit * kickerReveal;
  ctx.fillStyle = INK;
  ctx.fillText(kicker, pad + kickerSize * 0.8, titleTop - kickerHeight / 2 + 1);
  ctx.restore();
}
