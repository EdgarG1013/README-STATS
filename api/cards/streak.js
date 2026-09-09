function renderStreakCard(streakData, theme) {
  const t = theme;
  const { totalContributions, currentStreak, longestStreak, streakStart, streakEnd } = streakData;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dateRange = streakStart && streakEnd
    ? `${formatDate(streakStart)} - ${formatDate(streakEnd)}`
    : 'N/A';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="150" viewBox="0 0 495 150">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Segoe+UI&amp;display=swap');
      text { font-family: 'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  <rect width="495" height="150" rx="12" fill="${t.cardBg}" stroke="${t.border}" stroke-width="1"/>

  <!-- Total Contributions -->
  <text x="100" y="36" fill="${t.accent}" font-size="32" font-weight="bold" text-anchor="middle">${totalContributions}</text>
  <text x="100" y="56" fill="${t.titleColor}" font-size="12" text-anchor="middle">Total Contributions</text>
  <text x="100" y="74" fill="${t.statLabel}" font-size="11" text-anchor="middle">Aug 3, 2025 - Present</text>

  <!-- Current Streak -->
  <g transform="translate(247, 50)">
    <circle cx="0" cy="-8" r="38" fill="none" stroke="${t.ringBg}" stroke-width="6"/>
    <circle cx="0" cy="-8" r="38" fill="none" stroke="${t.accent}" stroke-width="6"
      stroke-dasharray="${2 * Math.PI * 38}" stroke-dashoffset="${2 * Math.PI * 38 * (1 - Math.min(currentStreak / 365, 1))}"
      stroke-linecap="round" transform="rotate(-90)"/>
    <text x="0" y="0" fill="${t.accent}" font-size="28" font-weight="bold" text-anchor="middle">${currentStreak}</text>
  </g>
  <text x="247" y="108" fill="${t.accent}" font-size="12" font-weight="bold" text-anchor="middle">Current Streak</text>
  <text x="247" y="126" fill="${t.statLabel}" font-size="11" text-anchor="middle">${dateRange}</text>

  <!-- Longest Streak -->
  <text x="394" y="36" fill="${t.accent}" font-size="32" font-weight="bold" text-anchor="middle">${longestStreak}</text>
  <text x="394" y="56" fill="${t.titleColor}" font-size="12" text-anchor="middle">Longest Streak</text>
  <text x="394" y="74" fill="${t.statLabel}" font-size="11" text-anchor="middle">${dateRange}</text>
</svg>`;

  return svg;
}

module.exports = { renderStreakCard };
