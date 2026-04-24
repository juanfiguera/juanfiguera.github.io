import { formatNoteDate, highlight, site } from "@/lib/content";
import { SectionHead } from "./SectionHead";

export function Notes() {
  const notes = [...site.notes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section id="notes" className="sec">
      <SectionHead numeral="II">Notes</SectionHead>
      {notes.map((n) => (
        <article key={n.slug ?? n.date + n.title} className="note">
          <div className="date">{formatNoteDate(n.date)}</div>
          <div>
            <h4>{n.title}</h4>
            <p dangerouslySetInnerHTML={{ __html: highlight(n.body) }} />
          </div>
        </article>
      ))}
    </section>
  );
}
