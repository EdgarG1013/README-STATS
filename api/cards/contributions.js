function renderContributionsCard(username, contributionDays, theme) {
  const t = theme;
  const width = 495;
  const height = 220;
  const padding = { top: 40, right: 25, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxCount = Math.max(...contributionDays.map((d) => d.count), 1);

  const points = contributionDays.map((d, i) => ({
    x: padding.left + (i / (contributionDays.length - 1)) * chartW,
    y: padding.top + chartH - (d.count / maxCount) * chartH,
    count: d.count,
    date: d.date,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const fillPathD = pathD +
    ` L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartH}` +
    ` L ${points[0].x.toFixed(1)} ${padding.top + chartH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padding.top + chartH - ratio * chartH;
    const val = Math.round(maxCount * ratio);
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${t.border}" stroke-width="0.5" stroke-dasharray="3,3"/>
    <text x="${padding.left - 8}" y="${y + 4}" fill="${t.statLabel}" font-size="10" text-anchor="end">${val}</text>`;
  });

  const xLabels = points
    .filter((_, i) => i % Math.ceil(points.length / 15) === 0 || i === points.length - 1)
    .map((p) => {
      const day = new Date(p.date + 'T00:00:00').getDate();
      return `<text x="${p.x.toFixed(1)}" y="${height - 8}" fill="${t.statLabel}" font-size="9" text-anchor="middle">${day}</text>`;
    });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Segoe+UI&amp;display=swap');
      text { font-family: 'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif; }
    </style>
    <linearGradient id="chartFillGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${t.greenChart}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${t.greenChart}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" rx="12" fill="${t.cardBg}" stroke="${t.border}" stroke-width="1"/>

  <text x="${width / 2}" y="26" fill="${t.titleColor}" font-size="15" font-weight="bold" text-anchor="middle">${escapeXml(username)}'s Contribution Graph</text>

  ${gridLines.join('\n  ')}

  <text x="14" y="${padding.top + chartH / 2}" fill="${t.statLabel}" font-size="10" text-anchor="middle" transform="rotate(-90, 14, ${padding.top + chartH / 2})">Contributions</text>

  <path d="${fillPathD}" fill="url(#chartFillGrad)"/>
  <path d="${pathD}" fill="none" stroke="${t.greenChart}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

  ${points.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${t.greenChart}" opacity="0.8"/>`).join('\n  ')}

  ${xLabels.join('\n  ')}

  <text x="${width / 2}" y="${height - 2}" fill="${t.statLabel}" font-size="10" text-anchor="middle">Days</text>
</svg>`;

  return svg;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { renderContributionsCard };
