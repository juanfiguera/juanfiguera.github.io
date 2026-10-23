import { BEAT_SECONDS, TOTAL_BEATS } from "./timeline";

const STEPS_PER_BEAT = 4;
const LOOKAHEAD_SECONDS = 0.2;
// Gives the first scheduled notes a moment so they are not clipped by the audio thread.
const START_DELAY = 0.06;

type Chord = { root: number; tones: number[] };

// Am, F, C, G: one chord per bar.
const PROGRESSION: Chord[] = [
  { root: 110, tones: [220, 261.63, 329.63, 440] },
  { root: 87.31, tones: [174.61, 220, 261.63, 349.23] },
  { root: 130.81, tones: [196, 261.63, 329.63, 392] },
  { root: 98, tones: [196, 246.94, 293.66, 392] },
];

// Same off-harmonic partials as the Sonoro rods, so the film's plucks sound like the wall on the page.
const ROD_PARTIALS = [
  { ratio: 1, gain: 1, decay: 1.6 },
  { ratio: 2.756, gain: 0.35, decay: 0.7 },
  { ratio: 5.404, gain: 0.12, decay: 0.35 },
];

type Section = {
  from: number;
  to: number;
  kick?: boolean;
  clap?: boolean;
  hats?: 8 | 16;
  bass?: boolean;
  pad?: boolean;
  arp?: 2 | 4;
  pluckOnBeat?: boolean;
  riser?: boolean;
};

// Mirrors the shots in timeline.ts: quiet open, build, drop on the moiré, breakdown inside the Penetrable, drop again.
const SECTIONS: Section[] = [
  { from: 0, to: 8, pluckOnBeat: true },
  { from: 8, to: 16, pad: true, arp: 2 },
  { from: 16, to: 24, kick: true, pad: true, arp: 2, bass: true },
  { from: 24, to: 28, kick: true, clap: true, hats: 8, bass: true, pad: true, arp: 2 },
  { from: 28, to: 32, kick: true, clap: true, hats: 16, bass: true, pad: true, arp: 4, riser: true },
  { from: 32, to: 48, kick: true, clap: true, hats: 16, bass: true, pad: true, arp: 4 },
  { from: 48, to: 56, kick: true, hats: 8, bass: true, pad: true, arp: 2 },
  { from: 56, to: 60, pad: true, arp: 4 },
  { from: 60, to: 64, pad: true, arp: 4, riser: true },
  { from: 64, to: 72, kick: true, clap: true, hats: 16, bass: true, pad: true, arp: 4 },
  { from: 72, to: 88, kick: true, clap: true, hats: 16, bass: true, pad: true, arp: 2 },
  { from: 88, to: 96, pad: true, pluckOnBeat: true },
  { from: 96, to: TOTAL_BEATS },
];

const sectionAt = (beat: number) => SECTIONS.find((section) => beat >= section.from && beat < section.to);

export type Bus = { input: GainNode; reverbSend: GainNode };

export type Audio = {
  context: AudioContext;
  master: DynamicsCompressorNode;
  reverb: ConvolverNode;
  noise: AudioBuffer;
};

export function createNoise(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// A decaying noise burst is a cheap, convincing room without shipping an impulse file.
export function createRoom(context: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6;
  }
  return buffer;
}

export function envelope(gain: AudioParam, at: number, peak: number, attack: number, release: number) {
  gain.setValueAtTime(0.0001, at);
  gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.exponentialRampToValueAtTime(0.0001, at + attack + release);
}

function kick({ context }: Audio, bus: Bus, at: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(160, at);
  oscillator.frequency.exponentialRampToValueAtTime(42, at + 0.14);
  envelope(gain.gain, at, 0.95, 0.003, 0.38);
  oscillator.connect(gain).connect(bus.input);
  oscillator.start(at);
  oscillator.stop(at + 0.45);
}

function noiseHit(audio: Audio, bus: Bus, at: number, type: BiquadFilterType, frequency: number, peak: number, release: number, wet = 0) {
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  source.buffer = audio.noise;
  filter.type = type;
  filter.frequency.value = frequency;
  envelope(gain.gain, at, peak, 0.002, release);
  source.connect(filter).connect(gain).connect(bus.input);
  if (wet > 0) {
    const send = audio.context.createGain();
    send.gain.value = wet;
    gain.connect(send).connect(bus.reverbSend);
  }
  source.start(at, Math.random() * 0.5);
  source.stop(at + release + 0.05);
}

function bass({ context }: Audio, bus: Bus, at: number, frequency: number) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.value = frequency;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, at);
  filter.frequency.exponentialRampToValueAtTime(160, at + 0.22);
  envelope(gain.gain, at, 0.32, 0.005, 0.26);
  oscillator.connect(filter).connect(gain).connect(bus.input);
  oscillator.start(at);
  oscillator.stop(at + 0.32);
}

export function rod({ context }: Audio, bus: Bus, at: number, frequency: number, level: number) {
  for (const partial of ROD_PARTIALS) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency * partial.ratio;
    envelope(gain.gain, at, level * partial.gain, 0.003, partial.decay);
    oscillator.connect(gain);
    gain.connect(bus.input);
    gain.connect(bus.reverbSend);
    oscillator.start(at);
    oscillator.stop(at + partial.decay + 0.05);
  }
}

function pad({ context }: Audio, bus: Bus, at: number, chord: Chord, seconds: number) {
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "lowpass";
  filter.frequency.value = 1100;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.05, at + 0.5);
  gain.gain.setValueAtTime(0.05, at + seconds - 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds + 0.6);
  filter.connect(gain);
  gain.connect(bus.input);
  gain.connect(bus.reverbSend);
  for (const tone of chord.tones.slice(0, 3)) {
    for (const detune of [-9, 9]) {
      const oscillator = context.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = tone;
      oscillator.detune.value = detune;
      oscillator.connect(filter);
      oscillator.start(at);
      oscillator.stop(at + seconds + 0.7);
    }
  }
}

function riser(audio: Audio, bus: Bus, at: number, seconds: number) {
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  source.buffer = audio.noise;
  source.loop = true;
  filter.type = "bandpass";
  filter.Q.value = 3;
  filter.frequency.setValueAtTime(400, at);
  filter.frequency.exponentialRampToValueAtTime(7000, at + seconds);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.18, at + seconds);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds + 0.05);
  source.connect(filter).connect(gain).connect(bus.input);
  source.start(at);
  source.stop(at + seconds + 0.1);
}

function playFilmStep(audio: Audio, bus: Bus, step: number, at: number) {
  const beat = step / STEPS_PER_BEAT;
  const section = sectionAt(beat);
  const chord = PROGRESSION[Math.floor(beat / 4) % PROGRESSION.length];
  const onBeat = step % STEPS_PER_BEAT === 0;
  const sixteenth = step % STEPS_PER_BEAT;

  if (step === 96 * STEPS_PER_BEAT) rod(audio, bus, at, 220, 0.5);
  if (!section) return;

  if (section.riser && step === section.from * STEPS_PER_BEAT) riser(audio, bus, at, (section.to - section.from) * BEAT_SECONDS);
  if (section.pad && step % (STEPS_PER_BEAT * 4) === 0) pad(audio, bus, at, chord, BEAT_SECONDS * 4);
  if (section.kick && onBeat) kick(audio, bus, at);
  if (section.clap && onBeat && Math.floor(beat) % 2 === 1) noiseHit(audio, bus, at, "bandpass", 1600, 0.5, 0.18, 0.4);
  if (section.hats === 8 && sixteenth === 2) noiseHit(audio, bus, at, "highpass", 7500, 0.12, 0.05);
  if (section.hats === 16) noiseHit(audio, bus, at, "highpass", 8000, sixteenth === 2 ? 0.13 : 0.05, 0.04);
  if (section.bass && sixteenth === 2) bass(audio, bus, at, chord.root * (Math.floor(beat) % 2 === 0 ? 1 : 2));
  if (section.pluckOnBeat && onBeat) rod(audio, bus, at, beat % 4 === 3 ? 329.63 : 220, 0.32);
  if (section.arp) {
    const stride = STEPS_PER_BEAT / section.arp;
    if (step % stride !== 0) return;
    const index = Math.floor(step / stride);
    const pattern = [0, 2, 1, 3, 2, 1];
    rod(audio, bus, at, chord.tones[pattern[index % pattern.length]] * 2, 0.14);
  }
}

export function fadeBus(bus: Bus, now: number) {
  bus.input.gain.setTargetAtTime(0.0001, now, 0.03);
  bus.reverbSend.gain.setTargetAtTime(0.0001, now, 0.03);
}

// What a score plays: a step grid plus a voice for the viewer's own plucks.
export type Arrangement = {
  stepSeconds: number;
  totalSteps: number;
  playStep: (audio: Audio, bus: Bus, step: number, at: number) => void;
  pluck: (audio: Audio, bus: Bus, at: number, frequency: number, strength: number) => void;
};

export const FILM_ARRANGEMENT: Arrangement = {
  stepSeconds: BEAT_SECONDS / STEPS_PER_BEAT,
  totalSteps: TOTAL_BEATS * STEPS_PER_BEAT,
  playStep: playFilmStep,
  pluck: (audio, bus, at, frequency, strength) => rod(audio, bus, at, frequency, 0.12 + strength * 0.3),
};

export type Score = ReturnType<typeof createScore>;

// The score owns the clock while sound is on: picture follows audio time, so beats land exactly on cuts.
export function createScore({ stepSeconds, totalSteps, playStep, pluck }: Arrangement) {
  let audio: Audio | null = null;
  let bus: Bus | null = null;
  let enabled = false;
  let clipZero = 0;
  let nextStep = 0;

  const ready = () => (enabled && audio && audio.context.state === "running" ? audio : null);

  const freshBus = (current: Audio) => {
    if (bus) {
      // Notes already queued keep running into a bus that is fading out, so seeks and pauses stay click free.
      const old = bus;
      fadeBus(old, current.context.currentTime);
      setTimeout(() => {
        old.input.disconnect();
        old.reverbSend.disconnect();
      }, 400);
    }
    const input = current.context.createGain();
    const reverbSend = current.context.createGain();
    reverbSend.gain.value = 0.35;
    input.connect(current.master);
    reverbSend.connect(current.reverb);
    bus = { input, reverbSend };
  };

  return {
    async setEnabled(next: boolean) {
      enabled = next;
      if (!audio) {
        const context = new AudioContext();
        const master = context.createDynamicsCompressor();
        master.threshold.value = -14;
        master.ratio.value = 4;
        master.connect(context.destination);
        const reverb = context.createConvolver();
        reverb.buffer = createRoom(context, 2.4);
        const reverbLevel = context.createGain();
        reverbLevel.gain.value = 0.5;
        reverb.connect(reverbLevel).connect(master);
        audio = { context, master, reverb, noise: createNoise(context) };
      }
      if (next) await audio.context.resume();
      else {
        if (bus) fadeBus(bus, audio.context.currentTime);
        bus = null;
        await audio.context.suspend();
      }
    },
    get enabled() {
      return enabled;
    },
    // Re-anchors the score to a clip time after play, seek or unmute.
    sync(clipTime: number) {
      const current = ready();
      nextStep = Math.ceil(clipTime / stepSeconds - 1e-6);
      if (!current) return;
      freshBus(current);
      clipZero = current.context.currentTime + START_DELAY - clipTime;
    },
    silence() {
      const current = ready();
      if (!current || !bus) return;
      fadeBus(bus, current.context.currentTime);
      bus = null;
    },
    // Clip time read from the audio clock, or null when sound is off and the picture keeps its own time.
    clipTime(): number | null {
      const current = ready();
      if (!current || !bus) return null;
      return Math.max(0, current.context.currentTime - clipZero);
    },
    schedule(clipTime: number) {
      const current = ready();
      if (!current || !bus) return;
      while (nextStep < totalSteps && nextStep * stepSeconds < clipTime + LOOKAHEAD_SECONDS) {
        const at = Math.max(current.context.currentTime, clipZero + nextStep * stepSeconds);
        playStep(current, bus, nextStep, at);
        nextStep++;
      }
    },
    // Live notes from the viewer's hand, outside the arrangement.
    pluck(frequency: number, strength: number) {
      const current = ready();
      if (!current) return;
      if (!bus) freshBus(current);
      if (!bus) return;
      pluck(current, bus, current.context.currentTime + 0.005, frequency, strength);
    },
  };
}
