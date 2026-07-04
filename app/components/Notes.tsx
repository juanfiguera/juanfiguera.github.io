import Link from "next/link";
import { formatNoteDate, highlight, site } from "@/lib/content";
import { SectionHead } from "./SectionHead";

export function Notes() {
  const notes = [...site.notes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section id="notes" className="sec">
      <SectionHead>Notes</SectionHead>
      {notes.map((n) => {
        const isPreview = Boolean(n.excerpt && n.slug);
        const paragraphs = isPreview
          ? [n.excerpt as string]
          : Array.isArray(n.body)
            ? n.body
            : n.body
              ? [n.body]
              : [];

        return (
          <article key={n.slug ?? n.date + n.title} className="note">
            <div className="date">{formatNoteDate(n.date)}</div>
            <div>
              <h4>
                {isPreview ? (
                  <Link href={`/notes/${n.slug}/`} className="note-title-link">
                    {n.title}
                  </Link>
                ) : (
                  n.title
                )}
              </h4>
              {paragraphs.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: highlight(p) }} />
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
