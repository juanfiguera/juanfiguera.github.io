import { markEm, site } from "@/lib/content";
import { SectionHead } from "./SectionHead";

export function About() {
  return (
    <section id="about" className="sec about">
      <SectionHead numeral="I">About</SectionHead>
      {site.about.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: markEm(p) }} />
      ))}
    </section>
  );
}
