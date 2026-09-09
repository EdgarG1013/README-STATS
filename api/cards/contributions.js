const { getCardColors } = require('../themes');

function renderContributionsCard(username, contributionDays, theme) {
  const colors = getCardColors({
    title_color: theme.title_color,
    text_color: theme.text_color,
    icon_color: theme.icon_color,
    bg_color: theme.bg_color,
    border_color: theme.border_color,
    theme: theme.themeName,
  });

  if (!contributionDays || contributionDays.length === 0) {
    contributionDays = [{ date: new Date().toISOString().split('T')[0], count: 0 }];
  }

  const width = 495;
  const height = 240;
  const border_radius = 14;
  const padding = { top: 45, right: 25, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const rawMax = Math.max(...contributionDays.map((d) => d.count), 1);
  const niceStep = (() => {
    const roughStep = rawMax / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
    const residual = roughStep / magnitude;
    let step;
    if (residual > 5) step = 10 * magnitude;
    else if (residual > 2) step = 5 * magnitude;
    else if (residual > 1) step = 2 * magnitude;
    else step = magnitude;
    return Math.max(1, Math.round(step));
  })();
  const maxCount = niceStep * Math.ceil(rawMax / niceStep);

  const denom = Math.max(contributionDays.length - 1, 1);
  const points = contributionDays.map((d, i) => ({
    x: padding.left + (i / denom) * chartW,
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

  const gridSteps = [];
  for (let v = 0; v <= maxCount; v += niceStep) {
    gridSteps.push(v);
  }

  const gridLines = gridSteps.map((val) => {
    const y = padding.top + chartH - (val / maxCount) * chartH;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${colors.borderColor}" stroke-width="0.5" stroke-dasharray="3,3"/>
    <text x="${padding.left - 10}" y="${y + 4}" class="axis-label" text-anchor="end">${val}</text>`;
  });

  const xLabelStep = Math.max(1, Math.ceil(points.length / 18));
  const xLabels = points
    .filter((_, i) => i % xLabelStep === 0 || i === points.length - 1)
    .map((p) => {
      const day = new Date(p.date + 'T00:00:00').getDate();
      return `<text x="${p.x.toFixed(1)}" y="${height - padding.bottom + 20}" class="axis-label" text-anchor="middle">${day}</text>`;
    });

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header {
      font: 600 15px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.titleColor};
    }
    .axis-label {
      font: 400 10px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
    }
    .axis-title {
      font: 400 10px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
    }
  </style>

  <defs>
    <linearGradient id="contribFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colors.ringColor}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.ringColor}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect x="0.5" y="0.5" rx="${border_radius}" height="99%"
    stroke="${colors.borderColor}" width="${width - 1}"
    fill="${colors.bgColor}" />

  <text data-testid="card-title" x="${width / 2}" y="28" class="header" text-anchor="middle">${escapeXml(username)}'s Contribution Graph</text>

  ${gridLines.join('\n  ')}

  <text x="16" y="${padding.top + chartH / 2}" class="axis-title" text-anchor="middle" transform="rotate(-90, 16, ${padding.top + chartH / 2})">Contributions</text>

  <path d="${fillPathD}" fill="url(#contribFill)"/>
  <path d="${pathD}" fill="none" stroke="${colors.ringColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

  ${points.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${colors.ringColor}" opacity="0.85"/>`).join('\n  ')}

  ${xLabels.join('\n  ')}

  <text x="${width / 2}" y="${height - 8}" class="axis-title" text-anchor="middle">Days</text>
</svg>`;

  return svg;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { renderContributionsCard };
