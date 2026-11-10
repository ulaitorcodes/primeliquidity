"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FieldOption } from "@/lib/programs/types";
import { listMerchantDirectory, type DirectoryMerchant } from "@/lib/api/merchants";
import { merchantKindLabels } from "@/lib/merchant-options";
import { inputClass } from "@/components/ui/form-field";

/** Above this many merchants a search box appears over the list. */
const FILTER_THRESHOLD = 12;
/** The directory returns at most this many by default. A full page means there may be more. */
const DIRECTORY_PAGE = 500;
const NO_OPTIONS: FieldOption[] = [];

export function MerchantSelect({
  id,
  kind,
  value,
  staticOptions = NO_OPTIONS,
  disabled = false,
  onChange,
}: {
  id: string;
  /** school, landlord, developer, supplier or other */
  kind: string;
  value: string;
  /** Options that always stay at the end, e.g. "My school is not listed" */
  staticOptions?: FieldOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<DirectoryMerchant[] | null>(null);
  // true when the first page was full, so there may be more merchants than we hold
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<DirectoryMerchant | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Debounce typing. Only used when the list is too long to hold in full.
  useEffect(() => {
    const t = window.setTimeout(() => setQuery(filter.trim()), 300);
    return () => window.clearTimeout(t);
  }, [filter]);

  const searchTerm = capped ? query : "";

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    listMerchantDirectory(kind, searchTerm || undefined)
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setError(null);
        if (!searchTerm) setCapped(list.length >= DIRECTORY_PAGE);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load the list");
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, attempt, searchTerm]);

  const settled = items !== null || error !== null;
  const list = items ?? [];

  const known = useMemo(
    () => new Set([...list.map((i) => i.id), ...staticOptions.map((o) => o.value)]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, staticOptions]
  );

  // A saved value that is no longer offered (e.g. prefilled for a merchant that has since been
  // suspended) is cleared so it must be chosen again. Skipped for very long lists, where the
  // saved merchant may simply be beyond the first page.
  useEffect(() => {
    if (settled && !capped && value && !known.has(value)) onChangeRef.current("");
  }, [settled, capped, value, known]);

  const kindLabel = (merchantKindLabels as Record<string, string>)[kind]?.toLowerCase() ?? kind;
  const noun = kind === "other" ? "merchant" : kindLabel;

  if (!settled) {
    return (
      <div className="relative">
        <select id={id} disabled className={`${inputClass} text-slate-400`}>
          <option>Loading...</option>
        </select>
        <Loader2
          size={16}
          className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
        />
      </div>
    );
  }

  const q = filter.trim().toLowerCase();
  const matches = capped || !q ? list : list.filter((i) => i.name.toLowerCase().includes(q));

  // Keep the chosen merchant on the list even when the search no longer matches it
  let visible = matches;
  if (value && !visible.some((i) => i.id === value) && !staticOptions.some((o) => o.value === value)) {
    const keep = (picked?.id === value ? picked : null) ?? list.find((i) => i.id === value);
    if (keep) visible = [keep, ...visible];
    else if (capped) visible = [{ id: value, name: "Previously selected merchant", kind }, ...visible];
  }

  const showSearch = capped || list.length > FILTER_THRESHOLD;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setPicked(list.find((i) => i.id === v) ?? (picked?.id === v ? picked : null));
    onChange(v);
  }

  return (
    <div className="space-y-2">
      {showSearch && (
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`Search ${noun}s`}
          disabled={disabled}
          className={inputClass}
          aria-label={`Search ${noun}s`}
        />
      )}

      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className={inputClass}
      >
        <option value="">Select {noun}...</option>
        {visible.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
        {q && matches.length === 0 && (
          <option value="__none__" disabled>
            No matches
          </option>
        )}
        {staticOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {capped && (
        <p className="text-xs text-slate-500">
          {searching ? "Searching..." : `There are a lot of ${noun}s. Type a name to search all of them.`}
        </p>
      )}

      {error && (
        <p className="text-xs text-amber-700">
          Couldn't load the list of {noun}s.{" "}
          {staticOptions.length > 0 ? "You can still choose another option, or " : "Please "}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setItems(null);
              setAttempt((a) => a + 1);
            }}
            className="font-medium underline"
          >
            try again
          </button>
          .
        </p>
      )}

      {!error && !capped && list.length === 0 && (
        <p className="text-xs text-slate-500">
          No {noun}s have been added yet.
          {staticOptions.length > 0 ? " You can choose the last option." : ""}
        </p>
      )}
    </div>
  );
}