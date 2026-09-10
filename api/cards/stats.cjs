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
  const border_radius = theme.border_radius != null ? theme.border_radius : 14;

  const iconColor = colors.iconColor;

  const icons = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><path fill="${iconColor}" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.751.751 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L1.818 6.37a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><path fill="${iconColor}" d="M11.93 8.5a4.002 4.002 0 00-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 007.86 0h3.32a.75.75 0 010 1.5h-3.32zm-1.43-.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><path fill="${iconColor}" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><path fill="${iconColor}" d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path fill="${iconColor}" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><path fill="${iconColor}" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>`,
  ];

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
        <g transform="translate(0, ${y - 11})">${icons[i]}</g>
        <text class="stat" x="20" y="${y}">${label}</text>
        <text class="stat" x="255" y="${y}">${Number(value).toLocaleString()}</text>
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
      font: 700 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
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

  <rect x="0" y="0" rx="${border_radius}" width="${width}" height="${height}"
    fill="${colors.bgColor}" stroke="${colors.borderColor}" stroke-width="1" />

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
