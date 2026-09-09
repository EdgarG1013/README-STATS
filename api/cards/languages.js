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
};

const barColors = [
  '#3178c6', '#f1e05a', '#3572A5', '#b07219', '#e34c26',
  '#563d7c', '#89e051', '#00ADD8', '#dea584', '#41b883',
];

function renderLanguagesCard(languages, theme) {
  const t = theme;
  const cardWidth = 495;
  const cardHeight = 170;
  const barHeight = 18;
  const barWidth = cardWidth - 56;
  const startX = 28;
  const startY = 60;

  const total = languages.reduce((s, l) => s + parseFloat(l.percentage), 0);
  let barX = 0;

  let barSegments = '';
  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    const segWidth = (parseFloat(lang.percentage) / total) * barWidth;
    const color = langColors[lang.name] || barColors[i % barColors.length];
    barSegments += `<rect x="${startX + barX}" y="${startY}" width="${Math.max(segWidth, 2)}" height="${barHeight}" fill="${color}" rx="${i === 0 ? '4' : '0'}" ry="${i === 0 ? '4' : '0'}"/>`;
    barX += segWidth;
  }

  let legendItems = '';
  const cols = 2;
  const colWidth = cardWidth / cols;
  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const lx = startX + col * colWidth;
    const ly = startY + barHeight + 30 + row * 26;
    const color = langColors[lang.name] || barColors[i % barColors.length];

    legendItems += `<circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${color}"/>
    <text x="${lx + 18}" y="${ly}" fill="${t.textColor}" font-size="12">${lang.name} ${lang.percentage}%</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Segoe+UI&amp;display=swap');
      text { font-family: 'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="${t.cardBg}" stroke="${t.border}" stroke-width="1"/>

  <text x="28" y="38" fill="${t.titleColor}" font-size="18" font-weight="bold">Most Used Languages</text>

  <clipPath id="barClip">
    <rect x="${startX}" y="${startY}" width="${barWidth}" height="${barHeight}" rx="4" ry="4"/>
  </clipPath>
  <g clip-path="url(#barClip)">
    ${barSegments}
  </g>

  ${legendItems}
</svg>`;

  return svg;
}

module.exports = { renderLanguagesCard };
