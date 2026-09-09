function renderContributionsCard(username, contributionDays, theme) {
  const t = theme;
  if (!contributionDays || contributionDays.length === 0) {
    contributionDays = [{ date: new Date().toISOString().split('T')[0], count: 0 }];
  }
  const width = 495;
  const height = 220;
  const padding = { top: 40, right: 25, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const rawMax = Math.max(...contributionDays.map((d) => d.count), 1);
  // Round the axis ceiling up to a "nice" step (5, 10, 25, 50...) so grid
  // labels read as 0/5/10/15/20/25 instead of odd values like 6/13/19.
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
  const maxCount = niceStep * 5;

  // Guard divide-by-zero when there's only a single data point.
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

  const gridLines = [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
    const y = padding.top + chartH - ratio * chartH;
    const val = Math.round(niceStep * 5 * ratio);
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${t.border}" stroke-width="0.5" stroke-dasharray="3,3"/>
    <text x="${padding.left - 8}" y="${y + 4}" fill="${t.statLabel}" font-size="10" text-anchor="end">${val}</text>`;
  });

  const xLabelStep = Math.max(1, Math.ceil(points.length / 15));
  const xLabels = points
    .filter((_, i) => i % xLabelStep === 0 || i === points.length - 1)
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
