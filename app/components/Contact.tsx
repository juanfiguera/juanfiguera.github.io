import { site } from "@/lib/content";
import { SectionHead } from "./SectionHead";

export function Contact() {
  return (
    <section id="contact" className="sec">
      <SectionHead numeral="V">
        Say <em>hi</em>
      </SectionHead>
      <p className="contact-line">
        Always looking to meet <em className="shu">interesting</em> people!
      </p>
      <div className="contact-links">
        <a href={`mailto:${site.email}`}>
          <span className="k">Email</span>
          <span className="v">{site.email}</span>
          <span className="arr">↗</span>
        </a>
        <a href={site.linkedin} target="_blank" rel="noopener noreferrer">
          <span className="k">LinkedIn</span>
          <span className="v">/in/juanfiguera</span>
          <span className="arr">↗</span>
        </a>
        <a href={site.github} target="_blank" rel="noopener noreferrer">
          <span className="k">GitHub</span>
          <span className="v">{site.githubLabel}</span>
          <span className="arr">↗</span>
        </a>
        <a href={site.x} target="_blank" rel="noopener noreferrer">
          <span className="k">X</span>
          <span className="v">{site.xLabel}</span>
          <span className="arr">↗</span>
        </a>
      </div>
    </section>
  );
}
