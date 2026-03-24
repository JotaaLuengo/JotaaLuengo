import { useState } from "react";

interface ReportSectionProps {
  title: string;
  content: string;
}

export function ReportSection({ title, content }: ReportSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-white/[0.07] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-semibold text-[#00e87a] text-sm uppercase tracking-wide">
          {title}
        </span>
        <span className="text-white/30 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-[#e4eaf0]/80 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}
