const NAMED_COLORS: Record<string, string> = {
  black: "#1a1a1a",
  white: "#ffffff",
  red: "#c0392b",
  blue: "#2c4a7c",
  green: "#3d4f3a",
  olive: "#5c6b4a",
  navy: "#1e2a44",
  gray: "#6b7280",
  grey: "#6b7280",
  charcoal: "#36454f",
  brown: "#6b4423",
  beige: "#d4c4a8",
  cream: "#f5f0e6",
  khaki: "#c3b091",
  maroon: "#800000",
  burgundy: "#6b1d2a",
  pink: "#e8a0bf",
  purple: "#6b3fa0",
  orange: "#d97706",
  yellow: "#eab308",
  teal: "#0d7377",
  cyan: "#06b6d4",
  gold: "#c9a227",
  silver: "#c0c0c0",
  ivory: "#fffff0",
  tan: "#d2b48c",
  rust: "#b7410e",
  mustard: "#c4a035",
  forest: "#228b22",
  sage: "#9caf88",
  slate: "#64748b",
  wine: "#722f37",
  coral: "#ff7f50",
  mint: "#98ff98",
  peach: "#ffcba4",
  lavender: "#b57edc",
};

function hashColor(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 28% 38%)`;
}

export function parseColor(value: string): string {
  const raw = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;
  if (/^rgb(a)?\(/i.test(raw)) return raw;
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (NAMED_COLORS[key]) return NAMED_COLORS[key];
  const first = raw.toLowerCase().split(/[\s/-]+/)[0];
  return NAMED_COLORS[first] ?? hashColor(raw);
}

export function isLightColor(cssColor: string): boolean {
  const hex = cssColor.replace("#", "");
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  }
  return false;
}

export function groupKind(name: string): "color" | "size" | "other" {
  const n = name.toLowerCase();
  if (n.includes("color") || n.includes("colour")) return "color";
  if (n.includes("size")) return "size";
  return "other";
}
