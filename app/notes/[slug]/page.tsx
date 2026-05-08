import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatNoteDate, highlight, site } from "@/lib/content";
import { Footer } from "@/app/components/Footer";
import { Reveal } from "@/app/components/Reveal";

type NotePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return site.notes
    .filter((n) => n.slug)
    .map((n) => ({ slug: n.slug as string }));
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = site.notes.find((n) => n.slug === slug);
  if (!note) return {};

  const firstBody = Array.isArray(note.body) ? note.body[0] : note.body;
  const description = (note.excerpt ?? firstBody).replace(/<[^>]+>/g, "").slice(0, 200);

  return {
    title: `${note.title} — Juan Figuera`,
    description,
    openGraph: {
      title: note.title,
      description,
      type: "article",
      publishedTime: note.date,
    },
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = site.notes.find((n) => n.slug === slug);
  if (!note) notFound();

  const paragraphs = Array.isArray(note.body) ? note.body : [note.body];

  return (
    <div className="wrap">
      <Reveal as="header" className="head">
        <Link href="/" className="name">
          Juan Figuera
        </Link>
        <Link href="/#notes" className="head-back">
          ← Notes
        </Link>
      </Reveal>

      <Reveal as="article" className="note-page">
        <div className="note-page-meta">{formatNoteDate(note.date)}</div>
        <h1 className="note-page-title">{note.title}</h1>

        {note.youtube && (
          <div className="note-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${note.youtube}`}
              title={`${note.title} — demo`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}

        {paragraphs.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: highlight(p) }} />
        ))}

        {note.links && note.links.length > 0 && (
          <div className="note-links">
            {note.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                <span className="k">{l.label}</span>
                <span className="v">{l.display ?? l.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span>
                <span className="arr">↗</span>
              </a>
            ))}
          </div>
        )}

        <Link href="/#notes" className="note-back">
          ← Back to notes
        </Link>
      </Reveal>

      <Footer />
    </div>
  );
}
