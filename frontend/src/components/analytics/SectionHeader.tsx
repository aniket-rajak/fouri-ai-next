"use client";

import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function SectionHeader({ title, description, children }: Props) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4 mt-8">
      <div>
        <h2 className="text-lg font-bold text-[#f5f5f7]">{title}</h2>
        {description && (
          <p className="text-xs text-[#888899] mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
