"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "./primitives";

/**
 * Controlled, ordered run-list editor — add / remove / reorder, with no save
 * chrome. Run lists are ordered (Chef applies them top to bottom), so it's an
 * `<ol>`. Used by RunListEditor (which adds the save lifecycle) and by the
 * create form (which collects it into a draft). The new-entry text is local UI
 * state; structural changes are reported through `onChange`.
 */
export function RunListField({
  items,
  onChange,
  disabled = false,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
}) {
  const [entry, setEntry] = useState("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = entry.trim();
    if (!v) return;
    onChange([...items, v]);
    setEntry("");
  }

  function removeAt(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <>
      {items.length === 0 ? (
        <EmptyState>Empty run list. Add an entry below.</EmptyState>
      ) : (
        <ol className="space-y-1">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center gap-2 rounded bg-surface-2 px-2 py-1"
            >
              <span
                aria-hidden="true"
                className="w-6 select-none font-mono text-xs tabular-nums text-muted"
              >
                {i + 1}.
              </span>
              <span className="flex-1 font-mono text-xs text-text">{item}</span>
              <Button
                variant="ghost"
                className="px-2"
                disabled={disabled || i === 0}
                aria-label={`Move ${item} up`}
                onClick={() => move(i, -1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                className="px-2"
                disabled={disabled || i === items.length - 1}
                aria-label={`Move ${item} down`}
                onClick={() => move(i, 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                className="px-2 text-danger hover:text-danger"
                disabled={disabled}
                aria-label={`Remove ${item}`}
                onClick={() => removeAt(i)}
              >
                ✕
              </Button>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={add} className="flex gap-2">
        <Input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="recipe[cookbook::recipe] or role[name]"
          aria-label="New run list entry"
          className="flex-1 font-mono text-xs"
          disabled={disabled}
        />
        <Button type="submit" variant="secondary" disabled={disabled || !entry.trim()}>
          Add
        </Button>
      </form>
    </>
  );
}
