const { getCardColors } = require('../themes.cjs');

function calculateRank({ totalCommits, totalPRs, totalIssues, totalStars, contributedTo }) {
  const COMMITS_MEDIAN = 1000;
  const COMMITS_WEIGHT = 2;
  const PRS_MEDIAN = 50;
  const PRS_WEIGHT = 3;
  const ISSUES_MEDIAN = 25;
  const ISSUES_WEIGHT = 1;
  const STARS_MEDIAN = 50;
  const STARS_WEIGHT = 4;
  const CONTRIB_MEDIAN = 5;
  const CONTRIB_WEIGHT = 2;
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

  const colors = getCardColors({
    title_color: theme.title_color,
    text_color: theme.text_color,
    icon_color: theme.icon_color,
    bg_color: theme.bg_color,
    border_color: theme.border_color,
    ring_color: theme.ring_color,
    theme: theme.themeName,
  });

  const rank = calculateRank({ totalCommits, totalPRs, totalIssues, totalStars, contributedTo });

  const width = 495;
  const height = 220;
  const paddingX = 25;
  const paddingY = 35;
  const lineH = 25;
  const border_radius = 14;

  const rows = [
    ['Total Stars Earned:', totalStars],
    ['Total Commits (last year):', totalCommits],
    ['Total PRs:', totalPRs],
    ['Total Issues:', totalIssues],
    ['Contributed to (last year):', contributedTo],
  ];

  const rowsSvg = rows
    .map(([label, value], i) => {
      const y = paddingY + 20 + (i + 1) * lineH;
      return `
      <g transform="translate(${paddingX}, 0)">
        <text class="stat" y="${y}">${label}</text>
        <text class="stat" x="235" y="${y}">${Number(value).toLocaleString()}</text>
      </g>`;
    })
    .join('');

  const ringRadius = 40;
  const circumference = 2 * Math.PI * ringRadius;
  const ringOffset = circumference * (1 - rank.percentage);
  const ringX = width - paddingX - ringRadius - 10;
  const ringY = paddingY + 20 + (rows.length * lineH) / 2;

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header {
      font: 600 18px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.titleColor};
    }
    .stat {
      font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
    }
    .rank-text {
      font: 800 28px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
    }
    .rank-circle {
      stroke: ${colors.ringColor};
      stroke-dasharray: ${circumference};
      stroke-width: 6;
      stroke-linecap: round;
    }
    .rank-circle-rim {
      stroke: ${colors.ringColor};
      stroke-width: 6;
      opacity: 0.2;
    }
  </style>

  <rect x="0.5" y="0.5" rx="${border_radius}" height="99%"
    stroke="${colors.borderColor}" width="${width - 1}"
    fill="${colors.bgColor}" />

  <text data-testid="card-title" x="${paddingX}" y="${paddingY}" class="header">${escapeXml(name)}'s GitHub Stats</text>

  ${rowsSvg}

  <g transform="translate(${ringX}, ${ringY})">
    <circle cx="0" cy="0" r="${ringRadius}" fill="none" class="rank-circle-rim"/>
    <circle cx="0" cy="0" r="${ringRadius}" fill="none" class="rank-circle"
      stroke-dashoffset="${ringOffset}" transform="rotate(-90)"/>
    <text data-testid="rank-text" x="0" y="8" class="rank-text" text-anchor="middle">${rank.level}</text>
  </g>
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

module.exports = { renderStatsCard };
