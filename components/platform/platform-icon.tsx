import type { ReactElement, SVGProps } from "react";

/**
 * Inline monochrome platform glyphs. They use `currentColor` so they inherit
 * text color and the console theme, and ship inline because the console runs
 * air-gapped (no icon CDN). Related distros share a family glyph to keep the
 * set small; anything unrecognized falls back to a generic server icon.
 */
type GlyphKey =
  | "ubuntu"
  | "debian"
  | "redhat"
  | "windows"
  | "apple"
  | "alpine"
  | "arch"
  | "generic";

/** Maps a raw Cinc `platform` string to a glyph family. */
export function glyphFor(platform: string): GlyphKey {
  const p = platform.toLowerCase().trim();
  if (p.includes("ubuntu")) return "ubuntu";
  if (p.includes("debian") || p.includes("raspbian")) return "debian";
  if (p.includes("windows")) return "windows";
  if (p.includes("mac") || p.includes("darwin")) return "apple";
  if (p.includes("alpine")) return "alpine";
  if (p.includes("arch")) return "arch";
  if (/red ?hat|rhel|centos|rocky|alma|oracle|fedora|amazon|amzn|scientific/.test(p))
    return "redhat";
  return "generic";
}

type GlyphProps = SVGProps<SVGSVGElement> & { label: string; glyph: GlyphKey };

const paths: Record<GlyphKey, ReactElement> = {
  // two stacked server racks with status dots
  generic: (
    <path d="M3 4h18a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0 9h18a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zm3 2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
  ),
  // four-pane flag
  windows: (
    <path d="M3 5l8-1v8H3V5zm9-1.2L21 3v9h-9V3.8zM3 13h8v8l-8-1v-7zm9 0h9v9l-9-1.2V13z" />
  ),
  // circle of friends: ring plus three dots
  ubuntu: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14z" />
      <circle cx="12" cy="5.6" r="1.7" />
      <circle cx="6.6" cy="15" r="1.7" />
      <circle cx="17.4" cy="15" r="1.7" />
    </>
  ),
  // open swirl
  debian: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      d="M14.5 5.2a7.2 7.2 0 1 0 4.6 11.8 5.6 5.6 0 1 1-4.4-9.1 3.6 3.6 0 1 0-1 .3"
    />
  ),
  // fedora hat with brim
  redhat: (
    <path d="M3 16c3 2 15 2 18 0 0-1-2-2-5-2.3C15.5 11 14 9 12 9s-2 2.5-4 4.7C5 14 3 15 3 16zm1 1.6c4 2 12 2 16 0v1c-4 2-12 2-16 0v-1z" />
  ),
  // apple with leaf
  apple: (
    <>
      <path d="M17 13.5c0 3-2.2 6-4 6-.8 0-1.3-.4-2-.4s-1.2.4-2 .4c-1.8 0-4-3-4-6 0-2.8 1.9-4.5 3.8-4.5 1 0 1.7.5 2.2.5s1.2-.6 2.4-.5c1.6.1 3.4 1.7 3.4 4.5z" />
      <path d="M12.5 7.5c.2-1.5 1.4-2.5 2.8-2.5 0 1.5-1.2 2.6-2.8 2.5z" />
    </>
  ),
  // mountain peaks
  alpine: <path d="M4 19l5-9 3 5 2-3 6 7H4z" />,
  // triangle
  arch: <path d="M12 3L3 21l9-4 9 4L12 3zm0 5l5.5 11L12 16.7 6.5 19 12 8z" />,
};

function Glyph({ label, glyph, ...rest }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label={label}
      data-platform-glyph={glyph}
      {...rest}
    >
      <title>{label}</title>
      {paths[glyph]}
    </svg>
  );
}

/**
 * Renders the platform glyph for a node's `automatic.platform`. Accepts an
 * unknown value so callers need not pre-validate; non-strings render the
 * generic icon labeled "unknown platform".
 */
export function PlatformIcon({
  platform,
  className = "h-4 w-4",
}: {
  platform: unknown;
  className?: string;
}) {
  const valid = typeof platform === "string" && platform.trim() !== "";
  const glyph = valid ? glyphFor(platform) : "generic";
  const label = valid ? platform : "unknown platform";
  return <Glyph glyph={glyph} label={label} className={className} />;
}
