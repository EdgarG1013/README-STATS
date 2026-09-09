function renderStatsCard(data, theme) {
  const { name, totalStars, totalCommits, totalPRs, totalIssues, contributedTo } = data;
  const t = theme;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="200" viewBox="0 0 495 200">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Segoe+UI&amp;display=swap');
      text { font-family: 'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  <rect width="495" height="200" rx="12" fill="${t.cardBg}" stroke="${t.border}" stroke-width="1"/>

  <text x="28" y="38" fill="${t.titleColor}" font-size="18" font-weight="bold">${escapeXml(name)}'s GitHub Stats</text>

  <text x="28" y="72" fill="${t.statLabel}" font-size="14">Total Stars Earned:</text>
  <text x="260" y="72" fill="${t.statValue}" font-size="14" font-weight="bold" text-anchor="end">${totalStars.toLocaleString()}</text>

  <text x="28" y="100" fill="${t.statLabel}" font-size="14">Total Commits (last year):</text>
  <text x="260" y="100" fill="${t.statValue}" font-size="14" font-weight="bold" text-anchor="end">${totalCommits.toLocaleString()}</text>

  <text x="28" y="128" fill="${t.statLabel}" font-size="14">Total PRs:</text>
  <text x="260" y="128" fill="${t.statValue}" font-size="14" font-weight="bold" text-anchor="end">${totalPRs.toLocaleString()}</text>

  <text x="28" y="156" fill="${t.statLabel}" font-size="14">Total Issues:</text>
  <text x="260" y="156" fill="${t.statValue}" font-size="14" font-weight="bold" text-anchor="end">${totalIssues.toLocaleString()}</text>

  <text x="28" y="184" fill="${t.statLabel}" font-size="14">Contributed to (last year):</text>
  <text x="260" y="184" fill="${t.statValue}" font-size="14" font-weight="bold" text-anchor="end">${contributedTo.toLocaleString()}</text>

  <g transform="translate(370, 100)">
    <circle cx="0" cy="0" r="52" fill="none" stroke="${t.ringBg}" stroke-width="10"/>
    <circle cx="0" cy="0" r="52" fill="none" stroke="${t.ringFill}" stroke-width="10"
      stroke-dasharray="${2 * Math.PI * 52}" stroke-dashoffset="${2 * Math.PI * 52 * (1 - Math.min(totalCommits / 500, 1))}"
      stroke-linecap="round" transform="rotate(-90)"/>
    <text x="0" y="5" fill="${t.textColor}" font-size="24" font-weight="bold" text-anchor="middle">${totalCommits}</text>
  </g>
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

module.exports = { renderStatsCard };
