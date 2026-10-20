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
import { isValidUsername, parseCardOptions } from "./options.js";

// The polished, screenshot-matching renderers live in ./cards/*.cjs as CommonJS modules.
const require = createRequire(import.meta.url);
const { renderStatsCard } = require("./cards/stats.cjs");
const { renderLanguagesCard } = require("./cards/languages.cjs");
const { renderStreakCard } = require("./cards/streak.cjs");
const { renderContributionsCard } = require("./cards/contributions.cjs");
const { themes: renderThemes } = require("./themes.cjs");

// The renderers only know the themes in ./themes.cjs. Themes that exist only in
// src/themes are resolved in parseCardOptions and passed as explicit colors, so every
// theme the UI lists renders correctly. On name clashes the renderer's palette wins.
const allThemes = { ...themes, ...renderThemes };
const themeCatalog = { render: renderThemes, extra: themes };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATA_TTL_MS = 10 * 60 * 1000; // GitHub data cached in memory per instance
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 60; // card requests / IP / minute

// Cards are cached by browsers and by the Vercel CDN, so repeated README views
// do not hit GitHub. s-maxage applies to the CDN only.
const CARD_CACHE = "public, max-age=1800, s-maxage=14400, stale-while-revalidate=86400";

// ---------------------------------------------------------------------------
// App & security headers
// ---------------------------------------------------------------------------

const app = express();
app.disable("x-powered-by");
// On Vercel the edge overwrites X-Forwarded-For with the real client IP. Elsewhere the
// header is client-controlled, so it is ignored to keep the rate limit unspoofable.
app.set("trust proxy", Boolean(process.env.VERCEL));

const UI_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' blob: data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

// An SVG opened directly in the browser is a document; this CSP makes sure it can
// never run script or load anything external, even if something slipped through.
const SVG_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

// Cards are embedded from anywhere (GitHub camo, other sites); read-only GETs only.
app.use("/api", cors({ methods: ["GET"] }));

app.use(
  "/static",
  express.static(path.join(ROOT_DIR, "ui"), {
    maxAge: "1h",
    setHeaders: (res) => res.setHeader("Content-Security-Policy", UI_CSP),
  }),
);

app.get("/", (req, res) => {
  res.setHeader("Content-Security-Policy", UI_CSP);
  res.setHeader("X-Frame-Options", "DENY");
  res.sendFile(path.join(ROOT_DIR, "ui", "index.html"));
});

app.get("/api/themes", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.json({ themes: Object.keys(allThemes), details: allThemes });
});

// ---------------------------------------------------------------------------
// Rate limiting (best effort: memory is per serverless instance).
// For hard limits on Vercel, add a rate-limit rule in the Vercel Firewall.
// ---------------------------------------------------------------------------

const hits = new Map();

function rateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || "unknown";
  let entry = hits.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry = { start: now, count: 0 };
    hits.set(ip, entry);
  }
  entry.count++;

  if (hits.size > 5000) {
    for (const [key, value] of hits) if (now - value.start > RATE_LIMIT_WINDOW_MS) hits.delete(key);
  }

  if (entry.count > RATE_LIMIT_MAX) {
    res.setHeader("Retry-After", Math.ceil((entry.start + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return sendError(res, 429, "Demasiadas peticiones. Intenta de nuevo en un minuto.");
  }
  next();
}

// ---------------------------------------------------------------------------
// GitHub data cache (dedupes concurrent requests too)
// ---------------------------------------------------------------------------

const dataCache = new Map();

function cached(kind, username, fetcher) {
  const key = `${kind}:${username.toLowerCase()}`;
  const hit = dataCache.get(key);
  if (hit && Date.now() - hit.time < DATA_TTL_MS) return hit.promise;

  const promise = fetcher(username);
  dataCache.set(key, { time: Date.now(), promise });
  promise.catch(() => dataCache.delete(key)); // never cache failures

  if (dataCache.size > 1000) dataCache.delete(dataCache.keys().next().value);
  return promise;
}

const getStats = (u) => cached("stats", u, fetchStats);
const getLanguages = (u) => cached("langs", u, fetchLanguages);
const getStreak = (u) => cached("streak", u, fetchStreakData);
const getContributions = (u) => cached("contrib", u, fetchContributions);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendError(res, status, error) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ error });
}

function sendSvg(res, svg) {
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Content-Security-Policy", SVG_CSP);
  res.setHeader("Cache-Control", CARD_CACHE);
  res.send(svg);
}

// Maps internal errors to safe public messages; details stay in the server log.
function handleError(res, error, label) {
  console.error(`${label} error:`, error);
  switch (error?.type) {
    case "USER_NOT_FOUND":
      return sendError(res, 404, "User not found");
    case "NO_TOKENS":
      return sendError(res, 500, "GitHub token not configured on the server");
    case "RATE_LIMITED":
      return sendError(res, 503, "GitHub rate limit reached. Try again later.");
    default:
      return sendError(res, 502, "Could not fetch data from GitHub");
  }
}

function buildStreakData(raw) {
  return {
    totalContributions: raw.totalContributions,
    currentStreak: raw.currentStreak,
    longestStreak: raw.longestStreak,
    streakStart: raw.currentStreakStart,
    streakEnd: raw.currentStreakEnd,
    longestStreakStart: raw.longestStreakStart,
    longestStreakEnd: raw.longestStreakEnd,
    contributionsSince: raw.firstContribution,
  };
}

function pickLanguages(langMap, options) {
  const excluded = new Set(options.exclude);
  return Object.values(langMap)
    .filter((lang) => !excluded.has(lang.name.toLowerCase()))
    .sort((a, b) => b.size - a.size)
    .slice(0, options.langs_count);
}

function pickDays(contributions, options) {
  const allDays = (contributions.weeks || []).flatMap((week) =>
    week.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
  );
  return allDays.slice(-options.days);
}

/** Wraps a card handler with username validation, option parsing and error handling. */
function cardRoute(label, render) {
  return async (req, res) => {
    const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username;
    if (!username) return sendError(res, 400, "Missing username parameter");
    if (!isValidUsername(username)) return sendError(res, 400, "Invalid GitHub username");

    try {
      const options = parseCardOptions(req.query, themeCatalog);
      sendSvg(res, await render(username, options));
    } catch (error) {
      handleError(res, error, label);
    }
  };
}

// ---------------------------------------------------------------------------
// Card endpoints
// ---------------------------------------------------------------------------

app.use("/api/card", rateLimit);

app.get(
  "/api/card/stats",
  cardRoute("Stats card", async (username, options) => renderStatsCard(await getStats(username), options)),
);

app.get(
  "/api/card/languages",
  cardRoute("Languages card", async (username, options) =>
    renderLanguagesCard(pickLanguages(await getLanguages(username), options), options),
  ),
);

app.get(
  "/api/card/streak",
  cardRoute("Streak card", async (username, options) =>
    renderStreakCard(buildStreakData(await getStreak(username)), options),
  ),
);

app.get(
  "/api/card/contributions",
  cardRoute("Contributions card", async (username, options) =>
    renderContributionsCard(username, pickDays(await getContributions(username), options), options),
  ),
);

app.get(
  "/api/card/all",
  cardRoute("Combined card", async (username, options) => {
    const [stats, langMap, rawStreak, contributions] = await Promise.all([
      getStats(username),
      getLanguages(username),
      getStreak(username),
      getContributions(username),
    ]);

    const cards = [
      renderStatsCard(stats, options),
      renderLanguagesCard(pickLanguages(langMap, options), options),
      renderStreakCard(buildStreakData(rawStreak), options),
      renderContributionsCard(username, pickDays(contributions, options), options),
    ];

    // Each card is a fully independent, self-styled SVG document (own <style> classes).
    // Embedding them as base64 data-URI <image> tags -- rather than pasting the markup
    // into one shared <svg> -- avoids class-name collisions (.header, .stat-big, etc.)
    // between cards while keeping everything inside a single downloadable image.
    const toDataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    const sizeOf = (svg) => ({
      w: Number(svg.match(/<svg[^>]*\swidth="([\d.]+)"/)[1]),
      h: Number(svg.match(/<svg[^>]*\sheight="([\d.]+)"/)[1]),
    });

    const gap = 16;
    const sizes = cards.map(sizeOf);
    const cardWidth = Math.max(...sizes.map((s) => s.w));
    const totalHeight = sizes.reduce((a, s) => a + s.h, 0) + gap * (sizes.length - 1);

    let y = 0;
    const images = cards
      .map((svg, i) => {
        const { w, h } = sizes[i];
        const img = `<image x="0" y="${y}" width="${w}" height="${h}" href="${toDataUri(svg)}"/>`;
        y += h + gap;
        return img;
      })
      .join("\n        ");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${totalHeight}" viewBox="0 0 ${cardWidth} ${totalHeight}">
        ${images}
      </svg>`;
  }),
);

// Anything else under /api is a 404 (JSON), never an HTML error page with a stack trace.
app.use("/api", (req, res) => sendError(res, 404, "Not found"));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  sendError(res, 500, "Internal server error");
});

export default app;
