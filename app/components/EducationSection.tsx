import { site } from "@/lib/content";
import { SectionHead } from "./SectionHead";

export function EducationSection() {
  return (
    <section id="education" className="sec">
      <SectionHead>Education</SectionHead>
      {site.education.map((edu) => (
        <article key={edu.degree} className="role role--compact">
          <div className="role-date">{edu.date}</div>
          <div className="role-body">
            <h3>
              <span className="co">{edu.school}</span>
              <span className="loc">{edu.location}</span>
            </h3>
            <div className="title">{edu.degree}</div>
          </div>
        </article>
      ))}
    </section>
  );
}
