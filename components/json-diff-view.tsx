import type { JsonDiffLine } from "@/lib/json-diff";

const fmt = (v: unknown) => JSON.stringify(v);

const SIGN = { added: "+", removed: "-", changed: "~" } as const;
const COLOR = {
  added: "text-success",
  removed: "text-danger",
  changed: "text-warn",
} as const;

/** Renders a structural JSON diff (from {@link diffJson}) as colored lines. */
export function JsonDiffView({ lines }: { lines: JsonDiffLine[] }) {
  return (
    <ul className="max-h-64 space-y-1 overflow-auto rounded-md border border-border bg-bg p-3 font-mono text-xs">
      {lines.map((line, i) => (
        <li key={`${line.path}-${i}`} className={COLOR[line.kind]}>
          <span aria-hidden="true">{SIGN[line.kind]} </span>
          <span className="text-text">{line.path}</span>
          {line.kind === "changed" ? (
            <>
              : {fmt(line.before)} <span className="text-muted">&rarr;</span>{" "}
              {fmt(line.after)}
            </>
          ) : (
            <>: {fmt(line.kind === "added" ? line.after : line.before)}</>
          )}
        </li>
      ))}
    </ul>
  );
}
