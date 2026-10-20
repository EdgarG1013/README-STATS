const { getCardColors } = require('../themes.cjs');

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const HEX_RE = /^[0-9a-f]{3,8}$/i;
const safeColor = (value, fallback) => (HEX_RE.test(String(value).replace('#', '')) ? value : fallback);

// "35,4158d0,c850c0" -> { angle: 35, stops: ['4158d0', 'c850c0'] }
function parseGradient(value) {
  const parts = String(value || '').replace('#', '').split(',');
  if (parts.length < 3) return null;
  const angle = Number(parts[0]);
  const stops = parts.slice(1);
  if (!Number.isFinite(angle) || !stops.every((c) => HEX_RE.test(c))) return null;
  return { angle, stops };
}

/**
 * Resolves the final card colors. Every color is guaranteed to be a plain hex value,
 * so it is safe to interpolate into SVG attributes and <style> blocks.
 */
function resolveColors(theme) {
  const raw = getCardColors({
    title_color: theme.title_color,
    text_color: theme.text_color,
    icon_color: theme.icon_color,
    bg_color: theme.bg_color,
    border_color: theme.border_color,
    ring_color: theme.ring_color,
    theme: theme.themeName,
  });
  const gradient = parseGradient(raw.bgColor);

  return {
    titleColor: safeColor(raw.titleColor, '#2f80ed'),
    textColor: safeColor(raw.textColor, '#434d58'),
    iconColor: safeColor(raw.iconColor, '#4c71f2'),
    ringColor: safeColor(raw.ringColor, '#2f80ed'),
    borderColor: safeColor(raw.borderColor, '#e4e2e2'),
    bgColor: gradient ? `#${gradient.stops[0]}` : safeColor(raw.bgColor, '#fffefe'),
    gradient,
  };
}

/** Background rect (solid or gradient) with optional border. */
function cardFrame({ width, height, colors, theme }) {
  const radius = Number.isFinite(theme.border_radius) ? theme.border_radius : 14;
  let defs = '';
  let fill = colors.bgColor;

  if (colors.gradient) {
    const { angle, stops } = colors.gradient;
    const stopTags = stops
      .map((c, i) => `<stop offset="${(i / (stops.length - 1)) * 100}%" stop-color="#${c}"/>`)
      .join('');
    defs = `<defs><linearGradient id="cardBg" gradientTransform="rotate(${angle} 0.5 0.5)">${stopTags}</linearGradient></defs>`;
    fill = 'url(#cardBg)';
  }

  return `${defs}
  <rect x="0.5" y="0.5" rx="${radius}" width="${width - 1}" height="${height - 1}"
    fill="${fill}" stroke="${colors.borderColor}" stroke-opacity="${theme.hide_border ? 0 : 1}" stroke-width="1" />`;
}

/** Card title honoring custom_title / hide_title. Returns '' when hidden. */
function cardTitle(defaultTitle, theme, attrs) {
  if (theme.hide_title) return '';
  return `<text data-testid="card-title" ${attrs} class="header">${escapeXml(theme.custom_title || defaultTitle)}</text>`;
}

module.exports = { escapeXml, resolveColors, cardFrame, cardTitle };
