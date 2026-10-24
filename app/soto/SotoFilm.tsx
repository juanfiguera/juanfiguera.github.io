"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { drawCaption } from "./film/captions";
import { createPlayer, type Player, type PlayerState } from "./film/player";
import { FILM_ARRANGEMENT, createScore, type Score } from "./film/score";
import {
  INK,
  PAPER,
  brushStrings,
  createShots,
  drawStrings,
  noteFor,
  readFonts,
  vignette,
  type FilmPointer,
  type Pluck,
  type VibratingString,
} from "./film/shots";
import { BEAT_SECONDS, SHOTS, TOTAL_BEATS, TOTAL_SECONDS, shotAt } from "./film/timeline";
import { useCanvasLoop, type Frame } from "./useCanvasLoop";

// Drops land on these beats; a single soft flash marks each one.
const DROPS = [32, 64];

function createOutro(pluck: Pluck) {
  let strings: VibratingString[] = [];
  let builtFor = 0;
  let lastX: number | null = null;

  return (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number, pointer: FilmPointer) => {
    if (width !== builtFor) {
      builtFor = width;
      const count = Math.max(13, Math.floor(width / 24));
      strings = Array.from({ length: count }, (_, index) => ({
        x: ((index + 0.5) / count) * width,
        amplitude: 0,
        phase: index,
        note: noteFor(index, count),
      }));
    }
    brushStrings(strings, pointer, lastX, dt, height * 0.06, pluck);
    lastX = pointer.active ? pointer.x : null;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, width, height);
    drawStrings(ctx, strings, height * 0.05, height * 0.95, 1.6);
    vignette(ctx, width, height, 0.5);
  };
}

function createFilmScene(player: Player, score: Score) {
  return () => {
    const fonts = readFonts();
    const pluck: Pluck = (frequency, strength) => score.pluck(frequency, strength);
    const shots = createShots(fonts, pluck);
    const outro = createOutro(pluck);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer: FilmPointer = { x: 0, y: 0, active: false, moved: false };
    let lastShot = -1;
    let endedAt = 0;
    let wasEnded = false;

    return ({ ctx, width, height, dt, time, pointer: raw }: Frame) => {
      player.advance(dt);
      pointer.x = raw.x;
      pointer.y = raw.y;
      pointer.active = raw.active;
      pointer.moved = pointer.moved || raw.active;
      const state = player.state;

      if (state === "idle") {
        // The poster frame is already playable: the rings follow you before you press play.
        const teaserTime = reducedMotion ? 0 : time;
        shots.moire({
          ctx, width, height, dt, time: teaserTime, beat: teaserTime / (BEAT_SECONDS * 2), local: 12, length: 16,
          entered: false, pointer: reducedMotion ? { ...pointer, active: false } : pointer,
        });
        ctx.fillStyle = "rgba(12, 11, 10, 0.35)";
        ctx.fillRect(0, 0, width, height);
        return;
      }

      if (state === "ended") {
        if (!wasEnded) endedAt = time;
        wasEnded = true;
        outro(ctx, width, height, dt, pointer);
        drawCaption(
          ctx, width, height, fonts,
          { kicker: "Your turn", title: score.enabled ? "Brush the threads." : "Turn the sound on and brush the threads." },
          (time - endedAt) / BEAT_SECONDS, Infinity,
        );
        return;
      }
      wasEnded = false;

      const beat = Math.min(TOTAL_BEATS - 0.001, player.time / BEAT_SECONDS);
      const { shot, index } = shotAt(beat);
      const entered = index !== lastShot;
      if (entered) {
        lastShot = index;
        player.shotChanged(index);
      }
      const local = beat - shot.startBeat;
      const length = shot.endBeat - shot.startBeat;
      shots[shot.name]({
        ctx, width, height, dt: state === "playing" ? dt : 0, time: player.time, beat, local, length, entered, pointer,
      });

      const captionIndex = shot.captions.findLastIndex((caption) => caption.atBeat <= local);
      if (captionIndex !== -1) {
        const caption = shot.captions[captionIndex];
        const endsAt = shot.captions[captionIndex + 1]?.atBeat ?? length;
        drawCaption(ctx, width, height, fonts, caption, local - caption.atBeat, endsAt - local);
      }

      for (const drop of DROPS) {
        const since = beat - drop;
        if (since < 0 || since > 0.5) continue;
        ctx.fillStyle = PAPER;
        ctx.globalAlpha = (1 - since / 0.5) * 0.6;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }
    };
  };
}

const subscribeNever = () => () => {};

const formatTime = (seconds: number) => `0:${String(Math.floor(seconds)).padStart(2, "0")}`.replace("0:60", "1:00");

export function SotoFilm() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const [score] = useState(() => createScore(FILM_ARRANGEMENT));
  const [player] = useState(() => createPlayer(score, TOTAL_SECONDS));
  const [createScene] = useState(() => createFilmScene(player, score));
  const [state, setState] = useState<PlayerState>("idle");
  const [shotIndex, setShotIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  // iPhone Safari has no element fullscreen; the server render assumes none so hydration matches.
  const canFullscreen = useSyncExternalStore(subscribeNever, () => document.fullscreenEnabled, () => false);
  const [shareLabel, setShareLabel] = useState("Share");
  useCanvasLoop(canvasRef, createScene, { alwaysAnimate: true });

  useEffect(() => {
    player.listen({
      onShot: setShotIndex,
      onState: setState,
      onProgress: (seconds) => {
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${seconds / TOTAL_SECONDS})`;
        if (clockRef.current) clockRef.current.textContent = formatTime(seconds);
      },
    });
    return () => player.listen(null);
  }, [player]);

  const setSound = async (next: boolean) => {
    try {
      await score.setEnabled(next);
      setSoundOn(next);
      player.resync();
    } catch (error) {
      console.error("Soto film: could not change sound", error);
    }
  };

  const start = async (withSound: boolean) => {
    if (withSound) await setSound(true);
    player.play();
  };

  const toggle = () => {
    if (state === "playing") player.pause();
    else player.play();
  };

  const jump = (index: number) => {
    player.seek(SHOTS[index].startBeat * BEAT_SECONDS);
    if (player.state !== "playing") player.play();
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch (error) {
      console.error("Soto film: fullscreen failed", error);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#film`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Jesús Rafael Soto, in 60 seconds", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareLabel("Link copied");
    } catch (error) {
      // Closing the share sheet rejects with AbortError; that is the viewer changing their mind, not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Soto film: share failed", error);
      setShareLabel("Couldn't share");
    }
  };

  const caption = SHOTS[shotIndex].captions[0];

  return (
    <div className="soto-film">
      <div className="soto-film-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="soto-canvas soto-film-canvas" aria-hidden="true" />

        {state === "idle" && (
          <div className="soto-film-start">
            <button type="button" className="soto-film-play" onClick={() => start(true)}>
              <span className="soto-film-play-title">Soto, in 60 seconds</span>
              <span className="soto-film-play-meta">Play with sound</span>
            </button>
            <button type="button" className="soto-film-quiet" onClick={() => start(false)}>
              or play muted
            </button>
          </div>
        )}

        {state === "ended" && (
          <div className="soto-film-end">
            <button type="button" className="soto-film-chip" onClick={() => player.play()}>
              Replay
            </button>
            <button type="button" className="soto-film-chip" onClick={share}>
              {shareLabel}
            </button>
          </div>
        )}

        {state !== "idle" && (
          <div className="soto-film-hud">
            <button type="button" className="soto-film-chip" aria-pressed={soundOn} onClick={() => setSound(!soundOn)}>
              {soundOn ? "Sound on" : "Sound off"}
            </button>
            {canFullscreen && (
              <button type="button" className="soto-film-chip" onClick={toggleFullscreen}>
                Fullscreen
              </button>
            )}
          </div>
        )}
      </div>

      <p className="soto-film-live" aria-live="polite">
        {state === "idle" ? "" : state === "ended" ? "Your turn. Brush the threads." : `${caption.kicker}. ${caption.title}`}
      </p>

      <div className="soto-film-controls">
        <button type="button" className="soto-clip-toggle" onClick={state === "idle" ? () => start(true) : toggle}>
          {state === "playing" ? "Pause" : state === "ended" ? "Replay" : "Play"}
        </button>
        <div className="soto-film-track">
          <div className="soto-film-fill" ref={fillRef} />
          {SHOTS.map((shot, index) => (
            <button
              key={shot.name}
              type="button"
              className={`soto-film-segment${index === shotIndex && state !== "idle" ? " is-current" : ""}`}
              style={{ flexGrow: shot.endBeat - shot.startBeat }}
              onClick={() => jump(index)}
              aria-label={`Jump to ${shot.captions[0].kicker}`}
            />
          ))}
        </div>
        <span className="soto-film-clock">
          <span ref={clockRef}>0:00</span> / 1:00
        </span>
      </div>
    </div>
  );
}
