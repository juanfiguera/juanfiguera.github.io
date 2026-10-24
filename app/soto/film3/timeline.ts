import type { Move } from "./look";

// Lounge house tempo; the cuts and the score both count in these bars.
export const BPM = 120;
export const BAR_SECONDS = (60 / BPM) * 4;

export type PhotoId =
  | "penetrable-looking-up"
  | "museo-soto-facade"
  | "museo-soto-yellow-work"
  | "penetrable-amarillo-2"
  | "esfera-japon"
  | "esfera-caracas-night"
  | "soto-inauguration-1973"
  | "soto-wolleh"
  | "soto-2002";

export type Photo = { id: PhotoId; work: string; place: string; author: string; license: string; page: string };

// Every photo is openly licensed on Wikimedia Commons. The works shown are permanently installed in Venezuela;
// the rest are photographs of Soto himself.
export const PHOTOS: Record<PhotoId, Photo> = {
  "penetrable-looking-up": {
    id: "penetrable-looking-up",
    work: "Penetrable",
    place: "Museo Soto, Ciudad Bolívar",
    author: "Gabriel S. Delgado C.",
    license: "CC BY 2.0",
    page: "https://commons.wikimedia.org/wiki/File:Penetrable_(2866896338).jpg",
  },
  "museo-soto-facade": {
    id: "museo-soto-facade",
    work: "Museo de Arte Moderno Jesús Soto",
    place: "Ciudad Bolívar",
    author: "Lizsaortiz",
    license: "CC BY-SA 3.0",
    page: "https://commons.wikimedia.org/wiki/File:Museo_Jesus_Soto.JPG",
  },
  "museo-soto-yellow-work": {
    id: "museo-soto-yellow-work",
    work: "Suspended rods",
    place: "Museo Soto, Ciudad Bolívar",
    author: "Guillermo Ramos Flamerich",
    license: "CC BY 2.5",
    page: "https://commons.wikimedia.org/wiki/File:Soto_Museum_2.jpg",
  },
  "penetrable-amarillo-2": {
    id: "penetrable-amarillo-2",
    work: "Penetrable amarillo",
    place: "Museo Soto, Ciudad Bolívar",
    author: "Gabriel S. Delgado C.",
    license: "CC BY 2.0",
    page: "https://commons.wikimedia.org/wiki/File:Jugando_entre_Fideos_Playing_into_noodles_(3218308247).jpg",
  },
  "esfera-japon": {
    id: "esfera-japon",
    work: "Esfera Japón, 1991",
    place: "Museo Soto, Ciudad Bolívar",
    author: "TainaHijadeDios",
    license: "CC BY-SA 3.0",
    page: "https://commons.wikimedia.org/wiki/File:%22Esfera_Jap%C3%B3n%22_del_artista_venezolano_Jes%C3%BAs_Soto.JPG",
  },
  "esfera-caracas-night": {
    id: "esfera-caracas-night",
    work: "Esfera Caracas, 1992",
    place: "Caracas, at night",
    author: "Eduardo.wiki.ve",
    license: "CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:Caracas_20150125_372.jpg",
  },
  "soto-inauguration-1973": {
    id: "soto-inauguration-1973",
    work: "Soto opens his museum",
    place: "Ciudad Bolívar, August 1973",
    author: "Oficina Central de Información de Venezuela",
    license: "CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:1973._Agosto_25._Inauguraci%C3%B3n_Museo_de_Arte_Moderno_Jes%C3%BAs_Soto_de_Ciudad_Bol%C3%ADvar.jpg",
  },
  "soto-wolleh": {
    id: "soto-wolleh",
    work: "Jesús Rafael Soto",
    place: "Portrait",
    author: "Lothar Wolleh",
    license: "CC BY-SA 3.0",
    page: "https://commons.wikimedia.org/wiki/File:Jesus_Rafael_Soto_by_Lothar_Wolleh.jpg",
  },
  "soto-2002": {
    id: "soto-2002",
    work: "Jesús Rafael Soto",
    place: "2002",
    author: "Audio cepeda",
    license: "CC BY-SA 3.0",
    page: "https://commons.wikimedia.org/wiki/File:JES%C3%9AS_SOTO-_Artista_pl%C3%A1stico.jpg",
  },
};

export type Quote = { text: string; source: string; url: string };

// Soto's own words, each checked against the page it is cited from. English is the foundation's
// translation unless the source says otherwise.
const SOTO_BIOGRAPHY = "https://jesus-soto.com/wp-content/uploads/2021/09/Soto-Biography-EN.pdf";
export const QUOTES = {
  motor: {
    text: "For a motor, I have never used anything but the eye.",
    source: "El Nacional, Caracas, 1966",
    url: SOTO_BIOGRAPHY,
  },
  nights: {
    text: "I played from 11 pm to 5 am, slept until 2 pm, then painted until 8 pm. That's how I lived for ten years.",
    source: "On Paris. Le Nouvel Adam, 1968",
    url: SOTO_BIOGRAPHY,
  },
  light: {
    text: "Taking an element, a line, a bit of wood or metal, and transforming it into pure light…",
    source: "El Nacional, Caracas, 1966",
    url: SOTO_BIOGRAPHY,
  },
  motion: {
    text: "My work is in motion, and that makes all the difference.",
    source: "El Nacional, Caracas, 1966",
    url: SOTO_BIOGRAPHY,
  },
  inside: {
    text: "I wondered what would happen if I could put myself inside the vibration.",
    source: "Conversaciones con Jesús Soto, via Centre Pompidou",
    url: "https://www.centrepompidou.fr/fr/ressources/oeuvre/cajzxGK",
  },
  viewer: {
    text: "For me the work of art does not exist independently of the viewer.",
    source: "Journal de Genève, 1970",
    url: SOTO_BIOGRAPHY,
  },
  participants: {
    text: "…we are not spectators, we are participants!",
    source: "Journal de Genève, 1970",
    url: SOTO_BIOGRAPHY,
  },
  universe: {
    text: "For me, art is a science, a way of knowing the universe.",
    source: "Journal de Genève, 1970",
    url: SOTO_BIOGRAPHY,
  },
} satisfies Record<string, Quote>;

export type Clip = { id: string; work: string; place: string; author: string; license: string; page: string; start: number };

// Openly licensed footage, trimmed from the 1080p uploads and re-encoded into public/soto/film/clips.
// The footage license covers the filming; these two Penetrables were temporary shows in Los Angeles and Tokyo.
export const CLIPS: Record<string, Clip> = {
  "penetrable-blue-up": {
    id: "penetrable-blue-up",
    work: "Pénétrable BBL Bleu",
    place: "Espace Louis Vuitton, Tokyo",
    author: "MIYAGAYAOOTAHARA",
    license: "CC BY 3.0",
    page: "https://www.youtube.com/watch?v=ZWXg05nn1ZA",
    start: 0,
  },
  "penetrable-yellow-walk": {
    id: "penetrable-yellow-walk",
    work: "Penetrable, 1990",
    place: "LACMA, Los Angeles",
    author: "Matt Albright",
    license: "CC BY 3.0",
    page: "https://www.youtube.com/watch?v=odwDx-AAL_8",
    start: 0,
  },
  "penetrable-blue-wide": {
    id: "penetrable-blue-wide",
    work: "Pénétrable BBL Bleu",
    place: "Espace Louis Vuitton, Tokyo",
    author: "MIYAGAYAOOTAHARA",
    license: "CC BY 3.0",
    page: "https://www.youtube.com/watch?v=ZWXg05nn1ZA",
    start: 0,
  },
};

type Spec =
  | { kind: "photo"; photo: PhotoId; move: Move; note?: string }
  | { kind: "portrait"; photo: PhotoId }
  | { kind: "clip"; clip: string; note?: string }
  | { kind: "card"; text: string; quote: Quote; attribute: boolean }
  | { kind: "lines"; quote: Quote }
  | { kind: "black" }
  | { kind: "credits" };

export type Segment = Spec & { from: number; to: number };

// Slow and in one direction only: a gentle push in, never a zoom fighting a pan.
const drift = (fromX: number, fromY: number, toX: number, toY: number, zoomFrom = 1.03, zoomTo = 1.1): Move => ({
  zoomFrom,
  zoomTo,
  fromX,
  fromY,
  toX,
  toY,
});

const card = (quote: Quote, text = quote.text, attribute = true): Spec => ({ kind: "card", text, quote, attribute });

// The title poster shows before play only. It is not in the film, so pressing play never repeats it.
export const POSTER = { photo: "penetrable-looking-up" as PhotoId, move: drift(0.5, 0.5, 0.5, 0.5, 1.04, 1.04) };

type Mark = "breakdown" | "pulse" | "rush" | "smash" | "drop" | "coda" | "credits";

// Trailer grammar on house phrasing: the breakdown, the second groove and the drop each land on a
// four-bar line, so the music turns exactly where the picture does. No image is used twice. Lengths are in bars.
const SEQUENCE: [number, Spec, Mark?][] = [
  [3, { kind: "photo", photo: "museo-soto-facade", move: drift(0.52, 0.5, 0.48, 0.5), note: "His hometown museum" }],
  [3, { kind: "photo", photo: "soto-inauguration-1973", move: drift(0.5, 0.45, 0.5, 0.4, 1.02, 1.08) }],
  [2, card(QUOTES.motor)],
  [2.5, { kind: "clip", clip: "penetrable-blue-up" }],
  [3, card(QUOTES.nights)],
  [2.5, { kind: "portrait", photo: "soto-wolleh" }],
  [2.5, { kind: "photo", photo: "museo-soto-yellow-work", move: drift(0.5, 0.52, 0.5, 0.48) }],
  [2, card(QUOTES.light)],
  [2.5, { kind: "photo", photo: "penetrable-amarillo-2", move: drift(0.44, 0.5, 0.52, 0.5) }],
  [2.5, card(QUOTES.viewer)],
  [2.5, { kind: "photo", photo: "esfera-japon", move: drift(0.5, 0.5, 0.5, 0.5, 1.0, 1.08) }],
  [4, { kind: "lines", quote: QUOTES.inside }, "breakdown"],
  [2, { kind: "clip", clip: "penetrable-yellow-walk" }, "pulse"],
  [1, card(QUOTES.participants, "…we are not spectators,", false)],
  [2, { kind: "clip", clip: "penetrable-blue-wide" }],
  [1, card(QUOTES.participants, "we are participants!")],
  [1.75, { kind: "photo", photo: "esfera-caracas-night", move: drift(0.3, 0.55, 0.36, 0.55, 1.05, 1.2) }, "rush"],
  // One beat of black and silence: long enough to feel the drop coming, short enough not to look broken.
  [0.25, { kind: "black" }, "smash"],
  [4, { kind: "photo", photo: "soto-2002", move: drift(0.42, 0.5, 0.42, 0.45, 1.02, 1.1) }, "drop"],
  [4, card(QUOTES.universe), "coda"],
  [12, { kind: "credits" }, "credits"],
];

const built = SEQUENCE.reduce<{ segments: Segment[]; marks: Partial<Record<Mark, number>>; bar: number }>(
  (state, [length, spec, mark]) => ({
    segments: [...state.segments, { ...spec, from: state.bar, to: state.bar + length }],
    marks: mark ? { ...state.marks, [mark]: state.bar } : state.marks,
    bar: state.bar + length,
  }),
  { segments: [], marks: {}, bar: 0 },
);

export const SEGMENTS: Segment[] = built.segments;
export const MARKS = built.marks as Record<Mark, number>;
export const TOTAL_BARS = built.bar;
export const TOTAL_SECONDS = TOTAL_BARS * BAR_SECONDS;

export function segmentAt(bar: number): { segment: Segment; index: number } {
  const index = SEGMENTS.findIndex((segment) => bar < segment.to);
  const safeIndex = index === -1 ? SEGMENTS.length - 1 : index;
  return { segment: SEGMENTS[safeIndex], index: safeIndex };
}
