import Link from "next/link";
import type { Metadata } from "next";
import { SotoClip } from "../SotoClip";

export const metadata: Metadata = {
  title: "A life in lines (v1) · Juan Figuera",
  description: "The first version of the Soto clip, kept for comparison.",
  robots: { index: false },
};

export default function SotoClipV1Page() {
  return (
    <div className="wrap">
      <header className="head">
        <Link href="/soto/" className="head-back">
          ← Homenaje a Soto
        </Link>
      </header>
      <section className="sec soto-piece">
        <div className="soto-label">
          <span className="soto-num">v1</span>
          <h2>A life in lines</h2>
        </div>
        <SotoClip />
      </section>
    </div>
  );
}
