"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  searchDashboard,
  type SearchResultCategory,
} from "@/lib/search/actions";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export function DashboardSearch() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<SearchResultCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const trimmedQuery = query.trim();
  const shouldSearch = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const hasResults = categories.some((category) => category.results.length > 0);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!shouldSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(async () => {
        const result = await searchDashboard(trimmedQuery);
        if (requestIdRef.current !== requestId) return;

        setCategories(result.categories);
        setError(result.error ?? null);
        setIsOpen(true);
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [shouldSearch, trimmedQuery]);

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          if (nextQuery.trim().length < MIN_QUERY_LENGTH) {
            setCategories([]);
            setError(null);
          }
          setIsOpen(true);
        }}
        onFocus={() => {
          if (shouldSearch) setIsOpen(true);
        }}
        placeholder="Search..."
        className="w-full bg-[#f6f3f2] rounded-full py-2.5 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 transition-all"
      />

      {isOpen && shouldSearch && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
          <div className="max-h-[420px] overflow-y-auto py-2">
            {isPending ? (
              <div className="px-4 py-5 text-sm text-neutral-500">Searching...</div>
            ) : error ? (
              <div className="px-4 py-5 text-sm text-red-600">{error}</div>
            ) : hasResults ? (
              <div className="space-y-1">
                {categories.map((category) => (
                  <section key={category.id} className="py-1">
                    <h3 className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      {category.title}
                    </h3>
                    <div>
                      {category.results.map((result) => (
                        <Link
                          key={`${category.id}-${result.id}`}
                          href={result.href}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2.5 transition-colors hover:bg-[#f6f3f2]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#1c1b1b]">
                                {result.title}
                              </p>
                              {result.subtitle && (
                                <p className="mt-0.5 truncate text-xs text-[#5f5e5e]">
                                  {result.subtitle}
                                </p>
                              )}
                            </div>
                            {result.meta && (
                              <span className="shrink-0 rounded-full bg-[#78fbb6]/20 px-2 py-0.5 text-[10px] font-semibold text-[#005232]">
                                {result.meta}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-sm text-neutral-500">
                No results found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
