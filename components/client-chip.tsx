import type { ClientStatus } from "@/lib/cinc/fleet";
import { IconWarning, IconArrowDown } from "@/components/ui/icons";

/** Shared chip shape so EOL and major-behind read as the same kind of badge:
 * a fixed height (so both align on a row) and a colored border + icon + text
 * carrying severity — never color alone (WCAG 1.4.1). Only the color differs. */
const CHIP =
  "ml-2 inline-flex h-5 items-center gap-1 rounded border px-1.5 text-xs leading-none";

/**
 * Per-node client-version chip. Only EOL and major-behind warrant a flag —
 * current and unknown render nothing.
 */
export function ClientChip({ status }: { status: ClientStatus }) {
  if (status === "eol") {
    return (
      <span className={`${CHIP} border-danger text-danger`}>
        <IconWarning />
        EOL
      </span>
    );
  }
  if (status === "major-behind") {
    return (
      <span className={`${CHIP} border-warn text-warn`}>
        <IconArrowDown />
        Major release behind
      </span>
    );
  }
  return null;
}

/**
 * A node's client version followed by its {@link ClientChip}. The version sits
 * in a fixed-min-width, tabular-figures box so the chip starts at the same
 * column on every row and the badges line up down the list.
 */
export function ClientVersion({
  version,
  status,
}: {
  version: string | null;
  status: ClientStatus;
}) {
  return (
    <span className="inline-flex items-center">
      <span className="min-w-[4.5rem] tabular-nums">{version ?? "—"}</span>
      <ClientChip status={status} />
    </span>
  );
}
