import { highlight, site } from "@/lib/content";
import { SectionHead } from "./SectionHead";

export function Projects() {
  return (
    <section id="projects" className="sec">
      <SectionHead numeral="III">Projects</SectionHead>
      {site.projects.map((p, i) => (
        <article key={i} className="project">
          <div className={`label${p.live ? " live" : ""}`}>{p.label}</div>
          <div className="project-body">
            <h3>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.title} <span className="arrow">↗</span>
              </a>
            </h3>
            <div className="sub">{p.sub}</div>
            <p dangerouslySetInnerHTML={{ __html: highlight(p.desc) }} />
            <div className="tags">
              {p.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
              <a
                className="project-url"
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.urlLabel}
              </a>
            </div>
          </div>
          <div className="project-date">{p.date}</div>
        </article>
      ))}
    </section>
  );
}
