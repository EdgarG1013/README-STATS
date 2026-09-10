const { getCardColors } = require('../themes.cjs');

const langColors = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Dart: '#00B4AB',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Scala: '#c22d40',
  R: '#198CE7',
  Lua: '#000080',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  'Jupyter Notebook': '#DA5B0B',
};

const defaultBarColors = [
  '#3178c6', '#f1e05a', '#3572A5', '#b07219', '#e34c26',
  '#563d7c', '#89e051', '#00ADD8', '#dea584', '#41b883',
];

function renderLanguagesCard(languages, theme) {
  const colors = getCardColors({
    title_color: theme.title_color,
    text_color: theme.text_color,
    icon_color: theme.icon_color,
    bg_color: theme.bg_color,
    border_color: theme.border_color,
    ring_color: theme.ring_color,
    theme: theme.themeName,
  });

  const width = 495;
  const height = 194;
  const border_radius = theme.border_radius != null ? theme.border_radius : 14;
  const paddingX = 25;
  const paddingY = 35;

  const barHeight = 14;
  const barWidth = width - paddingX * 2;
  const barY = paddingY + 26;
  const barRadius = 7;

  const total = languages.reduce((s, l) => s + l.size, 0);

  let barSegments = '';
  let offsetX = 0;

  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    const segWidth = (lang.size / total) * barWidth;
    const color = langColors[lang.name] || lang.color || defaultBarColors[i % defaultBarColors.length];
    barSegments += `<rect x="${paddingX + offsetX}" y="${barY}" width="${Math.max(segWidth, 3)}" height="${barHeight}" fill="${color}"/>`;
    offsetX += segWidth;
  }

  // Mask for rounded bar
  const barMask = `
  <mask id="barMask">
    <rect x="${paddingX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="${barRadius}" ry="${barRadius}" fill="white"/>
  </mask>`;

  let legendItems = '';
  const cols = 2;
  const colWidth = (width - paddingX * 2) / cols;
  const legendStartY = barY + barHeight + 22;

  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const lx = paddingX + col * colWidth;
    const ly = legendStartY + row * 24;
    const color = langColors[lang.name] || lang.color || defaultBarColors[i % defaultBarColors.length];
    const pct = ((lang.size / total) * 100).toFixed(2);

    legendItems += `
    <circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${color}"/>
    <text data-testid="lang-name" x="${lx + 18}" y="${ly}" class="lang-name">${lang.name} ${pct}%</text>`;
  }

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header {
      font: 600 18px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.titleColor};
    }
    .lang-name {
      font: 400 11px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
    }
  </style>

  <rect x="0" y="0" rx="${border_radius}" width="${width}" height="${height}"
    fill="${colors.bgColor}" stroke="${colors.borderColor}" stroke-width="1" />

  <text data-testid="card-title" x="${paddingX}" y="${paddingY}" class="header">Most Used Languages</text>

  ${barMask}
  <g mask="url(#barMask)">
    ${barSegments}
  </g>

  ${legendItems}
</svg>`;

  return svg;
}

module.exports = { renderLanguagesCard };
