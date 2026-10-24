"use client";

import { useRef, useState } from "react";
import { useCanvasLoop, type Frame } from "./useCanvasLoop";

const SPACING = 16;
const DAMPING = 0.6;
const MAX_SPIN = 0.9;
const MAX_ANGLE = 0.32;
const CHIME_COOLDOWN = 0.09;
// Major pentatonic: any set of rods struck together still sounds consonant.
const SCALE = [0, 2, 4, 7, 9];
const BASE_FREQUENCY = 293.66;
// Partials of a free metal bar, which is what gives a chime its bell-like, slightly off-harmonic ring.
const PARTIALS = [
  { ratio: 1, gain: 1, decay: 2.4 },
  { ratio: 2.756, gain: 0.45, decay: 1.2 },
  { ratio: 5.404, gain: 0.2, decay: 0.6 },
];

type Strike = (rodIndex: number, rodCount: number, strength: number) => void;

type Rod = {
  x: number;
  top: number;
  length: number;
  angle: number;
  spin: number;
  shine: number;
  lastChime: number;
};

function buildRods(width: number, height: number): Rod[] {
  const rods: Rod[] = [];
  const count = Math.floor((width - SPACING * 2) / SPACING);
  for (let i = 0; i <= count; i++) {
    const wave = Math.sin((i / count) * Math.PI * 2.2 + 0.6);
    const length = height * (0.5 + 0.2 * wave);
    rods.push({
      x: SPACING + i * SPACING,
      top: height * 0.12 + (height * 0.72 - length) * 0.5,
      length,
      angle: 0,
      spin: 0,
      shine: 0,
      lastChime: -Infinity,
    });
  }
  return rods;
}

function createSonoro(strike: Strike) {
  return () => {
    let rods: Rod[] = [];
    let builtFor = "";
    let lastPointer = { x: 0, y: 0, active: false };

    return ({ ctx, width, height, time, dt, pointer }: Frame) => {
      const key = `${width}x${height}`;
      if (key !== builtFor) {
        rods = buildRods(width, height);
        builtFor = key;
      }

      if (pointer.active && lastPointer.active && dt > 0) {
        const velocityX = (pointer.x - lastPointer.x) / dt;
        rods.forEach((rod, index) => {
          // Pendulum pivots at the ceiling, so the rod's x depends on height.
          const rodX = (y: number) => rod.x + Math.sin(rod.angle) * y;
          const bottom = rod.top + rod.length;
          if (pointer.y < rod.top || pointer.y > bottom) return;
          const before = Math.sign(lastPointer.x - rodX(lastPointer.y));
          const after = Math.sign(pointer.x - rodX(pointer.y));
          if (before === after || before === 0) return;
          rod.spin = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, rod.spin + (velocityX / pointer.y) * 0.12));
          const strength = Math.min(1, Math.abs(velocityX) / 1400);
          rod.shine = Math.max(rod.shine, 0.4 + strength * 0.6);
          if (time - rod.lastChime > CHIME_COOLDOWN) {
            rod.lastChime = time;
            strike(index, rods.length, strength);
          }
        });
      }
      lastPointer = { x: pointer.x, y: pointer.y, active: pointer.active };

      for (const rod of rods) {
        const pivotLength = rod.top + rod.length * 0.5;
        const gravity = 1800 / pivotLength;
        rod.spin += (-gravity * Math.sin(rod.angle) - DAMPING * rod.spin) * dt;
        rod.angle += rod.spin * dt;
        // Neighbors and the wall stop a real rod long before it swings flat.
        if (Math.abs(rod.angle) > MAX_ANGLE) {
          rod.angle = Math.sign(rod.angle) * MAX_ANGLE;
          rod.spin *= -0.4;
        }
        rod.shine *= Math.exp(-dt * 2.5);
      }

      ctx.fillStyle = "#f4f2ed";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#cfcabd";
      for (let x = 0; x < width; x += 6) ctx.fillRect(x, 0, 2, height);

      ctx.strokeStyle = "rgba(20, 18, 15, 0.3)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (const rod of rods) {
        ctx.moveTo(rod.x, 0);
        ctx.lineTo(rod.x + Math.sin(rod.angle) * rod.top, rod.top * Math.cos(rod.angle));
      }
      ctx.stroke();

      ctx.lineCap = "round";
      for (const rod of rods) {
        const sin = Math.sin(rod.angle);
        const cos = Math.cos(rod.angle);
        const x1 = rod.x + sin * rod.top;
        const y1 = rod.top * cos;
        const x2 = rod.x + sin * (rod.top + rod.length);
        const y2 = (rod.top + rod.length) * cos;

        ctx.strokeStyle = "#5d6168";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const light = Math.round(200 + rod.shine * 55);
        ctx.strokeStyle = `rgb(${light}, ${light}, ${Math.min(255, light + 4)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1 - 0.8, y1);
        ctx.lineTo(x2 - 0.8, y2);
        ctx.stroke();
      }
    };
  };
}

function playChime(audio: AudioContext, output: AudioNode, rodIndex: number, rodCount: number, strength: number) {
  // Long rods on the left ring low, short ones high, across two octaves.
  const step = Math.round((rodIndex / Math.max(1, rodCount - 1)) * (SCALE.length * 2));
  const octave = Math.floor(step / SCALE.length);
  const semitones = SCALE[step % SCALE.length] + octave * 12;
  const frequency = BASE_FREQUENCY * 2 ** (semitones / 12);
  const now = audio.currentTime;
  const level = 0.08 + strength * 0.22;

  for (const partial of PARTIALS) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency * partial.ratio;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level * partial.gain, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + partial.decay);
    oscillator.connect(gain).connect(output);
    oscillator.start(now);
    oscillator.stop(now + partial.decay + 0.05);
  }
}

// Owns its AudioContext so nothing in React render touches audio; created lazily on the first click.
function createChimes() {
  let audio: { context: AudioContext; output: AudioNode } | null = null;

  return {
    strike(rodIndex: number, rodCount: number, strength: number) {
      if (!audio || audio.context.state !== "running") return;
      playChime(audio.context, audio.output, rodIndex, rodCount, strength);
    },
    async setEnabled(enabled: boolean) {
      if (!audio) {
        const context = new AudioContext();
        const compressor = context.createDynamicsCompressor();
        compressor.connect(context.destination);
        audio = { context, output: compressor };
      }
      if (enabled) await audio.context.resume();
      else await audio.context.suspend();
    },
  };
}

export function Sonoro() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chimes] = useState(createChimes);
  const [createScene] = useState(() => createSonoro(chimes.strike));
  const [soundOn, setSoundOn] = useState(false);
  useCanvasLoop(canvasRef, createScene);

  const toggleSound = async () => {
    await chimes.setEnabled(!soundOn);
    setSoundOn(!soundOn);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="soto-canvas"
        role="img"
        aria-label="A row of hanging metal rods in front of fine stripes. Brushing through them sets them swinging and, with sound on, makes them chime."
      />
      <button type="button" className="soto-sound" aria-pressed={soundOn} onClick={toggleSound}>
        {soundOn ? "Sound on" : "Sound off"}
      </button>
    </>
  );
}
