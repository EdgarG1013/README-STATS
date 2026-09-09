function renderStreakCard(streakData, theme) {
  const t = theme;
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

  // Current streak and longest streak can cover different date ranges, so
  // each gets its own range instead of sharing one (that was the bug making
  // the "Longest Streak" dates always mirror the current streak).
  const currentRange = streakStart && streakEnd
    ? `${formatDate(streakStart)} - ${formatDate(streakEnd)}`
    : 'N/A';
  const longestRange = longestStreakStart && longestStreakEnd
    ? `${formatDate(longestStreakStart)} - ${formatDate(longestStreakEnd)}`
    : 'N/A';
  const totalRange = contributionsSince
    ? `${formatDate(contributionsSince)} - Present`
    : 'Past year';

  const width = 495;
  const height = 195;
  const ringR = 40;
  const ringC = 2 * Math.PI * ringR;
  // Ring fill is relative to the longest streak on record (min 1 to avoid
  // divide-by-zero), so "current" reads as a share of the personal best
  // instead of an arbitrary /365 scale that made a healthy streak look
  // almost empty.
  const ringPct = Math.min(currentStreak / Math.max(longestStreak, 1), 1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Segoe+UI&amp;display=swap');
      text { font-family: 'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  <rect width="${width}" height="${height}" rx="14" fill="${t.cardBg}" stroke="${t.border}" stroke-width="1"/>

  <!-- Total Contributions -->
  <text x="98" y="70" fill="${t.accent}" font-size="34" font-weight="bold" text-anchor="middle">${totalContributions.toLocaleString()}</text>
  <text x="98" y="94" fill="${t.accent}" font-size="13" font-weight="bold" text-anchor="middle">Total Contributions</text>
  <text x="98" y="114" fill="${t.statLabel}" font-size="11" text-anchor="middle">${totalRange}</text>

  <line x1="197" y1="30" x2="197" y2="165" stroke="${t.border}" stroke-width="1"/>
  <line x1="393" y1="30" x2="393" y2="165" stroke="${t.border}" stroke-width="1"/>

  <!-- Current Streak -->
  <g transform="translate(295, 68)">
    <circle cx="0" cy="0" r="${ringR}" fill="none" stroke="${t.ringBg}" stroke-width="7"/>
    <circle cx="0" cy="0" r="${ringR}" fill="none" stroke="${t.accent}" stroke-width="7"
      stroke-dasharray="${ringC}" stroke-dashoffset="${ringC * (1 - ringPct)}"
      stroke-linecap="round" transform="rotate(-90)"/>
    <text x="0" y="9" fill="${t.accent}" font-size="30" font-weight="bold" text-anchor="middle">${currentStreak}</text>
  </g>
  <text x="295" y="130" fill="${t.accent}" font-size="13" font-weight="bold" text-anchor="middle">Current Streak</text>
  <text x="295" y="150" fill="${t.statLabel}" font-size="11" text-anchor="middle">${currentRange}</text>

  <!-- Longest Streak -->
  <text x="443" y="70" fill="${t.accent}" font-size="34" font-weight="bold" text-anchor="middle">${longestStreak}</text>
  <text x="443" y="94" fill="${t.accent}" font-size="13" font-weight="bold" text-anchor="middle">Longest Streak</text>
  <text x="443" y="114" fill="${t.statLabel}" font-size="11" text-anchor="middle">${longestRange}</text>
</svg>`;

  return svg;
}

module.exports = { renderStreakCard };
