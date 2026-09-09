const express = require('express');
const { fetchGitHubData } = require('./github');
const { renderStatsCard } = require('./cards/stats');
const { renderLanguagesCard } = require('./cards/languages');
const { renderStreakCard } = require('./cards/streak');
const { renderContributionsCard } = require('./cards/contributions');
const { themes, getCardColors } = require('./themes');

const app = express();

const CACHE_HEADERS = 'max-age=0, no-cache, no-store, must-revalidate';

app.get('/api', async (req, res) => {
  try {
    const username = req.query.username;
    const themeName = req.query.theme || 'default';
    const card = req.query.card || 'all';
    const token = process.env.GITHUB_TOKEN || null;

    if (!username) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: 'Missing required query parameter: username',
        usage: '/api?username=YOUR_USERNAME&theme=default&card=all',
        available_themes: Object.keys(themes),
        available_cards: ['stats', 'languages', 'streak', 'contributions', 'all'],
      });
    }

    const selectedTheme = themes[themeName] || themes["default"];
    const themeConfig = { ...selectedTheme, themeName };

    const data = await fetchGitHubData(username, token);

    let svg;
    switch (card) {
      case 'stats':
        svg = renderStatsCard(data, themeConfig);
        break;
      case 'languages':
        svg = renderLanguagesCard(data.languages, themeConfig);
        break;
      case 'streak':
        svg = renderStreakCard(data.streakData, themeConfig);
        break;
      case 'contributions':
        svg = renderContributionsCard(username, data.contributionDays, themeConfig);
        break;
      default:
        svg = renderCombinedCard(data, username, themeConfig);
        break;
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', CACHE_HEADERS);
    return res.status(200).send(svg);
  } catch (err) {
    const errorSvg = `<svg width="495" height="120" viewBox="0 0 495 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .err-title { font: 600 16px 'Segoe UI', Ubuntu, sans-serif; fill: #e06c75; }
    .err-msg { font: 400 12px 'Segoe UI', Ubuntu, sans-serif; fill: #8b949e; }
  </style>
  <rect x="0.5" y="0.5" rx="14" height="99%" stroke="#e4e2e2" width="494" fill="#fffefe"/>
  <text x="247" y="45" class="err-title" text-anchor="middle">Error</text>
  <text x="247" y="72" class="err-msg" text-anchor="middle">${escapeXml(err.message)}</text>
  <text x="247" y="100" class="err-msg" text-anchor="middle">Usage: ?username=YOUR_GITHUB_USERNAME</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', CACHE_HEADERS);
    return res.status(400).send(errorSvg);
  }
});

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    name: 'GitHub README Stats API',
    version: '1.0.0',
    endpoints: {
      stats: '/api?username=USERNAME&theme=default&card=stats',
      languages: '/api?username=USERNAME&theme=default&card=languages',
      streak: '/api?username=USERNAME&theme=default&card=streak',
      contributions: '/api?username=USERNAME&theme=default&card=contributions',
      all: '/api?username=USERNAME&theme=default&card=all',
    },
    themes: Object.keys(themes),
  });
});

function renderCombinedCard(data, username, themeConfig) {
  const statsSvg = renderStatsCard(data, themeConfig);
  const langSvg = renderLanguagesCard(data.languages, themeConfig);
  const streakSvg = renderStreakCard(data.streakData, themeConfig);
  const contribSvg = renderContributionsCard(username, data.contributionDays, themeConfig);

  const stripSvg = (svg) => {
    return svg
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>/, '');
  };

  const gap = 15;
  const totalHeight = 220 + gap + 180 + gap + 195 + gap + 240;

  const colors = getCardColors({
    title_color: themeConfig.title_color,
    text_color: themeConfig.text_color,
    icon_color: themeConfig.icon_color,
    bg_color: themeConfig.bg_color,
    border_color: themeConfig.border_color,
    theme: themeConfig.themeName,
  });

  return `<svg width="495" height="${totalHeight}" viewBox="0 0 495 ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      stroke-width: 6;
      stroke-linecap: round;
    }
    .rank-circle-rim {
      stroke: ${colors.ringColor};
      stroke-width: 6;
      opacity: 0.2;
    }
    .lang-name {
      font: 400 11px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
    }
    .stat-big {
      font: 800 32px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.titleColor};
    }
    .stat-label {
      font: 600 12px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.titleColor};
    }
    .stat-date {
      font: 400 11px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
    }
    .axis-label {
      font: 400 10px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
      fill: ${colors.textColor};
    }
  </style>

  <rect x="0.5" y="0.5" rx="14" height="99%" stroke="${colors.borderColor}" width="494" fill="${colors.bgColor}"/>

  <g transform="translate(0, 0)">
    ${stripSvg(statsSvg)}
  </g>
  <g transform="translate(0, ${220 + gap})">
    ${stripSvg(langSvg)}
  </g>
  <g transform="translate(0, ${220 + gap + 180 + gap})">
    ${stripSvg(streakSvg)}
  </g>
  <g transform="translate(0, ${220 + gap + 180 + gap + 195 + gap})">
    ${stripSvg(contribSvg)}
  </g>
</svg>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = app;
