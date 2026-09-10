const { getCardColors } = require('../themes.cjs');

function renderStreakCard(streakData, theme) {
  const colors = getCardColors({
    title_color: theme.title_color,
    text_color: theme.text_color,
    icon_color: theme.icon_color,
    bg_color: theme.bg_color,
    border_color: theme.border_color,
    ring_color: theme.ring_color,
    theme: theme.themeName,
  });

  const {
    totalContributions,
    currentStreak,
    longestStreak,
    streakStart,
    streakEnd,
    longestStreakStart,
    longestStreakEnd,
    contributionsSince,
  } = streakData;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentRange = streakStart && streakEnd
    ? `${formatDate(streakStart)} - ${formatDate(streakEnd)}`
    : 'N/A';
  const longestRange = longestStreakStart && longestStreakEnd
    ? `${formatDate(longestStreakStart)} - ${formatDate(longestStreakEnd)}`
    : currentRange;
  const totalRange = contributionsSince
    ? `${formatDate(contributionsSince)} - Present`
    : 'Past year';

  const width = 495;
  const height = 195;
  const border_radius = theme.border_radius != null ? theme.border_radius : 14;
  const paddingX = 25;
  const paddingY = 30;

  const ringRadius = 38;
  const circumference = 2 * Math.PI * ringRadius;
  const ringPct = Math.min(currentStreak / Math.max(longestStreak, 1), 1);
  const ringOffset = circumference * (1 - ringPct);

  const col1X = paddingX + 72;
  const col2X = width / 2;
  const col3X = width - paddingX - 72;
  const dividerTop = paddingY + 5;
  const dividerBottom = height - paddingY - 5;

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .stat-big {
      font: 800 32px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.iconColor};
    }
    .stat-label {
      font: 600 12px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.titleColor};
    }
    .stat-date {
      font: 400 11px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
      opacity: 0.85;
    }
    .rank-text {
      font: 800 26px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.iconColor};
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

  <!-- Divider lines -->
  <line x1="${col2X - 50}" y1="${dividerTop}" x2="${col2X - 50}" y2="${dividerBottom}" stroke="${colors.borderColor}" stroke-width="1"/>
  <line x1="${col2X + 50}" y1="${dividerTop}" x2="${col2X + 50}" y2="${dividerBottom}" stroke="${colors.borderColor}" stroke-width="1"/>

  <!-- Total Contributions -->
  <text x="${col1X}" y="${paddingY + 45}" class="stat-big" text-anchor="middle">${totalContributions.toLocaleString()}</text>
  <text x="${col1X}" y="${paddingY + 70}" class="stat-label" text-anchor="middle">Total Contributions</text>
  <text x="${col1X}" y="${paddingY + 88}" class="stat-date" text-anchor="middle">${totalRange}</text>

  <!-- Current Streak -->
  <g transform="translate(${col2X}, ${paddingY + 42})">
    <circle cx="0" cy="0" r="${ringRadius}" fill="none" class="rank-circle-rim"/>
    <circle cx="0" cy="0" r="${ringRadius}" fill="none" class="rank-circle"
      stroke-dashoffset="${ringOffset}" transform="rotate(-90)"/>
    <text x="0" y="8" class="rank-text" text-anchor="middle">${currentStreak}</text>
  </g>
  <text x="${col2X}" y="${paddingY + 100}" class="stat-label" text-anchor="middle">Current Streak</text>
  <text x="${col2X}" y="${paddingY + 118}" class="stat-date" text-anchor="middle">${currentRange}</text>

  <!-- Longest Streak -->
  <text x="${col3X}" y="${paddingY + 45}" class="stat-big" text-anchor="middle">${longestStreak}</text>
  <text x="${col3X}" y="${paddingY + 70}" class="stat-label" text-anchor="middle">Longest Streak</text>
  <text x="${col3X}" y="${paddingY + 88}" class="stat-date" text-anchor="middle">${longestRange}</text>
</svg>`;

  return svg;
}

module.exports = { renderStreakCard };
