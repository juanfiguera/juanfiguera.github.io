"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { createPlayer, type PlayerState } from "./film/player";
import { createScore } from "./film/score";
import { createControlsFlag, createFilmScene, createLibrary } from "./film3/scene";
import { BAR_SECONDS, CLIPS, PHOTOS, POSTER, QUOTES, SEGMENTS, TOTAL_SECONDS } from "./film3/timeline";
import { LOUNGE_ARRANGEMENT } from "./film3/lounge";
import {
  ExitFullscreenIcon,
  FullscreenIcon,
  LoopIcon,
  PauseIcon,
  PlayIcon,
  ReplayIcon,
  ShareIcon,
  SoundOffIcon,
  SoundOnIcon,
} from "./PlayerIcons";
import { useCanvasLoop } from "./useCanvasLoop";

const LICENSES: Record<string, string> = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 2.5": "https://creativecommons.org/licenses/by/2.5/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};

const USED_MEDIA = [
  ...[...new Set([POSTER.photo, ...SEGMENTS.flatMap((segment) => ("photo" in segment ? [segment.photo] : []))])].map((id) => ({ ...PHOTOS[id], kind: "Photo" })),
  ...[...new Set(SEGMENTS.flatMap((segment) => (segment.kind === "clip" ? [segment.clip] : [])))].map((id) => ({ ...CLIPS[id], kind: "Footage" })),
];

const subscribeNever = () => () => {};

// How long the controls stay up after the pointer stops, while the film is playing. Touch gets longer:
// there is no hover, so the viewer has to find the button after the tap that revealed it.
const CHROME_IDLE_MS = 2500;
const CHROME_IDLE_TOUCH_MS = 4000;

const formatTime = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const segmentLabel = (index: number) => {
  const segment = SEGMENTS[index];
  if (segment.kind === "credits") return "Credits";
  if (segment.kind === "lines") return "Interlude";
  if (segment.kind === "card") {
    const words = segment.text.replace(/^…/, "").split(" ");
    return words.length > 5 ? `“${words.slice(0, 5).join(" ")}…”` : `“${words.join(" ")}”`;
  }
  if (segment.kind === "black") return "Black";
  if (segment.kind === "portrait") return "Portrait";
  if (segment.kind === "clip") return CLIPS[segment.clip].work;
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
  const [controls] = useState(createControlsFlag);
  const [createScene] = useState(() => createFilmScene(player, library, controls.isShowing));
  const [state, setState] = useState<PlayerState>("idle");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [looping, setLooping] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const [chromeAwake, setChromeAwake] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chromeTimer = useRef<number | undefined>(undefined);
  const shareTimer = useRef<number | undefined>(undefined);
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

  useEffect(() => {
    controls.setShowing(state !== "idle" && (state !== "playing" || chromeAwake));
  }, [controls, state, chromeAwake]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.clearTimeout(chromeTimer.current);
      window.clearTimeout(shareTimer.current);
    };
  }, []);

  const wakeChrome = (event?: { pointerType?: string }) => {
    setChromeAwake(true);
    window.clearTimeout(chromeTimer.current);
    const idle = event?.pointerType === "touch" ? CHROME_IDLE_TOUCH_MS : CHROME_IDLE_MS;
    chromeTimer.current = window.setTimeout(() => setChromeAwake(false), idle);
  };

  // Only a mouse really leaves. A finger "leaves" every time it lifts, which would hide the controls mid-tap.
  const sleepChrome = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(chromeTimer.current);
    setChromeAwake(false);
  };

  const setSound = async (next: boolean) => {
    try {
      await score.setEnabled(next);
      setSoundOn(next);
      player.resync();
    } catch (error) {
      console.error("Soto film: could not change sound", error);
    }
  };

  // Sound is the default: the film is cut to the music. The mute button in the controls turns it off.
  const start = async () => {
    library.load();
    library.prime();
    await setSound(true);
    player.play();
    wakeChrome();
  };

  const toggle = () => {
    if (state === "idle") start();
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

  const flashShareLabel = (label: string) => {
    setShareLabel(label);
    window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => setShareLabel("Share"), 2000);
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#film`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Jesús Rafael Soto: Inside the vibration", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flashShareLabel("Link copied");
    } catch (error) {
      // Closing the share sheet rejects with AbortError; that is the viewer changing their mind, not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Soto film: share failed", error);
      flashShareLabel("Couldn't share");
    }
  };

  const segment = SEGMENTS[segmentIndex];
  const liveText =
    state === "idle"
      ? ""
      : segment.kind === "card" || segment.kind === "lines"
        ? `Jesús Rafael Soto: ${segment.kind === "card" ? segment.text : segment.quote.text}`
        : segmentLabel(segmentIndex);

  return (
    <div className="soto-film">
      <div
        className={`soto-film-stage soto-inside-stage${state === "playing" && !chromeAwake ? " is-chrome-asleep" : ""}`}
        ref={stageRef}
        onPointerMove={wakeChrome}
        onPointerDown={wakeChrome}
        onPointerLeave={sleepChrome}
        onFocus={() => wakeChrome()}
      >
        <canvas ref={canvasRef} className="soto-canvas" aria-hidden="true" />

        {state === "idle" && (
          <div className="soto-film-start soto-inside-start">
            <button type="button" className="soto-inside-play" onClick={start}>
              <PlayIcon />
              <span>Play</span>
              <span className="soto-inside-play-time">{formatTime(TOTAL_SECONDS)}</span>
            </button>
          </div>
        )}

        {state === "ended" && (
          <div className="soto-inside-end">
            <button type="button" className="soto-inside-pill" onClick={() => player.play()}>
              <ReplayIcon />
              Replay
            </button>
            <button type="button" className="soto-inside-pill" onClick={share}>
              <ShareIcon />
              {shareLabel}
            </button>
          </div>
        )}

        <div className="soto-player" hidden={state === "idle"}>
          <div className="soto-player-track">
            <div className="soto-player-fill" ref={fillRef} />
            {SEGMENTS.map((item, index) => (
              <button
                key={`${item.kind}-${item.from}`}
                type="button"
                className="soto-player-segment"
                style={{ flexGrow: item.to - item.from }}
                onClick={() => jump(index)}
                aria-label={`Jump to ${segmentLabel(index)}`}
                data-label={segmentLabel(index)}
              />
            ))}
          </div>
          <div className="soto-player-row">
            <button type="button" className="soto-player-button" onClick={toggle} aria-label={state === "playing" ? "Pause" : state === "ended" ? "Replay" : "Play"}>
              {state === "playing" ? <PauseIcon /> : state === "ended" ? <ReplayIcon /> : <PlayIcon />}
            </button>
            <button type="button" className="soto-player-button" onClick={() => setSound(!soundOn)} aria-label={soundOn ? "Mute" : "Unmute"}>
              {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
            </button>
            <span className="soto-player-clock">
              <span ref={clockRef}>0:00</span> / {formatTime(TOTAL_SECONDS)}
            </span>
            <span className="soto-player-spacer" />
            <button type="button" className="soto-player-button" onClick={share} aria-label={shareLabel}>
              <ShareIcon />
              {shareLabel !== "Share" && (
                <span className="soto-player-toast" role="status">
                  {shareLabel}
                </span>
              )}
            </button>
            <button type="button" className="soto-player-button" aria-pressed={looping} onClick={toggleLoop} aria-label="Loop">
              <LoopIcon />
            </button>
            {canFullscreen && (
              <button type="button" className="soto-player-button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="soto-film-live" aria-live="polite">
        {liveText}
      </p>

      <details className="soto-credits">
        <summary>Credits and sources</summary>
        <p>
          Every line on screen is Soto&apos;s own, in the English of the{" "}
          <a href="https://jesus-soto.com/wp-content/uploads/2021/09/Soto-Biography-EN.pdf">Soto foundation&apos;s biography</a>{" "}
          by Arnauld Pierre, except the line about the vibration, which is translated from the French on the{" "}
          <a href={QUOTES.inside.url}>Centre Pompidou</a> page, quoting Ariel Jiménez&apos;s <em>Conversaciones con Jesús Soto</em>.
        </p>
        <ul>
          {USED_MEDIA.map((media) => (
            <li key={media.id}>
              <a href={media.page}>{media.work}</a>, {media.place}. {media.kind} by {media.author},{" "}
              <a href={LICENSES[media.license]}>{media.license}</a>, cropped and color graded.
            </li>
          ))}
        </ul>
        <p>The music and the picture are generated in your browser as it plays.</p>
      </details>
    </div>
  );
}
