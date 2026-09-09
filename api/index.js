import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { renderStats, renderLanguages, renderStreak, fetchContributions, themes } from "./card.js";
import { MissingParamError } from "../src/common/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use("/static", express.static(path.join(__dirname, "ui")));

// Serve frontend root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "ui", "index.html"));
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
    const svg = await renderStats(username, req.query);
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
    const svg = await renderLanguages(username, req.query);
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
    const svg = await renderStreak(username, req.query);
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
    const contributions = await fetchContributions(username);
    const svg = renderContributionsGraph(contributions, req.query);
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

// Render contributions graph
function renderContributionsGraph(data, options = {}) {
  const {
    theme = "dark",
    title_color,
    text_color,
    bg_color,
    border_color,
    hide_border = false,
    custom_title = "Contribution Activity",
  } = options;

  const defaultTheme = themes[theme] || themes.default;

  const titleColor = title_color || defaultTheme.title_color;
  const textColor = text_color || defaultTheme.text_color;
  const bgColor = bg_color || defaultTheme.bg_color;
  const borderColor = border_color || defaultTheme.border_color;

  const weeks = data.weeks || [];
  const allDays = weeks.flatMap((week) => week.contributionDays);
  const maxContributions = Math.max(...allDays.map((d) => d.contributionCount), 1);

  const width = 722;
  const height = 120;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Create the contribution bars
  let bars = "";
  const totalDays = allDays.length;
  const barWidth = chartWidth / totalDays;

  allDays.forEach((day, i) => {
    const barHeight = Math.max((day.contributionCount / maxContributions) * chartHeight, 1);
    const x = padding.left + i * barWidth;
    const y = padding.top + (chartHeight - barHeight);
    const opacity = day.contributionCount === 0 ? 0.1 : Math.max(0.3, day.contributionCount / maxContributions);

    bars += `<rect x="${x}" y="${y}" width="${Math.max(barWidth - 1, 1)}" height="${barHeight}" rx="1" fill="#${textColor}" opacity="${opacity}">
      <title>${day.date}: ${day.contributionCount} contributions</title>
    </rect>`;
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <style>
        .title { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${titleColor}; }
        .text { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${textColor}; }
      </style>
      
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="4.5" fill="#${bgColor}" stroke="${hide_border ? "none" : `#${borderColor}`}"/>
      
      <text x="15" y="16" class="title">${custom_title}</text>
      
      ${bars}
    </svg>
  `;
}

// All cards endpoint
app.get("/api/card/all", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Missing username parameter" });
  }

  try {
    const [statsSvg, langsSvg, streakSvg] = await Promise.all([
      renderStats(username, req.query),
      renderLanguages(username, req.query),
      renderStreak(username, req.query),
    ]);

    const combined = `
      <svg xmlns="http://www.w3.org/2000/svg" width="495" height="500" viewBox="0 0 495 500">
        <foreignObject x="0" y="0" width="495" height="170">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${statsSvg.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
          </div>
        </foreignObject>
        <foreignObject x="0" y="180" width="495" height="100">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${langsSvg.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
          </div>
        </foreignObject>
        <foreignObject x="0" y="290" width="495" height="195">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${streakSvg.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
          </div>
        </foreignObject>
      </svg>
    `;

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
