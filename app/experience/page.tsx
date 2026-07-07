import Link from "next/link";
import type { Metadata } from "next";
import { Experience } from "@/app/components/Experience";
import { Footer } from "@/app/components/Footer";
import { Reveal } from "@/app/components/Reveal";

export const metadata: Metadata = {
  title: "Experience — Juan Figuera",
  description:
    "Juan Figuera's professional experience: Director of Product Management at American Express Digital Labs, co-founder and CTO of HarvestYield (acquired), and earlier roles at Daily Burn, Deutsche Bank, and Tyco Electronics.",
  alternates: { canonical: "/experience/" },
};

export default function ExperiencePage() {
  return (
    <div className="wrap">
      <Reveal as="header" className="head">
        <Link href="/" className="name">
          Juan Figuera
        </Link>
        <Link href="/" className="head-back">
          ← Home
        </Link>
      </Reveal>

      <Reveal>
        <Experience />
      </Reveal>

      <Footer />
    </div>
  );
}
