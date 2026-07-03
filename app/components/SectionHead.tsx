import type { ReactNode } from "react";

type SectionHeadProps = {
  children: ReactNode;
};

export function SectionHead({ children }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <h2>{children}</h2>
    </div>
  );
}
