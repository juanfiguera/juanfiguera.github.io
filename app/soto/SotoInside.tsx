"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPlayer, type PlayerState } from "./film/player";
import { createScore } from "./film/score";
import { LOUNGE_ARRANGEMENT } from "./film3/lounge";
import { createFilmScene, createLibrary } from "./film3/scene";
import { BAR_SECONDS, PHOTOS, QUOTES, SEGMENTS, TOTAL_SECONDS } from "./film3/timeline";
import { useCanvasLoop } from "./useCanvasLoop";

const LICENSES: Record<string, string> = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 2.5": "https://creativecommons.org/licenses/by/2.5/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};

const USED_PHOTOS = [...new Set(SEGMENTS.flatMap((segment) => ("photo" in segment ? [segment.photo] : [])))].map((id) => PHOTOS[id]);

const subscribeNever = () => () => {};

const formatTime = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const segmentLabel = (index: number) => {
  const segment = SEGMENTS[index];
  if (segment.kind === "title") return "Title";
  if (segment.kind === "credits") return "Credits";
  if (segment.kind === "lines") return "Interlude";
  return PHOTOS[segment.photo].work;
};

export function SotoInside() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const [score] = useState(() => createScore(LOUNGE_ARRANGEMENT));
  const [player] = useState(() => createPlayer(score, TOTAL_SECONDS));
  const [library] = useState(createLibrary);
  const [createScene] = useState(() => createFilmScene(player, library));
  const [state, setState] = useState<PlayerState>("idle");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [looping, setLooping] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const canFullscreen = useSyncExternalStore(subscribeNever, () => document.fullscreenEnabled, () => false);
  useCanvasLoop(canvasRef, createScene, { alwaysAnimate: true });

  useEffect(() => {
    player.listen({
      onShot: setSegmentIndex,
      onState: setState,
      onProgress: (seconds) => {
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${seconds / TOTAL_SECONDS})`;
        if (clockRef.current) clockRef.current.textContent = formatTime(seconds);
      },
    });
    return () => player.listen(null);
  }, [player]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        library.load();
        observer.disconnect();
      },
      { rootMargin: "800px" },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [library]);

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
    library.load();
    if (withSound) await setSound(true);
    player.play();
  };

  const toggle = () => {
    if (state === "idle") start(true);
    else if (state === "playing") player.pause();
    else player.play();
  };

  const toggleLoop = () => {
    player.setLoop(!looping);
    setLooping(!looping);
  };

  const jump = (index: number) => {
    player.seek(SEGMENTS[index].from * BAR_SECONDS);
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
        await navigator.share({ title: "Jesús Rafael Soto: Inside the vibration", url });
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

  const segment = SEGMENTS[segmentIndex];
  const liveText =
    state === "idle" ? "" : "quote" in segment && segment.quote ? `Jesús Rafael Soto: ${segment.quote.text}` : segmentLabel(segmentIndex);

  return (
    <div className="soto-film">
      <div className="soto-film-stage soto-inside-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="soto-canvas" aria-hidden="true" />

        {state === "idle" && (
          <div className="soto-film-start soto-inside-start">
            <button type="button" className="soto-film-play soto-inside-play" onClick={() => start(true)}>
              <span className="soto-film-play-meta">Play with sound · 1:39</span>
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
            <button type="button" className="soto-film-chip" aria-pressed={looping} onClick={toggleLoop}>
              Loop
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
        {liveText}
      </p>

      <div className="soto-film-controls">
        <button type="button" className="soto-clip-toggle" onClick={toggle}>
          {state === "playing" ? "Pause" : state === "ended" ? "Replay" : "Play"}
        </button>
        <div className="soto-film-track">
          <div className="soto-film-fill" ref={fillRef} />
          {SEGMENTS.map((item, index) => (
            <button
              key={`${item.kind}-${item.from}`}
              type="button"
              className={`soto-film-segment${index === segmentIndex && state !== "idle" ? " is-current" : ""}`}
              style={{ flexGrow: item.to - item.from }}
              onClick={() => jump(index)}
              aria-label={`Jump to ${segmentLabel(index)}`}
            />
          ))}
        </div>
        <span className="soto-film-clock">
          <span ref={clockRef}>0:00</span> / {formatTime(TOTAL_SECONDS)}
        </span>
      </div>

      <details className="soto-credits">
        <summary>Credits and sources</summary>
        <p>
          Every line on screen is Soto&apos;s own, in the English of the{" "}
          <a href="https://jesus-soto.com/wp-content/uploads/2021/09/Soto-Biography-EN.pdf">Soto foundation&apos;s biography</a>{" "}
          by Arnauld Pierre, except the line about the vibration, which is translated from the French on the{" "}
          <a href={QUOTES.inside.url}>Centre Pompidou</a> page, quoting Ariel Jiménez&apos;s <em>Conversaciones con Jesús Soto</em>.
        </p>
        <ul>
          {USED_PHOTOS.map((photo) => (
            <li key={photo.id}>
              <a href={photo.page}>{photo.work}</a>, {photo.place}. Photo by {photo.author},{" "}
              <a href={LICENSES[photo.license]}>{photo.license}</a>, cropped and color graded.
            </li>
          ))}
        </ul>
        <p>The music and the picture are generated in your browser as it plays.</p>
      </details>
    </div>
  );
}
