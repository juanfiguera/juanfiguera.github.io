"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function Reveal({ as: Tag = "div", className, children }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.05 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  const classes = ["reveal", className].filter(Boolean).join(" ");
  return (
    <Tag ref={ref} className={classes}>
      {children}
    </Tag>
  );
}
