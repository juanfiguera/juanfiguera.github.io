export const BPM = 100;
export const BEAT_SECONDS = 60 / BPM;
export const TOTAL_BEATS = 100;
export const TOTAL_SECONDS = TOTAL_BEATS * BEAT_SECONDS;

export type ShotName =
  | "thread"
  | "river"
  | "posters"
  | "paris"
  | "moire"
  | "vibration"
  | "penetrable"
  | "esfera"
  | "farewell";

export type Caption = { atBeat: number; kicker: string; title: string };

export type Shot = { name: ShotName; startBeat: number; endBeat: number; captions: Caption[] };

// Beats are the unit everywhere so picture cuts and the score can never drift apart.
export const SHOTS: Shot[] = [
  {
    name: "thread",
    startBeat: 0,
    endBeat: 8,
    captions: [{ atBeat: 1, kicker: "1923 · Ciudad Bolívar, Venezuela", title: "It starts with one line." }],
  },
  {
    name: "river",
    startBeat: 8,
    endBeat: 16,
    captions: [{ atBeat: 0.5, kicker: "The Orinoco", title: "He grows up beside a river that never stops moving." }],
  },
  {
    name: "posters",
    startBeat: 16,
    endBeat: 24,
    captions: [{ atBeat: 0.5, kicker: "Age 16", title: "He paints cinema posters." }],
  },
  {
    name: "paris",
    startBeat: 24,
    endBeat: 32,
    captions: [{ atBeat: 0.5, kicker: "1950 · Paris", title: "He wants painting to move." }],
  },
  {
    name: "moire",
    startBeat: 32,
    endBeat: 48,
    captions: [
      { atBeat: 1, kicker: "1955 · Le Mouvement", title: "No motor. You are the motor." },
      { atBeat: 9, kicker: "Move across it", title: "The picture only moves because you do." },
    ],
  },
  {
    name: "vibration",
    startBeat: 48,
    endBeat: 56,
    captions: [{ atBeat: 0.5, kicker: "Vibrations", title: "Solid things start to shimmer." }],
  },
  {
    name: "penetrable",
    startBeat: 56,
    endBeat: 72,
    captions: [
      { atBeat: 1, kicker: "Penetrables", title: "Then he lets you walk inside." },
      { atBeat: 9, kicker: "Steer with your cursor", title: "The work is not finished until you are in it." },
    ],
  },
  {
    name: "esfera",
    startBeat: 72,
    endBeat: 88,
    captions: [
      { atBeat: 1, kicker: "Esfera Caracas", title: "A sphere made only of straight lines." },
    ],
  },
  {
    name: "farewell",
    startBeat: 88,
    endBeat: 100,
    captions: [
      { atBeat: 1, kicker: "1923–2005", title: "Jesús Rafael Soto" },
      { atBeat: 8, kicker: "Ciudad Bolívar · Caracas · Paris", title: "Still moving." },
    ],
  },
];

export function shotAt(beat: number): { shot: Shot; index: number } {
  const index = SHOTS.findIndex((shot) => beat < shot.endBeat);
  const safeIndex = index === -1 ? SHOTS.length - 1 : index;
  return { shot: SHOTS[safeIndex], index: safeIndex };
}
