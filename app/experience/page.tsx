import Link from "next/link";
import type { Metadata } from "next";
import { Experience } from "@/app/components/Experience";
import { EducationSection } from "@/app/components/EducationSection";
import { Footer } from "@/app/components/Footer";
import { Reveal } from "@/app/components/Reveal";

export const metadata: Metadata = {
  title: "Experience — Juan Figuera",
  description:
    "Juan Figuera's professional experience and education: Director of Product Management at American Express Digital Labs, co-founder and CTO of HarvestYield (acquired), earlier roles at Daily Burn, Deutsche Bank, and Tyco Electronics, plus degrees from Northeastern University and UMass Lowell.",
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

      <Reveal>
        <EducationSection />
      </Reveal>

      <Footer />
    </div>
  );
}
