// Overall rank (S / A+ / A / A- / B+ / B / C+ / C), the same idea GitHub
// README stats cards use. Previously the ring just showed totalCommits
// re-scaled against a fixed /500, which is why it displayed an unrelated
// letter-shaped glyph for low commit counts instead of anything meaningful.
// Now the ring explicitly shows a computed letter grade + fill percentage.
function calculateRank({ totalCommits, totalPRs, totalIssues, totalStars, contributedTo }) {
  const COMMITS_MEDIAN = 1000, COMMITS_WEIGHT = 2;
  const PRS_MEDIAN = 100, PRS_WEIGHT = 3;
  const ISSUES_MEDIAN = 50, ISSUES_WEIGHT = 1;
  const STARS_MEDIAN = 100, STARS_WEIGHT = 4;
  const CONTRIB_MEDIAN = 5, CONTRIB_WEIGHT = 2;
  const TOTAL_WEIGHT = COMMITS_WEIGHT + PRS_WEIGHT + ISSUES_WEIGHT + STARS_WEIGHT + CONTRIB_WEIGHT;

  const exponentialCdf = (x) => 1 - Math.pow(2, -x);

  const score =
    (COMMITS_WEIGHT * exponentialCdf(totalCommits / COMMITS_MEDIAN) +
      PRS_WEIGHT * exponentialCdf(totalPRs / PRS_MEDIAN) +
      ISSUES_WEIGHT * exponentialCdf(totalIssues / ISSUES_MEDIAN) +
      STARS_WEIGHT * exponentialCdf(totalStars / STARS_MEDIAN) +
      CONTRIB_WEIGHT * exponentialCdf(contributedTo / CONTRIB_MEDIAN)) /
    TOTAL_WEIGHT;

  const percentile = (1 - score) * 100;

  let level;
  if (percentile <= 1) level = 'S';
  else if (percentile <= 12.5) level = 'A+';
  else if (percentile <= 25) level = 'A';
  else if (percentile <= 37.5) level = 'A-';
  else if (percentile <= 50) level = 'B+';
  else if (percentile <= 62.5) level = 'B';
  else if (percentile <= 75) level = 'B-';
  else if (percentile <= 87.5) level = 'C+';
  else level = 'C';

  return { level, percentage: Math.max(0, Math.min(1, 1 - percentile / 100)) };
}

function renderStatsCard(data, theme) {
  const { name, totalStars, totalCommits, totalPRs, totalIssues, contributedTo } = data;
  const t = theme;
  const rank = calculateRank({ totalCommits, totalPRs, totalIssues, totalStars, contributedTo });

  const rows = [
    ['Total Stars Earned:', totalStars],
    ['Total Commits (last year):', totalCommits],
    ['Total PRs:', totalPRs],
    ['Total Issues:', totalIssues],
    ['Contributed to (last year):', contributedTo],
  ];
  const rowsSvg = rows
    .map(([label, value], i) => {
      const y = 72 + i * 28;
      return `<text x="28" y="${y}" fill="${t.statLabel}" font-size="14">${label}</text>
  <text x="260" y="${y}" fill="${t.statValue}" font-size="14" font-weight="bold" text-anchor="end">${Number(value).toLocaleString()}</text>`;
    })
    .join('\n  ');

  const width = 495;
  const height = 220;
  const ringR = 52;
  const ringC = 2 * Math.PI * ringR;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Segoe+UI&amp;display=swap');
      text { font-family: 'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  <rect width="${width}" height="${height}" rx="14" fill="${t.cardBg}" stroke="${t.border}" stroke-width="1"/>

  <text x="28" y="38" fill="${t.titleColor}" font-size="18" font-weight="bold">${escapeXml(name)}'s GitHub Stats</text>

  ${rowsSvg}

  <g transform="translate(400, 115)">
    <circle cx="0" cy="0" r="${ringR}" fill="none" stroke="${t.ringBg}" stroke-width="9"/>
    <circle cx="0" cy="0" r="${ringR}" fill="none" stroke="${t.ringFill}" stroke-width="9"
      stroke-dasharray="${ringC}" stroke-dashoffset="${ringC * (1 - rank.percentage)}"
      stroke-linecap="round" transform="rotate(-90)"/>
    <text x="0" y="9" fill="${t.textColor}" font-size="28" font-weight="bold" text-anchor="middle">${rank.level}</text>
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
