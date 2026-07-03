import type { ReactNode } from "react";

type SectionHeadProps = {
  children: ReactNode;
};

export function SectionHead({ children }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <div className="tick">
        <span className="mark" aria-hidden="true" />
      </div>
      <h2>{children}</h2>
    </div>
  );
}
