import type { ReactNode } from "react";

type SectionHeadProps = {
  numeral: string;
  children: ReactNode;
};

export function SectionHead({ numeral, children }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <div className="tick">
        <span className="num">{numeral}</span>
        <span className="mark" aria-hidden="true" />
      </div>
      <h2>{children}</h2>
    </div>
  );
}
