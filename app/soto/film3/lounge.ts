import { envelope, rod, type Arrangement, type Audio, type Bus } from "../film/score";
import { BAR_SECONDS, TOTAL_BARS } from "./timeline";

const STEPS_PER_BAR = 16;

type Chord = { bass: number; tones: number[] };

// Dm9, G13, Cmaj9, Am9: a slow jazz turnaround, the harmonic floor of most late-night deep house.
const PROGRESSION: Chord[] = [
  { bass: 73.42, tones: [174.61, 220, 261.63, 329.63] },
  { bass: 49, tones: [174.61, 246.94, 329.63, 392] },
  { bass: 65.41, tones: [164.81, 196, 246.94, 293.66] },
  { bass: 55, tones: [196, 246.94, 261.63, 329.63] },
];

type Section = {
  from: number;
  to: number;
  kick?: boolean;
  hats?: boolean;
  shaker?: boolean;
  rim?: boolean;
  bass?: boolean;
  stabs?: boolean;
  bells?: boolean;
  sweep?: boolean;
};

// In bars. Keep in step with the shot list in timeline.ts.
const SECTIONS: Section[] = [
  { from: 0, to: 4 },
  { from: 4, to: 8, shaker: true, stabs: true },
  { from: 8, to: 24, kick: true, hats: true, shaker: true, rim: true, bass: true, stabs: true },
  { from: 24, to: 28, stabs: true, sweep: true },
  { from: 28, to: 40, kick: true, hats: true, shaker: true, rim: true, bass: true, stabs: true, bells: true },
  { from: 40, to: 44, hats: true, shaker: true, bass: true, stabs: true, bells: true },
  { from: 44, to: TOTAL_BARS, stabs: true },
];

const STAB_STEPS = [3, 6, 11];
const BASS_STEPS: [number, number][] = [
  [0, 1],
  [6, 1],
  [10, 1.5],
  [14, 2],
];
const BELL_STEPS = [0, 3, 6, 10, 12];
const BELL_PATTERN = [3, 2, 1, 2, 0, 3, 1, 2];

// Two-operator FM: the bell-and-bark of an electric piano without shipping a sample.
function electricPiano({ context }: Audio, bus: Bus, at: number, frequency: number, level: number, seconds: number) {
  const carrier = context.createOscillator();
  const modulator = context.createOscillator();
  const depth = context.createGain();
  const gain = context.createGain();
  carrier.frequency.value = frequency;
  modulator.frequency.value = frequency;
  depth.gain.setValueAtTime(frequency * 1.6, at);
  depth.gain.exponentialRampToValueAtTime(frequency * 0.15, at + 0.5);
  envelope(gain.gain, at, level, 0.006, seconds);
  modulator.connect(depth).connect(carrier.frequency);
  carrier.connect(gain);
  gain.connect(bus.input);
  gain.connect(bus.reverbSend);
  carrier.start(at);
  modulator.start(at);
  carrier.stop(at + seconds + 0.1);
  modulator.stop(at + seconds + 0.1);
}

function pad({ context }: Audio, bus: Bus, at: number, chord: Chord, seconds: number) {
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.035, at + 1.2);
  gain.gain.setValueAtTime(0.035, at + seconds - 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds + 1.2);
  filter.connect(gain);
  gain.connect(bus.input);
  gain.connect(bus.reverbSend);
  for (const tone of chord.tones) {
    for (const detune of [-7, 7]) {
      const oscillator = context.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = tone / 2;
      oscillator.detune.value = detune;
      oscillator.connect(filter);
      oscillator.start(at);
      oscillator.stop(at + seconds + 1.3);
    }
  }
}

function kick({ context }: Audio, bus: Bus, at: number) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(115, at);
  oscillator.frequency.exponentialRampToValueAtTime(46, at + 0.12);
  filter.type = "lowpass";
  filter.frequency.value = 220;
  envelope(gain.gain, at, 0.8, 0.004, 0.34);
  oscillator.connect(filter).connect(gain).connect(bus.input);
  oscillator.start(at);
  oscillator.stop(at + 0.4);
}

function subBass({ context }: Audio, bus: Bus, at: number, frequency: number, seconds: number) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  filter.type = "lowpass";
  filter.frequency.value = 260;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.3, at + 0.015);
  gain.gain.setTargetAtTime(0.0001, at + seconds * 0.6, seconds * 0.25);
  oscillator.connect(filter).connect(gain).connect(bus.input);
  oscillator.start(at);
  oscillator.stop(at + seconds + 0.2);
}

function noise(audio: Audio, bus: Bus, at: number, type: BiquadFilterType, frequency: number, level: number, release: number, wet = 0) {
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  source.buffer = audio.noise;
  filter.type = type;
  filter.frequency.value = frequency;
  envelope(gain.gain, at, level, 0.002, release);
  source.connect(filter).connect(gain);
  gain.connect(bus.input);
  if (wet > 0) {
    const send = audio.context.createGain();
    send.gain.value = wet;
    gain.connect(send).connect(bus.reverbSend);
  }
  source.start(at, Math.random() * 0.5);
  source.stop(at + release + 0.05);
}

// Surface noise and the odd pop, so the whole thing sounds like it is coming off a record.
function vinyl(audio: Audio, bus: Bus, at: number, seconds: number) {
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  source.buffer = audio.noise;
  source.loop = true;
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  filter.Q.value = 0.4;
  gain.gain.setValueAtTime(0.012, at);
  gain.gain.setValueAtTime(0.012, at + seconds);
  gain.gain.linearRampToValueAtTime(0, at + seconds + 0.05);
  source.connect(filter).connect(gain).connect(bus.input);
  source.start(at, Math.random() * 0.5);
  source.stop(at + seconds + 0.06);
  for (let pop = 0; pop < 6; pop++) {
    noise(audio, bus, at + Math.random() * seconds, "highpass", 2500, 0.02 + Math.random() * 0.05, 0.004);
  }
}

function sweep(audio: Audio, bus: Bus, at: number, seconds: number) {
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  source.buffer = audio.noise;
  source.loop = true;
  filter.type = "bandpass";
  filter.Q.value = 6;
  filter.frequency.setValueAtTime(300, at);
  filter.frequency.exponentialRampToValueAtTime(5000, at + seconds);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.06, at + seconds);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds + 0.1);
  source.connect(filter).connect(gain);
  gain.connect(bus.input);
  gain.connect(bus.reverbSend);
  source.start(at);
  source.stop(at + seconds + 0.2);
}

function playLoungeStep(audio: Audio, bus: Bus, step: number, at: number) {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const inBar = step % STEPS_PER_BAR;
  const section = SECTIONS.find((candidate) => bar >= candidate.from && bar < candidate.to);
  const chord = PROGRESSION[bar % PROGRESSION.length];
  const stepSeconds = BAR_SECONDS / STEPS_PER_BAR;
  if (!section) return;

  if (inBar === 0) {
    vinyl(audio, bus, at, BAR_SECONDS);
    pad(audio, bus, at, chord, BAR_SECONDS);
    if (!section.stabs || bar >= 44) for (const tone of chord.tones) electricPiano(audio, bus, at, tone, 0.07, BAR_SECONDS * 1.5);
    if (section.sweep && bar === section.from) sweep(audio, bus, at, BAR_SECONDS * (section.to - section.from));
  }
  const onBeat = inBar % 4 === 0;
  if (section.kick && onBeat) kick(audio, bus, at);
  if (section.hats && inBar % 4 === 2) noise(audio, bus, at, "highpass", 8500, 0.07, 0.11);
  if (section.shaker) noise(audio, bus, at, "bandpass", 6500, inBar % 2 === 0 ? 0.012 : 0.022, 0.035);
  if (section.rim && (inBar === 4 || inBar === 12)) noise(audio, bus, at, "bandpass", 2200, 0.16, 0.06, 0.7);
  if (section.stabs && bar < 44 && STAB_STEPS.includes(inBar)) {
    for (const tone of chord.tones) electricPiano(audio, bus, at, tone, 0.045, 0.4);
  }
  if (section.bass) {
    const note = BASS_STEPS.find(([position]) => position === inBar);
    if (note) subBass(audio, bus, at, chord.bass * note[1], stepSeconds * 3);
  }
  if (section.bells && BELL_STEPS.includes(inBar)) {
    const index = bar * BELL_STEPS.length + BELL_STEPS.indexOf(inBar);
    rod(audio, bus, at, chord.tones[BELL_PATTERN[index % BELL_PATTERN.length]] * 2, 0.06);
  }
}

export const LOUNGE_ARRANGEMENT: Arrangement = {
  stepSeconds: BAR_SECONDS / STEPS_PER_BAR,
  totalSteps: TOTAL_BARS * STEPS_PER_BAR,
  playStep: playLoungeStep,
  pluck: (audio, bus, at, frequency, strength) => electricPiano(audio, bus, at, frequency, 0.05 + strength * 0.08, 1.4),
};
