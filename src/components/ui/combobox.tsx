"use client";

import { useState, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string; sub?: string };

export function Combobox({
  options,
  value,
  onSelect,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
}: {
  options: ComboboxOption[];
  value?: string | null;
  onSelect: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors hover:bg-stone-50 focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
        >
          <span className={cn("truncate", !selected && "text-slate-400")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      )}
      {open && (
        <div className="absolute z-50 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 fade-in">
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full border-b border-slate-100 px-3 text-sm focus:outline-none"
          />
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No results</div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="flex flex-col">
                  <span>{opt.label}</span>
                  {opt.sub && <span className="text-xs text-slate-400">{opt.sub}</span>}
                </span>
                {opt.value === value && <Check className="h-4 w-4 text-amber-600" />}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
              setQuery("");
            }}
            className="w-full border-t border-slate-100 px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}