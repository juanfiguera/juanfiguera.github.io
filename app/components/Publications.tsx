import { site } from "@/lib/content";
import { SectionHead } from "./SectionHead";

export function Publications() {
  return (
    <section id="publications" className="sec">
      <SectionHead>Publications</SectionHead>
      {site.publications.map((pub) => (
        <article key={pub.url} className="pub">
          <div className="pub-meta">
            {pub.venue} {pub.year}
          </div>
          <div>
            <h3>
              <a href={pub.url} target="_blank" rel="noopener noreferrer">
                {pub.title} <span className="arrow">↗</span>
              </a>
            </h3>
            <div className="pub-cite">
              {pub.authors}. {pub.identifier}
            </div>
            <p>{pub.desc}</p>
            <a
              className="pub-url"
              href={pub.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {pub.urlLabel}
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}
