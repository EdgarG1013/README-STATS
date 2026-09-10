import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import {
  fetchStats,
  fetchLanguages,
  fetchContributions,
  fetchStreakData,
  themes,
} from "./card.js";
import { MissingParamError } from "../src/common/utils.js";

// The polished, screenshot-matching renderers live in ./cards/*.js as CommonJS modules.
const require = createRequire(import.meta.url);
const { renderStatsCard } = require("./cards/stats.cjs");
const { renderLanguagesCard } = require("./cards/languages.cjs");
const { renderStreakCard } = require("./cards/streak.cjs");
const { renderContributionsCard } = require("./cards/contributions.cjs");

// Builds the theme object expected by the ./cards/*.js renderers from query params.
// Defaults to the "dracula" palette (dark navy card, pink titles, cyan accents).
function buildTheme(query) {
  return {
    themeName: query.theme || "dracula",
    title_color: query.title_color,
    text_color: query.text_color,
    icon_color: query.icon_color,
    bg_color: query.bg_color,
    border_color: query.border_color,
    ring_color: query.ring_color,
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
    const svg = renderLanguagesCard(languages, buildTheme(req.query));
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
    const streakData = {
      totalContributions: raw.totalContributions,
      currentStreak: raw.currentStreak,
      longestStreak: raw.longestStreak,
      streakStart: raw.currentStreakStart,
      streakEnd: raw.currentStreakEnd,
      longestStreakStart: raw.longestStreakStart,
      longestStreakEnd: raw.longestStreakEnd,
      contributionsSince: raw.firstContribution,
    };
    const svg = renderStreakCard(streakData, buildTheme(req.query));
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
      streakStart: rawStreak.currentStreakStart,
      streakEnd: rawStreak.currentStreakEnd,
      longestStreakStart: rawStreak.longestStreakStart,
      longestStreakEnd: rawStreak.longestStreakEnd,
      contributionsSince: rawStreak.firstContribution,
    };

    const allDays = (contributions.weeks || []).flatMap((week) =>
      week.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
    );
    const days = req.query.days ? parseInt(req.query.days) : 31;
    const contributionDays = allDays.slice(-days);

    const statsSvg = renderStatsCard(stats, theme);
    const langsSvg = renderLanguagesCard(languages, theme);
    const streakSvg = renderStreakCard(streakData, theme);
    const contribSvg = renderContributionsCard(username, contributionDays, theme);

    // Each card is a fully independent, self-styled SVG document (own <style> classes).
    // Embedding them as base64 data-URI <image> tags -- rather than pasting the markup
    // into one shared <svg> -- avoids class-name collisions (.header, .stat-big, etc.)
    // between cards while keeping everything inside a single downloadable image.
    const toDataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

    const gap = 16;
    const cardWidth = 495;
    const heights = [220, 180, 195, 240];
    const totalHeight = heights.reduce((a, b) => a + b, 0) + gap * (heights.length - 1);

    let y = 0;
    const images = [statsSvg, langsSvg, streakSvg, contribSvg]
      .map((svg, i) => {
        const h = heights[i];
        const img = `<image x="0" y="${y}" width="${cardWidth}" height="${h}" href="${toDataUri(svg)}"/>`;
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
