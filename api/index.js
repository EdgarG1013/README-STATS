import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import {
  fetchStats,
  fetchLanguages,
  fetchContributions,
  fetchStreakData,
  themes,
} from "./card.js";
import { MissingParamError } from "../src/common/utils.js";
import { getCardColors } from "../src/common/utils.js";
import { renderStatsCard } from "../src/cards/stats.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderStreakCard } from "../src/cards/streak-card.js";

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderContributionsCard(username, contributionDays, options) {
  const colors = getCardColors({
    title_color: options.title_color,
    text_color: options.text_color,
    icon_color: options.icon_color,
    bg_color: options.bg_color,
    border_color: options.border_color,
    theme: options.theme || "default",
  });

  if (!contributionDays || contributionDays.length === 0) {
    contributionDays = [{ date: new Date().toISOString().split("T")[0], count: 0 }];
  }

  const width = 650;
  const height = 320;
  const border_radius = 14;
  const padding = { top: 60, right: 35, bottom: 55, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const rawMax = Math.max(...contributionDays.map((d) => d.count), 1);
  const niceStep = (() => {
    const roughStep = rawMax / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
    const residual = roughStep / magnitude;
    let step;
    if (residual > 5) step = 10 * magnitude;
    else if (residual > 2) step = 5 * magnitude;
    else if (residual > 1) step = 2 * magnitude;
    else step = magnitude;
    return Math.max(1, Math.round(step));
  })();
  const maxCount = niceStep * Math.ceil(rawMax / niceStep);

  const denom = Math.max(contributionDays.length - 1, 1);
  const points = contributionDays.map((d, i) => ({
    x: padding.left + (i / denom) * chartW,
    y: padding.top + chartH - (d.count / maxCount) * chartH,
    count: d.count,
    date: d.date,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const fillPathD =
    pathD +
    ` L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartH}` +
    ` L ${points[0].x.toFixed(1)} ${padding.top + chartH} Z`;

  const gridSteps = [];
  for (let v = 0; v <= maxCount; v += niceStep) {
    gridSteps.push(v);
  }

  const gridLines = gridSteps.map((val) => {
    const y = padding.top + chartH - (val / maxCount) * chartH;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${colors.borderColor}" stroke-width="0.5" stroke-dasharray="3,3"/>
    <text x="${padding.left - 14}" y="${y + 4}" class="axis-label" text-anchor="end">${val}</text>`;
  });

  const xLabelStep = Math.max(1, Math.ceil(points.length / 18));
  const xLabels = points
    .filter((_, i) => i % xLabelStep === 0 || i === points.length - 1)
    .map((p) => {
      const day = new Date(p.date + "T00:00:00").getDate();
      return `<text x="${p.x.toFixed(1)}" y="${height - padding.bottom + 26}" class="axis-label" text-anchor="middle">${day}</text>`;
    });

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header { font: 600 17px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.titleColor}; }
    .axis-label { font: 400 11px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor}; }
    .axis-title { font: 400 11px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor}; }
  </style>
  <defs>
    <linearGradient id="contribFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colors.iconColor}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${colors.iconColor}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" rx="${border_radius}" height="99%" stroke="${colors.borderColor}" width="${width - 1}" fill="${colors.bgColor}"/>
  <text data-testid="card-title" x="${width / 2}" y="34" class="header" text-anchor="middle">${escapeXml(username)}'s Contribution Graph</text>
  ${gridLines.join("\n  ")}
  <text x="20" y="${padding.top + chartH / 2}" class="axis-title" text-anchor="middle" transform="rotate(-90, 20, ${padding.top + chartH / 2})">Contributions</text>
  <path d="${fillPathD}" fill="url(#contribFill)"/>
  <path d="${pathD}" fill="none" stroke="${colors.iconColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${points.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${colors.iconColor}" stroke="${colors.bgColor}" stroke-width="1.5" opacity="0.95"/>`).join("\n  ")}
  ${xLabels.join("\n  ")}
  <text x="${width / 2}" y="${height - 12}" class="axis-title" text-anchor="middle">Days</text>
</svg>`;

  return svg;
}

// Builds the theme options expected by the ESM renderers from query params.
function buildTheme(query) {
  return {
    theme: query.theme || "dracula",
    title_color: query.title_color,
    text_color: query.text_color,
    icon_color: query.icon_color,
    bg_color: query.bg_color,
    border_color: query.border_color,
    ring_color: query.ring_color,
    hide_border: query.hide_border === "true",
    hide_title: query.hide_title === "true",
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use("/static", express.static(path.join(ROOT_DIR, "ui")));

// Serve frontend root
app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "ui", "index.html"));
});

// Themes endpoint
app.get("/api/themes", (req, res) => {
  res.json({ themes: Object.keys(themes), details: themes });
});

// Stats card endpoint
app.get("/api/card/stats", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Missing username parameter" });
  }

  try {
    const stats = await fetchStats(username);
    const svg = renderStatsCard(stats, buildTheme(req.query));
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
    res.send(svg);
  } catch (error) {
    console.error("Stats card error:", error);
    res.status(error instanceof MissingParamError ? 400 : 500).json({
      error: error.message,
      secondaryMessage: error.secondaryMessage,
    });
  }
});

// Languages card endpoint
app.get("/api/card/languages", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Missing username parameter" });
  }

  try {
    const langMap = await fetchLanguages(username);
    const langsCount = req.query.langs_count ? parseInt(req.query.langs_count) : 6;
    const languages = Object.values(langMap)
      .sort((a, b) => b.size - a.size)
      .slice(0, langsCount);
    const svg = renderTopLanguages(languages, buildTheme(req.query));
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
    res.send(svg);
  } catch (error) {
    console.error("Languages card error:", error);
    res.status(500).json({
      error: error.message,
      secondaryMessage: error.secondaryMessage,
    });
  }
});

// Streak card endpoint
app.get("/api/card/streak", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Missing username parameter" });
  }

  try {
    const raw = await fetchStreakData(username);
    const svg = renderStreakCard(username, raw, buildTheme(req.query));
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
    res.send(svg);
  } catch (error) {
    console.error("Streak card error:", error);
    res.status(500).json({
      error: error.message,
      secondaryMessage: error.secondaryMessage,
    });
  }
});

// Contributions graph endpoint
app.get("/api/card/contributions", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Missing username parameter" });
  }

  try {
    const { weeks } = await fetchContributions(username);
    const allDays = (weeks || []).flatMap((week) =>
      week.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
    );
    const days = req.query.days ? parseInt(req.query.days) : 31;
    const contributionDays = allDays.slice(-days);
    const svg = renderContributionsCard(username, contributionDays, buildTheme(req.query));
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
    res.send(svg);
  } catch (error) {
    console.error("Contributions card error:", error);
    res.status(500).json({
      error: error.message,
      secondaryMessage: error.secondaryMessage,
    });
  }
});

// All cards endpoint
app.get("/api/card/all", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Missing username parameter" });
  }

  try {
    const theme = buildTheme(req.query);
    const [stats, langMap, rawStreak, contributions] = await Promise.all([
      fetchStats(username),
      fetchLanguages(username),
      fetchStreakData(username),
      fetchContributions(username),
    ]);

    const langsCount = req.query.langs_count ? parseInt(req.query.langs_count) : 6;
    const languages = Object.values(langMap)
      .sort((a, b) => b.size - a.size)
      .slice(0, langsCount);

    const streakData = {
      totalContributions: rawStreak.totalContributions,
      currentStreak: rawStreak.currentStreak,
      longestStreak: rawStreak.longestStreak,
      currentStreakStart: rawStreak.currentStreakStart,
      currentStreakEnd: rawStreak.currentStreakEnd,
      longestStreakStart: rawStreak.longestStreakStart,
      longestStreakEnd: rawStreak.longestStreakEnd,
      firstContribution: rawStreak.firstContribution,
    };

    const allDays = (contributions.weeks || []).flatMap((week) =>
      week.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
    );
    const days = req.query.days ? parseInt(req.query.days) : 31;
    const contributionDays = allDays.slice(-days);

    const statsSvg = renderStatsCard(stats, theme);
    const langsSvg = renderTopLanguages(languages, theme);
    const streakSvg = renderStreakCard(username, streakData, theme);
    const contribSvg = renderContributionsCard(username, contributionDays, theme);

    // Each card is a fully independent, self-styled SVG document (own <style> classes).
    // Embedding them as base64 data-URI <image> tags -- rather than pasting the markup
    // into one shared <svg> -- avoids class-name collisions (.header, .stat-big, etc.)
    // between cards while keeping everything inside a single downloadable image.
    const toDataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

    const gap = 16;
    // Each card renders at its own natural width/height (the contributions
    // graph is wider than the other three cards).
    const sizes = [
      { w: 495, h: 220 },
      { w: 495, h: 194 },
      { w: 495, h: 195 },
      { w: 650, h: 320 },
    ];
    const cardWidth = Math.max(...sizes.map((s) => s.w));
    const totalHeight = sizes.reduce((a, s) => a + s.h, 0) + gap * (sizes.length - 1);

    let y = 0;
    const images = [statsSvg, langsSvg, streakSvg, contribSvg]
      .map((svg, i) => {
        const { w, h } = sizes[i];
        const img = `<image x="0" y="${y}" width="${w}" height="${h}" href="${toDataUri(svg)}"/>`;
        y += h + gap;
        return img;
      })
      .join("\n        ");

    const combined = `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${totalHeight}" viewBox="0 0 ${cardWidth} ${totalHeight}">
        ${images}
      </svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
    res.send(combined);
  } catch (error) {
    console.error("Combined card error:", error);
    res.status(500).json({
      error: error.message,
      secondaryMessage: error.secondaryMessage,
    });
  }
});

export default app;
