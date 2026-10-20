// Validation and normalization of every query parameter the card endpoints accept.
// Nothing from the query string reaches an SVG without passing through here.

const HEX_RE = /^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
// GitHub rules: alphanumerics and single hyphens, no leading/trailing hyphen, max 39 chars.
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const STATS_ROWS = ["stars", "commits", "prs", "issues", "contribs"];

// Express turns repeated params (?a=1&a=2) into arrays; only the first value counts.
const first = (value) => (Array.isArray(value) ? value[0] : value);

export const isValidUsername = (value) => typeof value === "string" && USERNAME_RE.test(value);

export function hex(value) {
  value = first(value);
  if (typeof value !== "string") return undefined;
  const clean = value.trim().replace(/^#/, "");
  return HEX_RE.test(clean) ? clean.toLowerCase() : undefined;
}

// "angle,color1,color2[,...]" -> same string, validated. Used for gradient backgrounds.
export function background(value) {
  value = first(value);
  if (typeof value !== "string") return undefined;
  if (!value.includes(",")) return hex(value);
  const [angle, ...stops] = value.split(",");
  const deg = Number(angle);
  if (!Number.isFinite(deg) || stops.length < 2 || stops.length > 5) return undefined;
  const colors = stops.map(hex);
  if (colors.some((c) => !c)) return undefined;
  return [Math.round(deg) % 360, ...colors].join(",");
}

export function int(value, { min, max, fallback }) {
  const n = parseInt(first(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const bool = (value, fallback = false) => {
  value = first(value);
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
};

export function list(value, { allowed, maxItems = 20, maxLength = 40 } = {}) {
  value = first(value);
  if (typeof value !== "string") return [];
  const items = value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s.length <= maxLength);
  const unique = [...new Set(allowed ? items.filter((s) => allowed.includes(s)) : items)];
  return unique.slice(0, maxItems);
}

export function text(value, maxLength = 60) {
  value = first(value);
  if (typeof value !== "string") return undefined;
  // Strip control characters; XML escaping happens in the renderers.
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return clean ? clean.slice(0, maxLength) : undefined;
}

/**
 * Builds the options object the ./cards/*.cjs renderers expect.
 * @param {object} query  req.query
 * @param {object} catalog  { render: themes known by the renderers, extra: themes only in src/themes }
 */
export function parseCardOptions(query, catalog) {
  const requested = typeof first(query.theme) === "string" ? first(query.theme) : "dracula";
  const known = Object.hasOwn(catalog.render, requested) || Object.hasOwn(catalog.extra, requested);
  const themeName = known ? requested : "dracula";
  // Themes that only exist in src/themes are passed to the renderers as explicit colors.
  const extra = Object.hasOwn(catalog.render, themeName) ? {} : catalog.extra[themeName] || {};

  return {
    themeName,
    title_color: hex(query.title_color) || extra.title_color,
    text_color: hex(query.text_color) || extra.text_color,
    icon_color: hex(query.icon_color) || extra.icon_color,
    bg_color: background(query.bg_color) || extra.bg_color,
    border_color: hex(query.border_color) || extra.border_color,
    ring_color: hex(query.ring_color) || extra.title_color,
    border_radius: int(query.border_radius, { min: 0, max: 50, fallback: 14 }),
    hide_border: bool(query.hide_border),
    hide_title: bool(query.hide_title),
    custom_title: text(query.custom_title),
    // Stats card
    // hide_icons is the documented legacy name; show_icons matches github-readme-stats.
    show_icons: bool(query.show_icons, !bool(query.hide_icons)),
    hide_rank: bool(query.hide_rank),
    hide: list(query.hide, { allowed: STATS_ROWS }),
    // Languages card
    langs_count: int(query.langs_count, { min: 1, max: 10, fallback: 6 }),
    exclude: list(query.exclude),
    // Contributions card
    days: int(query.days, { min: 7, max: 365, fallback: 31 }),
  };
}
