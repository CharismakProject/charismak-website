// Website colour theme, editable in Admin → Website Colours.
// Stored in website_content as content_key "theme.colors" (section "theme").

export const THEME_FIELDS = [
  { key: "void", cssVar: "--cx-void", label: "Page background", hint: "Main dark background behind every page", default: "#0A1A2F" },
  { key: "deep", cssVar: "--cx-deep", label: "Section background", hint: "Alternating sections, cards and form areas", default: "#0F2440" },
  { key: "panel", cssVar: "--cx-panel", label: "Panels", hint: "Raised boxes and image backgrounds", default: "#16304F" },
  { key: "gold", cssVar: "--cx-gold", label: "Accent colour", hint: "Buttons, labels, icons and highlights", default: "#E3B95F" },
  { key: "goldBright", cssVar: "--cx-gold-bright", label: "Accent hover", hint: "Button hover and bright highlights", default: "#F5CF7A" },
  { key: "ink", cssVar: "--cx-text", label: "Main text", hint: "Body text colour", default: "#F4F7FA" },
] as const;

export type ThemeKey = (typeof THEME_FIELDS)[number]["key"];
export type ThemeColors = Record<ThemeKey, string>;

export const DEFAULT_THEME: ThemeColors = Object.fromEntries(THEME_FIELDS.map((f) => [f.key, f.default])) as ThemeColors;

export const THEME_PRESETS: { name: string; colors: ThemeColors }[] = [
  { name: "Charismak Navy (default)", colors: DEFAULT_THEME },
  { name: "Charismak Slate", colors: { void: "#0F1923", deep: "#142130", panel: "#1A2A3B", gold: "#CFA864", goldBright: "#E8C27C", ink: "#E6ECF1" } },
  { name: "Charismak Night (previous)", colors: { void: "#02080F", deep: "#040F1C", panel: "#071A2E", gold: "#D9B26A", goldBright: "#F2C879", ink: "#EAF0F6" } },
  { name: "Steel Blue", colors: { void: "#030A12", deep: "#06121F", panel: "#0A1D31", gold: "#5BA4E6", goldBright: "#8CC4F5", ink: "#EAF0F6" } },
  { name: "Emerald", colors: { void: "#020B08", deep: "#05140F", panel: "#0A2219", gold: "#3CC48A", goldBright: "#6FE0AE", ink: "#E9F5EF" } },
  { name: "Graphite & Copper", colors: { void: "#0B0B0C", deep: "#121214", panel: "#1B1B1F", gold: "#D08A4E", goldBright: "#E9A86F", ink: "#EFEDEA" } },
  { name: "Navy & Silver", colors: { void: "#040A18", deep: "#0A1428", panel: "#111F3B", gold: "#C9D3E0", goldBright: "#FFFFFF", ink: "#EEF2F8" } },
];

const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

/** Only valid #RRGGBB values are accepted; anything else falls back to the default. */
export function cleanTheme(value: unknown): ThemeColors {
  let raw = value;
  // Tolerate the Website Content editor's {text: "..."} wrapper holding JSON.
  if (raw && typeof raw === "object" && typeof (raw as { text?: unknown }).text === "string" && !("gold" in raw)) {
    try { raw = JSON.parse((raw as { text: string }).text); } catch { raw = {}; }
  }
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(THEME_FIELDS.map((f) => [f.key, isHex(source[f.key]) ? String(source[f.key]).toUpperCase() : f.default])) as ThemeColors;
}

/** CSS that applies the theme. Values are validated hex codes, so this is safe to inline. */
export function themeCss(colors: ThemeColors): string {
  const vars = THEME_FIELDS.map((f) => `${f.cssVar}:${colors[f.key]}`).join(";");
  return `:root{${vars};--cx-muted:color-mix(in srgb,${colors.ink} 82%,transparent)}`;
}

export const isDefaultTheme = (c: ThemeColors) => THEME_FIELDS.every((f) => c[f.key].toUpperCase() === f.default.toUpperCase());
