"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";

export function SearchBar({ initialQuery = "", onSearch }: { initialQuery?: string; onSearch?: (q: string) => void }) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tests, subjects, exams..."
        className="w-full h-10 pl-9 pr-8 rounded-lg border border-zinc-300 bg-white text-sm !text-black placeholder:!text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </form>
  );
}
