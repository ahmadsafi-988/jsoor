"use client";

import { useMemo, useState } from "react";
import { MapPin, XCircle } from "lucide-react";
import type { LocationOption } from "@/lib/company/data";

type Props = {
  locations: LocationOption[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  inputClassName?: string;
};

export function LocationPicker({
  locations,
  value,
  defaultValue,
  onChange,
  name = "location",
  id = "location",
  placeholder = "Search locations...",
  inputClassName = "w-full rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3 pl-10 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20",
}: Props) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [query, setQuery] = useState(value ?? defaultValue ?? "");
  const [open, setOpen] = useState(false);

  const selectedValue = isControlled ? (value ?? "") : internalValue;
  const normalizedQuery = query.trim().toLowerCase();
  const orderedLocations = useMemo(
    () =>
      [...locations].sort((a, b) => {
        if (a.name === "Jordan") return -1;
        if (b.name === "Jordan") return 1;
        return a.name.localeCompare(b.name);
      }),
    [locations]
  );

  const filteredLocations = useMemo(() => {
    if (!normalizedQuery || selectedValue === query) return orderedLocations;
    return orderedLocations.filter((location) =>
      location.name.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, orderedLocations, query, selectedValue]);

  function commit(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue);
    setQuery(nextValue);
    setOpen(false);
    onChange?.(nextValue);
  }

  function handleInputChange(nextQuery: string) {
    setQuery(nextQuery);
    setOpen(true);
    if (nextQuery === "") {
      if (!isControlled) setInternalValue("");
      onChange?.("");
    }
  }

  function handleBlur() {
    window.setTimeout(() => {
      setOpen(false);
      setQuery(selectedValue);
    }, 120);
  }

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f5e5e]" />
      <input
        id={id}
        value={query}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
      />
      <input type="hidden" name={name} value={selectedValue} />

      {selectedValue && (
        <button
          type="button"
          onClick={() => commit("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f5e5e] transition-colors hover:text-red-600"
          aria-label="Clear location"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#e5e2e1] bg-white p-1 shadow-lg">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => commit("")}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[#5f5e5e] hover:bg-[#f6f3f2]"
          >
            Not specified
          </button>
          {filteredLocations.map((location) => (
            <button
              key={location.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commit(location.name)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[#3d4a41] hover:bg-[#f6f3f2]"
            >
              {location.name}
            </button>
          ))}
          {filteredLocations.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-[#5f5e5e]">
              No matching locations found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
