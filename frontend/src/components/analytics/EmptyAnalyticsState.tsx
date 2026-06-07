"use client";

import { BarChart3 } from "lucide-react";

interface Props {
  message?: string;
}

export default function EmptyAnalyticsState({ message = "No data available yet. Data will appear as users interact with the platform." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 size={40} className="text-[#444455] mb-3" />
      <p className="text-sm text-[#666677] max-w-md">{message}</p>
    </div>
  );
}
