import type { Move } from "./look";

export const BPM = 116;
export const BAR_SECONDS = (60 / BPM) * 4;
export const TOTAL_BARS = 48;
export const TOTAL_SECONDS = TOTAL_BARS * BAR_SECONDS;

export type PhotoId =
  | "penetrable-looking-up"
  | "pearl-rain-pampatar"
  | "ucv-pre-penetrable-1957"
  | "museo-soto-facade"
  | "museo-soto-yellow-work"
  | "penetrable-amarillo-2"
  | "esfera-japon"
  | "penetrable-amarillo-1"
  | "casm-esfera-caracas"
  | "esfera-caracas-1"
  | "esfera-caracas-night";

export type Photo = { id: PhotoId; work: string; place: string; author: string; license: string; page: string };

// Every photo is openly licensed on Wikimedia Commons and shows a work permanently installed in Venezuela.
export const PHOTOS: Record<PhotoId, Photo> = {
  "penetrable-looking-up": {
    id: "penetrable-looking-up",
    work: "Penetrable",
    place: "Museo Soto, Ciudad Bolívar",
    author: "Gabriel S. Delgado C.",
    license: "CC BY 2.0",
    page: "https://commons.wikimedia.org/wiki/File:Penetrable_(2866896338).jpg",
  },
  "pearl-rain-pampatar": {
    id: "pearl-rain-pampatar",
    work: "La Perla del Caribe",
    place: "Pampatar, Isla de Margarita",
    author: "Javier D. Volcán R.",
    license: "CC BY 2.0",
    page: "https://commons.wikimedia.org/wiki/File:Pearl_Rain.jpg",
  },
  "ucv-pre-penetrable-1957": {
    id: "ucv-pre-penetrable-1957",
    work: "Untitled, 1957",
    place: "Ciudad Universitaria, Caracas",
    author: "GermanX",
    license: "CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:UCV_2015-236_Escultura_de_Jes%C3%BAs_Soto,_1957.jpg",
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
  "penetrable-amarillo-1": {
    id: "penetrable-amarillo-1",
    work: "Penetrable amarillo",
    place: "Museo Soto, Ciudad Bolívar",
    author: "Guillermo Ramos Flamerich",
    license: "CC BY 2.5",
    page: "https://commons.wikimedia.org/wiki/File:Soto_Museum_3.jpg",
  },
  "casm-esfera-caracas": {
    id: "casm-esfera-caracas",
    work: "Virtual sphere",
    place: "Centro de Acción Social por la Música, Caracas",
    author: "Guillermo Ramos Flamerich",
    license: "CC BY-SA 3.0",
    page: "https://commons.wikimedia.org/wiki/File:CASM_1.jpg",
  },
  "esfera-caracas-1": {
    id: "esfera-caracas-1",
    work: "Esfera Caracas, 1992",
    place: "Autopista Francisco Fajardo, Caracas",
    author: "AlejandraLopez23",
    license: "CC BY 3.0",
    page: "https://commons.wikimedia.org/wiki/File:Esfera_Caracas_%22Jesus_Soto%22.jpg",
  },
  "esfera-caracas-night": {
    id: "esfera-caracas-night",
    work: "Esfera Caracas, 1992",
    place: "Caracas, at night",
    author: "Eduardo.wiki.ve",
    license: "CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:Caracas_20150125_372.jpg",
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

export type Segment =
  | { kind: "title"; from: number; to: number; photo: PhotoId; move: Move }
  | { kind: "photo"; from: number; to: number; photo: PhotoId; move: Move; quote?: Quote; note?: string }
  | { kind: "lines"; from: number; to: number; quote: Quote }
  | { kind: "credits"; from: number; to: number };

const push = (fromX: number, fromY: number, toX: number, toY: number, zoomFrom = 1.05, zoomTo = 1.2): Move => ({
  zoomFrom,
  zoomTo,
  fromX,
  fromY,
  toX,
  toY,
});

// In bars. The music changes on the same bars (see SECTIONS in lounge.ts).
export const SEGMENTS: Segment[] = [
  { kind: "title", from: 0, to: 4, photo: "penetrable-looking-up", move: push(0.5, 0.55, 0.5, 0.45, 1.25, 1.05) },
  { kind: "photo", from: 4, to: 8, photo: "pearl-rain-pampatar", move: push(0.3, 0.5, 0.7, 0.5), quote: QUOTES.motor },
  { kind: "photo", from: 8, to: 10, photo: "ucv-pre-penetrable-1957", move: push(0.45, 0.5, 0.55, 0.45), note: "Caracas, 1957. He is already in Paris, making space vibrate." },
  { kind: "photo", from: 10, to: 12, photo: "museo-soto-facade", move: push(0.55, 0.5, 0.45, 0.5), note: "His hometown museum, opened 1973." },
  { kind: "photo", from: 12, to: 16, photo: "museo-soto-yellow-work", move: push(0.5, 0.6, 0.5, 0.4), quote: QUOTES.nights },
  { kind: "photo", from: 16, to: 20, photo: "penetrable-amarillo-2", move: push(0.35, 0.5, 0.6, 0.5, 1.1, 1.3), quote: QUOTES.light },
  { kind: "photo", from: 20, to: 24, photo: "esfera-japon", move: push(0.5, 0.5, 0.5, 0.5, 1.0, 1.25), quote: QUOTES.motion },
  { kind: "lines", from: 24, to: 28, quote: QUOTES.inside },
  { kind: "photo", from: 28, to: 32, photo: "penetrable-amarillo-1", move: push(0.5, 0.35, 0.5, 0.6), quote: QUOTES.viewer },
  { kind: "photo", from: 32, to: 34, photo: "casm-esfera-caracas", move: push(0.65, 0.5, 0.6, 0.45, 1.1, 1.25) },
  { kind: "photo", from: 34, to: 36, photo: "esfera-caracas-1", move: push(0.35, 0.55, 0.3, 0.5, 1.05, 1.2) },
  { kind: "photo", from: 36, to: 40, photo: "esfera-caracas-night", move: push(0.25, 0.55, 0.3, 0.55, 1.05, 1.3), quote: QUOTES.participants },
  { kind: "photo", from: 40, to: 44, photo: "penetrable-looking-up", move: push(0.5, 0.5, 0.5, 0.5, 1.05, 1.4), quote: QUOTES.universe },
  { kind: "credits", from: 44, to: TOTAL_BARS },
];

export function segmentAt(bar: number): { segment: Segment; index: number } {
  const index = SEGMENTS.findIndex((segment) => bar < segment.to);
  const safeIndex = index === -1 ? SEGMENTS.length - 1 : index;
  return { segment: SEGMENTS[safeIndex], index: safeIndex };
}
