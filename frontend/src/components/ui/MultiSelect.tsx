"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

export default function MultiSelect({
  options,
  selectedIds,
  onChange,
  error,
  label,
  required,
  placeholder = "Search...",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id],
    );
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((i) => i !== id));
  };

  const selectedOptions = options.filter((o) => selectedIds.includes(o.id));

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs text-[#888899] mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl border text-sm text-left transition-all cursor-pointer ${
          error
            ? "border-red-500/40 bg-red-500/5"
            : "border-white/10 bg-[#08080f] hover:border-white/20"
        }`}
      >
        <div className="flex-1 flex flex-wrap gap-1.5">
          {selectedOptions.length === 0 && (
            <span className="text-[#555566] text-sm py-0.5">
              Select categories...
            </span>
          )}
          {selectedOptions.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/20"
            >
              {o.name}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  remove(o.id);
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                <X size={12} />
              </span>
            </span>
          ))}
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#555566] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {error && (
        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-400" />
          {error}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-[#1a1a28] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="relative border-b border-white/5">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566] pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent pl-9 pr-3 py-2.5 text-sm text-[#f5f5f7] placeholder-[#555566] outline-none"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#555566]">
                No categories found
              </div>
            ) : (
              filtered.map((o) => {
                const selected = selectedIds.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-all cursor-pointer hover:bg-white/5 ${
                      selected ? "text-blue-300" : "text-[#f5f5f7]"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        selected
                          ? "bg-blue-600 border-blue-500"
                          : "border-white/20"
                      }`}
                    >
                      {selected && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M2 5L4 7L8 3"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {o.name}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
