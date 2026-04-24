import { highlight, site, type Role } from "@/lib/content";
import { SectionHead } from "./SectionHead";

function RoleCompact({ role }: { role: Role }) {
  return (
    <article className="role role--compact">
      <div className="role-date">{role.dateRange}</div>
      <div className="role-body">
        <h3>{role.company}</h3>
        <div className="title">{role.title}</div>
        {role.context ? <p className="ctx">{role.context}</p> : null}
      </div>
    </article>
  );
}

function RoleFull({ role }: { role: Role }) {
  return (
    <article className="role">
      <div className="role-date">{role.dateRange}</div>
      <div className="role-body">
        <h3>
          {role.company}
          {role.titleSuffix ? (
            <span className="exit">{role.titleSuffix}</span>
          ) : null}
        </h3>
        <div className="title">{role.title}</div>
        {role.context ? <p className="ctx">{role.context}</p> : null}
        {role.achievements && role.achievements.length > 0 ? (
          <ul className="ach">
            {role.achievements.map((a) => (
              <li key={a.name}>
                <div className="n">{a.name}</div>
                <div
                  className="d"
                  dangerouslySetInnerHTML={{ __html: highlight(a.desc) }}
                />
                <div className="y">{a.year}</div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

export function Experience() {
  return (
    <section id="experience" className="sec">
      <SectionHead numeral="IV">
        <em>Experience</em>
      </SectionHead>
      {site.experience.map((role, i) =>
        role.compact ? (
          <RoleCompact key={i} role={role} />
        ) : (
          <RoleFull key={i} role={role} />
        ),
      )}
    </section>
  );
}
