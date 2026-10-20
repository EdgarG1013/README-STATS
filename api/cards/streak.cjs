const { escapeXml, resolveColors, cardFrame } = require('./common.cjs');
const { translator, formatNumber } = require('./i18n.cjs');

// Flame icon (Material "whatshot"), drawn centered on (0, 0) at ~16x22px.
const FIRE_PATH =
  'M 1.5 -10.33 C 1.5 -10.33 2.24 -7.68 2.24 -5.53 C 2.24 -3.47 0.89 -1.8 -1.17 -1.8 ' +
  'C -3.23 -1.8 -4.79 -3.47 -4.79 -5.53 L -4.76 -5.89 C -6.78 -3.49 -8 -0.38 -8 3 ' +
  'C -8 7.42 -4.42 11 0 11 C 4.42 11 8 7.42 8 3 C 8 -2.39 5.41 -7.2 1.5 -10.33 Z ' +
  'M -0.29 8 C -2.07 8 -3.51 6.6 -3.51 4.86 C -3.51 3.24 -2.46 2.1 -0.7 1.74 ' +
  'C 1.07 1.38 2.9 0.53 3.92 -0.84 C 4.31 0.45 4.51 1.81 4.51 3.2 C 4.51 5.85 2.36 8 -0.29 8 Z';

function renderStreakCard(streakData, theme) {
  const colors = resolveColors(theme);
  const locale = theme.locale || 'en';
  const t = translator(locale);

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

  const thisYear = new Date().getFullYear();
  // "Aug 12" for dates in the current year, "Aug 4, 2025" otherwise.
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00Z`);
    const opts = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    if (d.getUTCFullYear() !== thisYear) opts.year = 'numeric';
    return d.toLocaleDateString(locale, opts);
  };
  const range = (start, end) => {
    if (!start) return '';
    return start === end ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`;
  };

  const totalRange = contributionsSince ? `${formatDate(contributionsSince)} - ${t('present')}` : '';
  const currentRange = currentStreak > 0 ? range(streakStart, streakEnd) : '';
  const longestRange = longestStreak > 0 ? range(longestStreakStart || streakStart, longestStreakEnd || streakEnd) : '';

  const width = 495;
  const height = 195;
  const col = width / 3;
  const leftX = col / 2;
  const midX = width / 2;
  const rightX = width - col / 2;

  const ringY = 71;
  const ringR = 40;
  const fireY = ringY - ringR;

  const sideColumn = (x, value, label, dates) => `
  <g transform="translate(${x}, 0)">
    <text x="0" y="88" class="stat-big" text-anchor="middle">${formatNumber(value, locale)}</text>
    <text x="0" y="122" class="stat-label" text-anchor="middle">${escapeXml(label)}</text>
    ${dates ? `<text x="0" y="148" class="stat-date" text-anchor="middle">${escapeXml(dates)}</text>` : ''}
  </g>`;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .stat-big { font: 700 28px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor}; }
    .stat-label { font: 400 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor}; }
    .stat-date { font: 400 12px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor}; opacity: 0.85; }
    .streak-num { font: 700 28px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.ringColor}; }
    .streak-label { font: 400 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.ringColor}; }
  </style>

  <defs>
    <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Cuts a gap in the ring behind the flame, so it works on solid and gradient backgrounds -->
    <mask id="ringMask">
      <rect width="${width}" height="${height}" fill="white"/>
      <circle cx="${midX}" cy="${fireY}" r="13" fill="black"/>
    </mask>
  </defs>

  ${cardFrame({ width, height, colors, theme })}

  <line x1="${col}" y1="28" x2="${col}" y2="${height - 28}" stroke="${colors.textColor}" stroke-opacity="0.35" stroke-width="1"/>
  <line x1="${col * 2}" y1="28" x2="${col * 2}" y2="${height - 28}" stroke="${colors.textColor}" stroke-opacity="0.35" stroke-width="1"/>

  ${sideColumn(leftX, totalContributions, t('totalContributions'), totalRange)}

  <g mask="url(#ringMask)">
    <circle cx="${midX}" cy="${ringY}" r="${ringR}" stroke="${colors.ringColor}" stroke-width="5" fill="none" filter="url(#ringGlow)"/>
  </g>
  <path transform="translate(${midX}, ${fireY})" d="${FIRE_PATH}" fill="${colors.ringColor}" filter="url(#ringGlow)"/>
  <text x="${midX}" y="${ringY + 10}" class="streak-num" text-anchor="middle">${formatNumber(currentStreak, locale)}</text>
  <text x="${midX}" y="${ringY + ringR + 25}" class="streak-label" text-anchor="middle">${escapeXml(t('currentStreak'))}</text>
  ${currentRange ? `<text x="${midX}" y="${ringY + ringR + 48}" class="stat-date" text-anchor="middle">${escapeXml(currentRange)}</text>` : ''}

  ${sideColumn(rightX, longestStreak, t('longestStreak'), longestRange)}
</svg>`;
}

module.exports = { renderStreakCard };
