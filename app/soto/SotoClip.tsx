"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS, CHAPTER_SECONDS, LINE_COUNT, TOTAL_SECONDS, drawOverlay, lineAt } from "./clipScenes";
import { useCanvasLoop, type Frame } from "./useCanvasLoop";

const BACKGROUND = "#f3f1ec";

type PlayerListener = {
  onChapter: (chapter: number) => void;
  onPlaying: (playing: boolean) => void;
  onProgress: (fraction: number) => void;
};

// Playback state lives outside React so the canvas loop can advance it every frame without re-rendering;
// React only hears about chapter changes and play/pause.
function createPlayer() {
  let time = 0;
  let playing = false;
  let dirty = true;
  let listener: PlayerListener | null = null;

  const setPlaying = (next: boolean) => {
    playing = next;
    dirty = true;
    listener?.onPlaying(next);
  };

  return {
    listen(next: PlayerListener | null) {
      listener = next;
      dirty = true;
    },
    play() {
      if (time >= TOTAL_SECONDS) time = 0;
      setPlaying(true);
    },
    pause() {
      setPlaying(false);
    },
    seek(chapter: number) {
      time = chapter * CHAPTER_SECONDS;
      dirty = true;
    },
    // Advances the clock and reports whether there is anything new to draw.
    advance(dt: number): boolean {
      if (playing) {
        time = Math.min(TOTAL_SECONDS, time + dt);
        if (time >= TOTAL_SECONDS) setPlaying(false);
        dirty = true;
      }
      const changed = dirty;
      dirty = false;
      return changed;
    },
    get time() {
      return time;
    },
    notify(chapter: number) {
      listener?.onChapter(chapter);
      listener?.onProgress(time / TOTAL_SECONDS);
    },
  };
}

type Player = ReturnType<typeof createPlayer>;

function createClipScene(player: Player) {
  return () => {
    let drawnSize = "";

    return ({ ctx, width, height, dpr, dt }: Frame) => {
      const size = `${width}x${height}x${dpr}`;
      const changed = player.advance(dt);
      if (!changed && size === drawnSize) return;
      drawnSize = size;

      const chapter = Math.min(CHAPTERS.length - 1, Math.floor(player.time / CHAPTER_SECONDS));
      const t = player.time - chapter * CHAPTER_SECONDS;
      player.notify(chapter);

      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, width, height);

      const lines = Array.from({ length: LINE_COUNT }, (_, i) => lineAt(chapter, i, t)).sort((a, b) => a.depth - b.depth);
      ctx.lineCap = "butt";
      for (const state of lines) {
        if (state.alpha < 0.01 || state.bottom - state.top < 0.001) continue;
        ctx.strokeStyle = `rgba(${state.color.map(Math.round).join(",")}, ${state.alpha})`;
        ctx.lineWidth = Math.max(1 / dpr, state.width * width);
        ctx.beginPath();
        ctx.moveTo(state.x * width, state.top * height);
        ctx.lineTo((state.x + state.lean) * width, state.bottom * height);
        ctx.stroke();
      }

      drawOverlay(ctx, chapter, t, width, height);
    };
  };
}

export function SotoClip() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const [player] = useState(createPlayer);
  const [createScene] = useState(() => createClipScene(player));
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  useCanvasLoop(canvasRef, createScene, { alwaysAnimate: true });

  useEffect(() => {
    player.listen({
      onChapter: setChapter,
      onPlaying: setPlaying,
      onProgress: (fraction) => {
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${fraction})`;
      },
    });
    return () => player.listen(null);
  }, [player]);

  const toggle = () => {
    setStarted(true);
    if (playing) player.pause();
    else player.play();
  };

  const jump = (index: number) => {
    setStarted(true);
    player.seek(index);
    player.play();
  };

  const current = CHAPTERS[chapter];

  return (
    <div className="soto-clip">
      <div className="soto-clip-screen">
        <div className="soto-clip-stage">
          <canvas ref={canvasRef} className="soto-canvas" aria-hidden="true" />
          {!started && (
            <button type="button" className="soto-clip-start" onClick={toggle}>
              <span className="soto-clip-start-title">A life in lines</span>
              <span className="soto-clip-start-meta">Play · 70 seconds</span>
            </button>
          )}
        </div>
        {started && (
          <div className="soto-clip-caption" aria-live="polite" key={chapter}>
            {current.year && <p className="soto-clip-year">{current.year}</p>}
            <p className="soto-clip-title">{current.title}</p>
            <p className="soto-clip-body">{current.body}</p>
          </div>
        )}
      </div>

      <div className="soto-clip-controls">
        <button type="button" className="soto-clip-toggle" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "Pause" : "Play"}
        </button>
        <div className="soto-clip-track">
          <div className="soto-clip-fill" ref={fillRef} />
          {CHAPTERS.map((item, index) => (
            <button
              key={`${item.title}-${index}`}
              type="button"
              className={`soto-clip-tick${index === chapter && started ? " is-current" : ""}`}
              style={{ left: `${(index / CHAPTERS.length) * 100}%` }}
              onClick={() => jump(index)}
              aria-label={`${item.year ? `${item.year}, ` : ""}${item.title}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
