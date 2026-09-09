const express = require('express');
const { fetchGitHubData } = require('./github');
const { renderStatsCard } = require('./cards/stats');
const { renderLanguagesCard } = require('./cards/languages');
const { renderStreakCard } = require('./cards/streak');
const { renderContributionsCard } = require('./cards/contributions');
const themes = require('./themes');

const app = express();

const CACHE_HEADERS = 'max-age=0, no-cache, no-store, must-revalidate';
const SVG_HEADERS = {
  'Content-Type': 'image/svg+xml',
  'Cache-Control': CACHE_HEADERS,
};

app.get('/api', async (req, res) => {
  try {
    const username = req.query.username;
    const themeName = req.query.theme || 'dark';
    const card = req.query.card || 'all';
    const token = process.env.GITHUB_TOKEN || null;

    if (!username) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: 'Missing required query parameter: username',
        usage: '/api?username=YOUR_USERNAME&theme=dark&card=all',
        available_themes: Object.keys(themes),
        available_cards: ['stats', 'languages', 'streak', 'contributions', 'all'],
      });
    }

    const theme = themes[themeName] || themes.dark;
    const data = await fetchGitHubData(username, token);

    let svg;
    switch (card) {
      case 'stats':
        svg = renderStatsCard(data, theme);
        break;
      case 'languages':
        svg = renderLanguagesCard(data.languages, theme);
        break;
      case 'streak':
        svg = renderStreakCard(data.streakData, theme);
        break;
      case 'contributions':
        svg = renderContributionsCard(username, data.contributionDays, theme);
        break;
      default:
        svg = renderCombinedCard(data, username, theme);
        break;
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', CACHE_HEADERS);
    return res.status(200).send(svg);
  } catch (err) {
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="120" viewBox="0 0 495 120">
  <rect width="495" height="120" rx="12" fill="#161b22" stroke="#30363d" stroke-width="1"/>
  <text x="247" y="45" fill="#e06c75" font-size="16" font-weight="bold" text-anchor="middle" font-family="Segoe UI, sans-serif">Error</text>
  <text x="247" y="72" fill="#8b949e" font-size="12" text-anchor="middle" font-family="Segoe UI, sans-serif">${escapeXml(err.message)}</text>
  <text x="247" y="100" fill="#8b949e" font-size="11" text-anchor="middle" font-family="Segoe UI, sans-serif">Usage: ?username=YOUR_GITHUB_USERNAME</text>
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
      stats: '/api?username=USERNAME&theme=dark&card=stats',
      languages: '/api?username=USERNAME&theme=dark&card=languages',
      streak: '/api?username=USERNAME&theme=dark&card=streak',
      contributions: '/api?username=USERNAME&theme=dark&card=contributions',
      all: '/api?username=USERNAME&theme=dark&card=all',
    },
    themes: Object.keys(themes),
  });
});

function renderCombinedCard(data, username, theme) {
  const statsSvg = renderStatsCard(data, theme);
  const langSvg = renderLanguagesCard(data.languages, theme);
  const streakSvg = renderStreakCard(data.streakData, theme);
  const contribSvg = renderContributionsCard(username, data.contributionDays, theme);

  const stripSvg = (svg) => {
    return svg
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>/, '');
  };

  const totalHeight = 200 + 15 + 170 + 15 + 150 + 15 + 220;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="${totalHeight}" viewBox="0 0 495 ${totalHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Segoe+UI&amp;display=swap');
      text { font-family: 'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  <g transform="translate(0, 0)">
    ${stripSvg(statsSvg)}
  </g>
  <g transform="translate(0, 215)">
    ${stripSvg(langSvg)}
  </g>
  <g transform="translate(0, 400)">
    ${stripSvg(streakSvg)}
  </g>
  <g transform="translate(0, 565)">
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
