import type { Score } from "./score";

export type PlayerState = "idle" | "playing" | "paused" | "ended";

type PlayerListener = {
  onShot: (index: number) => void;
  onState: (state: PlayerState) => void;
  onProgress: (seconds: number) => void;
};

// Playback lives outside React so the canvas loop can advance it every frame without re-rendering.
export function createPlayer(score: Score, totalSeconds: number) {
  let time = 0;
  let state: PlayerState = "idle";
  let listener: PlayerListener | null = null;
  let loop = false;

  const setState = (next: PlayerState) => {
    state = next;
    listener?.onState(next);
  };

  return {
    listen(next: PlayerListener | null) {
      listener = next;
    },
    get time() {
      return time;
    },
    get state() {
      return state;
    },
    // For a screen left running in a room: the end wraps straight back to the start.
    setLoop(next: boolean) {
      loop = next;
    },
    shotChanged(index: number) {
      listener?.onShot(index);
    },
    play() {
      if (time >= totalSeconds) time = 0;
      score.sync(time);
      setState("playing");
    },
    pause() {
      score.silence();
      setState("paused");
    },
    seek(seconds: number) {
      time = Math.min(totalSeconds - 0.01, Math.max(0, seconds));
      listener?.onProgress(time);
      if (state === "playing") score.sync(time);
      else if (state === "ended") setState("paused");
    },
    // Called after sound is switched on or off mid-play so the audio clock takes over or lets go.
    resync() {
      if (state === "playing") score.sync(time);
    },
    advance(dt: number) {
      if (state !== "playing") return;
      const audioTime = score.clipTime();
      // The audio clock starts a hair behind after a sync; never let the picture step backwards.
      time = audioTime === null ? time + dt : Math.max(time, audioTime);
      if (time >= totalSeconds && loop) {
        time = 0;
        score.sync(0);
      } else if (time >= totalSeconds) {
        time = totalSeconds;
        setState("ended");
      } else {
        score.schedule(time);
      }
      listener?.onProgress(time);
    },
  };
}

export type Player = ReturnType<typeof createPlayer>;
