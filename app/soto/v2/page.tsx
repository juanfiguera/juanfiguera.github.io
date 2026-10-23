import Link from "next/link";
import type { Metadata } from "next";
import { SotoFilm } from "../SotoFilm";

export const metadata: Metadata = {
  title: "Soto, in 60 seconds (v2) · Juan Figuera",
  description: "The second version of the Soto film, kept for comparison.",
  robots: { index: false },
};

export default function SotoFilmV2Page() {
  return (
    <div className="wrap">
      <header className="head">
        <Link href="/soto/" className="head-back">
          ← Homenaje a Soto
        </Link>
      </header>
      <section className="sec soto-piece">
        <div className="soto-label">
          <span className="soto-num">v2</span>
          <h2>Soto, in 60 seconds</h2>
        </div>
        <SotoFilm />
      </section>
    </div>
  );
}
