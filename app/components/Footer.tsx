import { Reveal } from "./Reveal";

export function Footer() {
  // Static export: evaluated at build time, so this stays current on each deploy.
  const year = new Date().getFullYear();
  return (
    <Reveal as="footer" className="foot">
      <span>© Juan Figuera · {year}</span>
    </Reveal>
  );
}
