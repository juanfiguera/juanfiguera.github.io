"use client";

import { useMemo, useState } from "react";
import {
  highlight,
  projectCategories,
  site,
  type ProjectCategory,
} from "@/lib/content";
import { SectionHead } from "./SectionHead";

type Filter = "All" | ProjectCategory;

export function Projects() {
  const [filter, setFilter] = useState<Filter>("All");

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["All", site.projects.length]]);
    for (const category of projectCategories) {
      map.set(
        category,
        site.projects.filter((p) => p.category === category).length,
      );
    }
    return map;
  }, []);

  const pills: Filter[] = ["All", ...projectCategories];
  const visible =
    filter === "All"
      ? site.projects
      : site.projects.filter((p) => p.category === filter);

  return (
    <section id="projects" className="sec">
      <SectionHead>Projects</SectionHead>

      <div className="project-filters" role="tablist" aria-label="Filter projects by category">
        {pills.map((pill) => (
          <button
            key={pill}
            type="button"
            role="tab"
            aria-selected={filter === pill}
            className={`project-filter${filter === pill ? " active" : ""}`}
            onClick={() => setFilter(pill)}
          >
            {pill}
            <span className="count">{counts.get(pill)}</span>
          </button>
        ))}
      </div>

      {visible.map((p) => (
        <article key={p.title} className="project">
          <div className="project-date">{p.date}</div>
          <div className="project-body">
            <h3>
              <a href={p.url} target="_blank" rel="noopener noreferrer">
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
        </article>
      ))}
    </section>
  );
}
