import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#e4eaf0]/70">{label}</label>
      )}
      <input
        className={`
          w-full px-3 py-2 rounded-lg text-sm text-[#e4eaf0]
          bg-white/[0.04] border border-white/[0.07]
          placeholder:text-white/30
          focus:outline-none focus:border-[#00e87a]/50 focus:bg-white/[0.06]
          transition-all duration-150
          ${error ? "border-[#ff4d6d]/50" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-[#ff4d6d]">{error}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#e4eaf0]/70">{label}</label>
      )}
      <textarea
        className={`
          w-full px-3 py-2 rounded-lg text-sm text-[#e4eaf0]
          bg-white/[0.04] border border-white/[0.07]
          placeholder:text-white/30
          focus:outline-none focus:border-[#00e87a]/50 focus:bg-white/[0.06]
          transition-all duration-150 resize-none
          ${error ? "border-[#ff4d6d]/50" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-[#ff4d6d]">{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#e4eaf0]/70">{label}</label>
      )}
      <select
        className={`
          w-full px-3 py-2 rounded-lg text-sm text-[#e4eaf0]
          bg-[#0d1117] border border-white/[0.07]
          focus:outline-none focus:border-[#00e87a]/50
          transition-all duration-150
          ${error ? "border-[#ff4d6d]/50" : ""}
          ${className}
        `}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-[#ff4d6d]">{error}</span>}
    </div>
  );
}
