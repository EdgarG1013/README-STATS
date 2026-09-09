import axios from "axios";
import toEmoji from "emoji-name-map";
import wrap from "word-wrap";
import { themes } from "../themes/index.js";

const TRY_AGAIN_LATER = "Please try again later";

const SECONDARY_ERROR_MESSAGES = {
  MAX_RETRY: "You can deploy own instance or wait until public will be no longer limited",
  NO_TOKENS: "Please add an env variable called PAT_1 with your GitHub API token in vercel",
  USER_NOT_FOUND: "Make sure the provided username is not an organization",
  GRAPHQL_ERROR: TRY_AGAIN_LATER,
  GITHUB_REST_API_ERROR: TRY_AGAIN_LATER,
};

class CustomError extends Error {
  constructor(message, type) {
    super(message);
    this.type = type;
    this.secondaryMessage = SECONDARY_ERROR_MESSAGES[type] || type;
  }
  static MAX_RETRY = "MAX_RETRY";
  static NO_TOKENS = "NO_TOKENS";
  static USER_NOT_FOUND = "USER_NOT_FOUND";
  static GRAPHQL_ERROR = "GRAPHQL_ERROR";
  static GITHUB_REST_API_ERROR = "GITHUB_REST_API_ERROR";
}

const flexLayout = ({ items, gap, direction, sizes = [] }) => {
  let lastSize = 0;
  return items.filter(Boolean).map((item, i) => {
    const size = sizes[i] || 0;
    let transform = `translate(${lastSize}, 0)`;
    if (direction === "column") {
      transform = `translate(0, ${lastSize})`;
    }
    lastSize += size + gap;
    return `<g transform="${transform}">${item}</g>`;
  });
};

const encodeHTML = (str) => {
  return str
    .replace(/[\u00A0-\u9999<>&](?!#)/gim, (i) => {
      return "&#" + i.charCodeAt(0) + ";";
    })
    .replace(/\u0008/gim, "");
};

const kFormatter = (num) => {
  return Math.abs(num) > 999
    ? Math.sign(num) * parseFloat((Math.abs(num) / 1000).toFixed(1)) + "k"
    : Math.sign(num) * Math.abs(num);
};

const isValidHexColor = (hexColor) => {
  return /^([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4})$/.test(hexColor);
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    else if (value.toLowerCase() === "false") return false;
  }
  return undefined;
};

const parseArray = (str) => {
  if (!str) return [];
  return str.split(",");
};

const clampValue = (number, min, max) => {
  if (Number.isNaN(parseInt(number, 10))) return min;
  return Math.max(min, Math.min(number, max));
};

const isValidGradient = (colors) => {
  return colors.length > 2 && colors.slice(1).every((color) => isValidHexColor(color));
};

const fallbackColor = (color, fallback) => {
  let gradient = null;
  let colors = color ? color.split(",") : [];
  if (colors.length > 1 && isValidGradient(colors)) {
    gradient = colors;
  }
  return (gradient ? gradient : isValidHexColor(color) && `#${color}`) || fallback;
};

const request = (data, headers) => {
  return axios({
    url: "https://api.github.com/graphql",
    method: "post",
    headers,
    data,
  });
};

const getCardColors = ({
  title_color, text_color, icon_color, bg_color, border_color, ring_color, theme,
  fallbackTheme = "default",
}) => {
  const defaultTheme = themes[fallbackTheme];
  const selectedTheme = themes[theme] || defaultTheme;
  const defaultBorderColor = selectedTheme.border_color || defaultTheme.border_color;

  const titleColor = fallbackColor(title_color || selectedTheme.title_color, "#" + defaultTheme.title_color);
  const ringColor = fallbackColor(ring_color || selectedTheme.ring_color, titleColor);
  const iconColor = fallbackColor(icon_color || selectedTheme.icon_color, "#" + defaultTheme.icon_color);
  const textColor = fallbackColor(text_color || selectedTheme.text_color, "#" + defaultTheme.text_color);
  const bgColor = fallbackColor(bg_color || selectedTheme.bg_color, "#" + defaultTheme.bg_color);
  const borderColor = fallbackColor(border_color || defaultBorderColor, "#" + defaultBorderColor);

  if (typeof titleColor !== "string" || typeof textColor !== "string" || typeof ringColor !== "string" || typeof iconColor !== "string" || typeof borderColor !== "string") {
    throw new Error("Unexpected behavior, all colors except background should be string.");
  }

  return { titleColor, iconColor, textColor, bgColor, borderColor, ringColor };
};

const ERROR_CARD_LENGTH = 576.5;

const renderError = (message, secondaryMessage = "", options = {}) => {
  const { title_color, text_color, bg_color, border_color, theme = "default" } = options;
  const { titleColor, textColor, bgColor, borderColor } = getCardColors({ title_color, text_color, icon_color: "", bg_color, border_color, ring_color: "", theme });

  return `<svg width="${ERROR_CARD_LENGTH}" height="120" viewBox="0 0 ${ERROR_CARD_LENGTH} 120" fill="${bgColor}" xmlns="http://www.w3.org/2000/svg">
    <style>.text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${titleColor} } .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor} } .gray { fill: #858585 }</style>
    <rect x="0.5" y="0.5" width="${ERROR_CARD_LENGTH - 1}" height="99%" rx="4.5" fill="${bgColor}" stroke="${borderColor}"/>
    <text x="25" y="45" class="text">Something went wrong!</text>
    <text data-testid="message" x="25" y="55" class="text small">
      <tspan x="25" dy="18">${encodeHTML(message)}</tspan>
      <tspan x="25" dy="18" class="gray">${secondaryMessage}</tspan>
    </text>
  </svg>`;
};

const measureText = (str, fontSize = 10) => {
  const widths = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.2796875,0.2765625,0.3546875,0.5546875,0.5546875,0.8890625,0.665625,0.190625,0.3328125,0.3328125,0.3890625,0.5828125,0.2765625,0.3328125,0.2765625,0.3015625,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.2765625,0.2765625,0.584375,0.5828125,0.584375,0.5546875,1.0140625,0.665625,0.665625,0.721875,0.721875,0.665625,0.609375,0.7765625,0.721875,0.2765625,0.5,0.665625,0.5546875,0.8328125,0.721875,0.7765625,0.665625,0.7765625,0.721875,0.665625,0.609375,0.721875,0.665625,0.94375,0.665625,0.665625,0.609375,0.2765625,0.3546875,0.2765625,0.4765625,0.5546875,0.3328125,0.5546875,0.5546875,0.5,0.5546875,0.5546875,0.2765625,0.5546875,0.5546875,0.221875,0.240625,0.5,0.221875,0.8328125,0.5546875,0.5546875,0.5546875,0.5546875,0.3328125,0.5,0.2765625,0.5546875,0.5,0.721875,0.5,0.5,0.5,0.3546875,0.259375,0.353125,0.5890625];
  const avg = 0.5279276315789471;
  return str.split("").map((c) => c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg).reduce((cur, acc) => acc + cur) * fontSize;
};

const lowercaseTrim = (name) => name.toLowerCase().trim();

const chunkArray = (arr, perChunk) => {
  return arr.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);
    if (!resultArray[chunkIndex]) resultArray[chunkIndex] = [];
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
};

const wrapTextMultiline = (text, width = 59, maxLines = 3) => {
  const encoded = encodeHTML(text);
  let wrapped = wrap(encoded, { width }).split("\n");
  const lines = wrapped.map((line) => line.trim()).slice(0, maxLines);
  if (wrapped.length > maxLines) lines[maxLines - 1] += "...";
  return lines.filter(Boolean);
};

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const CONSTANTS = {
  ONE_MINUTE: MIN,
  FIVE_MINUTES: 5 * MIN,
  TEN_MINUTES: 10 * MIN,
  FIFTEEN_MINUTES: 15 * MIN,
  THIRTY_MINUTES: 30 * MIN,
  TWO_HOURS: 2 * HOUR,
  FOUR_HOURS: 4 * HOUR,
  SIX_HOURS: 6 * HOUR,
  EIGHT_HOURS: 8 * HOUR,
  TWELVE_HOURS: 12 * HOUR,
  ONE_DAY: DAY,
  TWO_DAY: 2 * DAY,
  SIX_DAY: 6 * DAY,
  TEN_DAY: 10 * DAY,
  CARD_CACHE_SECONDS: DAY,
  TOP_LANGS_CACHE_SECONDS: 6 * DAY,
  ERROR_CACHE_SECONDS: 10 * MIN,
};

class MissingParamError extends Error {
  constructor(missedParams, secondaryMessage) {
    const msg = `Missing params ${missedParams.map((p) => `"${p}"`).join(", ")} make sure you pass the parameters in URL`;
    super(msg);
    this.missedParams = missedParams;
    this.secondaryMessage = secondaryMessage;
  }
}

const noop = () => {};
const logger = process.env.NODE_ENV === "test" ? { log: noop, error: noop } : console;

const parseEmojis = (str) => {
  if (!str) throw new Error("[parseEmoji]: str argument not provided");
  return str.replace(/:\w+:/gm, (emoji) => toEmoji.get(emoji) || "");
};

export {
  ERROR_CARD_LENGTH, renderError, encodeHTML, kFormatter, isValidHexColor, parseBoolean,
  parseArray, clampValue, isValidGradient, fallbackColor, request, flexLayout, getCardColors,
  wrapTextMultiline, logger, CONSTANTS, CustomError, MissingParamError, measureText,
  lowercaseTrim, chunkArray, parseEmojis,
};
