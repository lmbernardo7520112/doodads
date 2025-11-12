"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
  loading?: boolean;
  suggestions?: string[];
  onSelectSuggestion?: (val: string) => void;
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  loading = false,
  suggestions = [],
  onSelectSuggestion,
  onClear,
}: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (suggestions.length > 0 && value.trim() !== "") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [suggestions, value]);

  const handleSelect = (s: string) => {
    onChange(s);
    onSelectSuggestion?.(s);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    onClear?.();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 shadow-sm transition">
        <Search className="w-4 h-4 text-gray-400 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Pesquise serviços ou barbearias"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm bg-transparent focus:outline-none text-gray-800 dark:text-gray-100"
          autoComplete="off"
        />
        {value && !loading && (
          <button
            onClick={handleClear}
            className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500 dark:text-emerald-300" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 
                     rounded-lg shadow-md z-10 max-h-56 overflow-y-auto animate-fade-in"
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSelect(s)}
              className="px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 
                         cursor-pointer text-sm text-gray-800 dark:text-gray-100 transition-colors"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

