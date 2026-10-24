import { envelope, type Arrangement, type Audio, type Bus } from "../film/score";
import { BAR_SECONDS, MARKS, TOTAL_BARS } from "./timeline";
import { clamp01 } from "./look";

const STEPS_PER_BAR = 16;
const STEP_SECONDS = BAR_SECONDS / STEPS_PER_BAR;
const BEAT_SECONDS = BAR_SECONDS / 4;
// Late off-beat sixteenths: the small lag that makes a house groove sway instead of tick.
const SWING_SECONDS = STEP_SECONDS * 0.16;

type Chord = { bass: number; tones: number[] };

// Am9, D9, Gmaj9, Cmaj9: bright jazz-house changes, warm without ever turning sad.
const PROGRESSION: Chord[] = [
  { bass: 55, tones: [261.63, 329.63, 392, 493.88] },
  { bass: 73.42, tones: [261.63, 329.63, 369.99, 440] },
  { bass: 49, tones: [246.94, 293.66, 369.99, 440] },
  { bass: 65.41, tones: [246.94, 293.66, 329.63, 392] },
];

// A two-bar hook on the A minor pentatonic, which sits on all four chords.
const HOOK: [number, number][][] = [
  [
    [0, 659.25],
    [3, 783.99],
    [6, 880],
    [10, 783.99],
    [12, 659.25],
  ],
  [
    [2, 587.33],
    [6, 659.25],
    [8, 523.25],
    [11, 440],
  ],
];

const BASS_STEPS: [number, number][] = [
  [2, 1],
  [6, 1],
  [7, 2],
  [10, 1],
  [13, 1.5],
  [14, 1],
];
const STAB_STEPS = [3, 10];

type Section = {
  from: number;
  to: number;
  kick?: boolean;
  clap?: boolean;
  hats?: boolean;
  openHats?: boolean;
  shaker?: boolean;
  bass?: boolean;
  stabs?: boolean;
  pad?: boolean;
  hook?: boolean;
  sweep?: boolean;
  roll?: boolean;
};

// In bars, following the picture's marks. The black bar before the drop has no section: it is silent.
const SECTIONS: Section[] = [
  { from: 0, to: 4, shaker: true, pad: true },
  { from: 4, to: 12, kick: true, clap: true, hats: true, shaker: true, bass: true, stabs: true, pad: true },
  { from: 12, to: MARKS.breakdown, kick: true, clap: true, hats: true, shaker: true, bass: true, stabs: true, pad: true, hook: true },
  { from: MARKS.breakdown, to: MARKS.pulse, pad: true, hook: true, shaker: true, sweep: true },
  { from: MARKS.pulse, to: MARKS.rush, kick: true, clap: true, hats: true, openHats: true, shaker: true, bass: true, stabs: true, pad: true, hook: true },
  { from: MARKS.rush, to: MARKS.smash, kick: true, hats: true, openHats: true, bass: true, pad: true, roll: true },
  { from: MARKS.drop, to: MARKS.coda, kick: true, clap: true, hats: true, openHats: true, shaker: true, bass: true, stabs: true, pad: true, hook: true },
  { from: MARKS.coda, to: MARKS.credits, hats: true, shaker: true, bass: true, stabs: true, pad: true, hook: true },
  // The groove comes back under the credits so the film goes out on the beat, then rests on the last bar.
  { from: MARKS.credits, to: TOTAL_BARS - 1, kick: true, clap: true, hats: true, openHats: true, shaker: true, bass: true, stabs: true, pad: true, hook: true },
  { from: TOTAL_BARS - 1, to: TOTAL_BARS, shaker: true, pad: true },
];

// Two-operator FM: the bell-and-bark of a Rhodes without shipping a sample.
function electricPiano({ context }: Audio, bus: Bus, at: number, frequency: number, level: number, seconds: number) {
  const carrier = context.createOscillator();
  const modulator = context.createOscillator();
  const depth = context.createGain();
  const gain = context.createGain();
  carrier.frequency.value = frequency;
  modulator.frequency.value = frequency;
  depth.gain.setValueAtTime(frequency * 1.4, at);
  depth.gain.exponentialRampToValueAtTime(frequency * 0.12, at + 0.4);
  envelope(gain.gain, at, level, 0.005, seconds);
  modulator.connect(depth).connect(carrier.frequency);
  carrier.connect(gain);
  gain.connect(bus.input);
  gain.connect(bus.reverbSend);
  carrier.start(at);
  modulator.start(at);
  carrier.stop(at + seconds + 0.1);
  modulator.stop(at + seconds + 0.1);
}

// A soft mallet, somewhere between a marimba and a kalimba, for the hook.
function mallet({ context }: Audio, bus: Bus, at: number, frequency: number, level: number) {
  const gain = context.createGain();
  envelope(gain.gain, at, level, 0.003, 0.7);
  gain.connect(bus.input);
  gain.connect(bus.reverbSend);
  for (const [ratio, partialLevel, decay] of [
    [1, 1, 0.7],
    [3.98, 0.18, 0.12],
  ]) {
    const oscillator = context.createOscillator();
    const partial = context.createGain();
    oscillator.frequency.value = frequency * ratio;
    envelope(partial.gain, at, partialLevel, 0.002, decay);
    oscillator.connect(partial).connect(gain);
    oscillator.start(at);
    oscillator.stop(at + decay + 0.05);
  }
}

// Held chord under the bar, ducked on every beat the way a sidechained pad breathes against the kick.
function pad({ context }: Audio, bus: Bus, at: number, chord: Chord, seconds: number, pump: boolean) {
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const level = 0.04;
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + (pump ? 0.05 : 0.6));
  if (pump) {
    for (let beat = 0; beat < seconds / BEAT_SECONDS - 0.01; beat++) {
      const start = at + beat * BEAT_SECONDS;
      gain.gain.setValueAtTime(level * 0.25, start);
      gain.gain.linearRampToValueAtTime(level, start + BEAT_SECONDS * 0.7);
    }
  }
  gain.gain.setValueAtTime(level, at + seconds - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds + (pump ? 0.15 : 1));
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
      oscillator.stop(at + seconds + 1.1);
    }
  }
}

function kick({ context }: Audio, bus: Bus, at: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(130, at);
  oscillator.frequency.exponentialRampToValueAtTime(48, at + 0.09);
  envelope(gain.gain, at, 0.85, 0.003, 0.3);
  oscillator.connect(gain).connect(bus.input);
  oscillator.start(at);
  oscillator.stop(at + 0.35);
}

function bass({ context }: Audio, bus: Bus, at: number, frequency: number) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.value = frequency;
  filter.type = "lowpass";
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(700, at);
  filter.frequency.exponentialRampToValueAtTime(180, at + 0.16);
  envelope(gain.gain, at, 0.26, 0.004, 0.22);
  oscillator.connect(filter).connect(gain).connect(bus.input);
  oscillator.start(at);
  oscillator.stop(at + 0.3);
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

// Three bursts a few milliseconds apart: hands, not a drum machine.
function clap(audio: Audio, bus: Bus, at: number, level = 0.32) {
  for (const offset of [0, 0.011, 0.023]) noise(audio, bus, at + offset, "bandpass", 1500, level, offset === 0.023 ? 0.16 : 0.02, 0.5);
}

function sweep(audio: Audio, bus: Bus, at: number, seconds: number) {
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  source.buffer = audio.noise;
  source.loop = true;
  filter.type = "bandpass";
  filter.Q.value = 5;
  filter.frequency.setValueAtTime(300, at);
  filter.frequency.exponentialRampToValueAtTime(6000, at + seconds);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.07, at + seconds - 0.02);
  gain.gain.linearRampToValueAtTime(0, at + seconds);
  source.connect(filter).connect(gain);
  gain.connect(bus.input);
  gain.connect(bus.reverbSend);
  source.start(at);
  source.stop(at + seconds + 0.05);
}

// Surface noise under the quiet bars, so the intro and the credits sound like a record in a bar.
function vinyl(audio: Audio, bus: Bus, at: number, seconds: number) {
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  source.buffer = audio.noise;
  source.loop = true;
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  filter.Q.value = 0.4;
  gain.gain.setValueAtTime(0.01, at);
  gain.gain.setValueAtTime(0.01, at + seconds);
  gain.gain.linearRampToValueAtTime(0, at + seconds + 0.05);
  source.connect(filter).connect(gain).connect(bus.input);
  source.start(at, Math.random() * 0.5);
  source.stop(at + seconds + 0.06);
  for (let pop = 0; pop < 5; pop++) noise(audio, bus, at + Math.random() * seconds, "highpass", 2500, 0.02 + Math.random() * 0.04, 0.004);
}

// The drop: a long splash of bright noise and a sub hit, on the first beat of the title.
function crash(audio: Audio, bus: Bus, at: number) {
  noise(audio, bus, at, "highpass", 5000, 0.14, 1.8, 0.8);
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.frequency.setValueAtTime(80, at);
  oscillator.frequency.exponentialRampToValueAtTime(34, at + 0.8);
  envelope(gain.gain, at, 0.7, 0.004, 1.2);
  oscillator.connect(gain).connect(bus.input);
  oscillator.start(at);
  oscillator.stop(at + 1.3);
}

function playLoungeStep(audio: Audio, bus: Bus, step: number, at: number) {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const inBar = step % STEPS_PER_BAR;
  // Sections can start mid-bar (the one beat of silence before the drop), so match on the step, not the bar.
  const position = step / STEPS_PER_BAR;
  const section = SECTIONS.find((candidate) => position >= candidate.from && position < candidate.to);
  if (!section) return;
  const chord = PROGRESSION[bar % PROGRESSION.length];
  const swung = at + (inBar % 2 === 1 ? SWING_SECONDS : 0);

  if (bar === MARKS.drop && inBar === 0) crash(audio, bus, at);
  if (inBar === 0) {
    if (section.pad) pad(audio, bus, at, chord, BAR_SECONDS, Boolean(section.kick));
    if (!section.kick) vinyl(audio, bus, at, BAR_SECONDS);
    // Without the kick the Rhodes plays whole chords instead of stabs, so quiet bars still move.
    if (!section.kick && !section.roll) for (const tone of chord.tones) electricPiano(audio, bus, at, tone, 0.045, BAR_SECONDS * 0.9);
    if (section.sweep && bar === section.from) sweep(audio, bus, at, BAR_SECONDS * (section.to - section.from));
  }
  const onBeat = inBar % 4 === 0;
  if (section.kick && onBeat) kick(audio, bus, at);
  if (section.clap && (inBar === 4 || inBar === 12)) clap(audio, bus, at);
  if (section.hats && inBar % 4 === 2) noise(audio, bus, at, "highpass", 8000, 0.08, section.openHats ? 0.22 : 0.06);
  if (section.hats && inBar % 2 === 1) noise(audio, bus, swung, "highpass", 9500, 0.025, 0.03);
  if (section.shaker) noise(audio, bus, swung, "bandpass", 6500, inBar % 2 === 0 ? 0.01 : 0.02, 0.035);
  if (section.bass) {
    const note = BASS_STEPS.find(([position]) => position === inBar);
    if (note) bass(audio, bus, at, chord.bass * note[1]);
  }
  if (section.stabs && STAB_STEPS.includes(inBar)) for (const tone of chord.tones) electricPiano(audio, bus, swung, tone, 0.04, 0.35);
  if (section.hook) {
    const note = HOOK[bar % 2].find(([position]) => position === inBar);
    if (note) mallet(audio, bus, note[0] % 2 === 1 ? swung : at, note[1], 0.11);
  }
  // A clap roll that tightens and rises into the silence before the drop.
  if (section.roll) {
    const stepsLeft = Math.round((MARKS.smash - position) * STEPS_PER_BAR);
    const every = stepsLeft > 8 ? 4 : stepsLeft > 4 ? 2 : 1;
    if (stepsLeft % every === 0) clap(audio, bus, at, 0.08 + clamp01(1 - stepsLeft / STEPS_PER_BAR) * 0.25);
  }
}

export const LOUNGE_ARRANGEMENT: Arrangement = {
  stepSeconds: STEP_SECONDS,
  totalSteps: TOTAL_BARS * STEPS_PER_BAR,
  playStep: playLoungeStep,
  pluck: (audio, bus, at, frequency, strength) => electricPiano(audio, bus, at, frequency, 0.05 + strength * 0.08, 1.4),
};
