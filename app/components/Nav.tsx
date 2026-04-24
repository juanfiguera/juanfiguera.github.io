const items = [
  { href: "#about", label: "About" },
  { href: "#notes", label: "Notes" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Say hi" },
];

export function Nav() {
  return (
    <nav className="head-nav" aria-label="Sections">
      {items.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
