import { Card } from "../common/Card.js";
import { flexLayout, kFormatter, measureText, getCardColors } from "../common/utils.js";
import { starIcon, commitIcon, prIcon, issuesIcon, discussionsIcon, reviewsIcon } from "../common/icons.js";
import { calculateRank } from "../calculateRank.js";
import { I18n } from "../common/I18n.js";
import { statCardLocales } from "../translations.js";

const CARD_MIN_WIDTH = 287;
const CARD_DEFAULT_WIDTH = 287;
const RANK_CARD_MIN_WIDTH = 420;
const RANK_CARD_DEFAULT_WIDTH = 450;

const calculateCircleProgress = (value) => {
  const radius = 40;
  const c = Math.PI * (radius * 2);
  if (value < 0) value = 0;
  if (value > 100) value = 100;
  return ((100 - value) / 100) * c;
};

const getProgressAnimation = ({ progress }) => {
  return `
    @keyframes rankAnimation {
      from {
        stroke-dashoffset: ${calculateCircleProgress(0)};
      }
      to {
        stroke-dashoffset: ${calculateCircleProgress(progress)};
      }
    }
  `;
};

const getStyles = ({ titleColor, textColor, iconColor, ringColor, show_icons, progress }) => {
  return `
    .stat {
      font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${textColor};
    }
    @supports(-moz-appearance: auto) {
      .stat { font-size:12px; }
    }
    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }
    .rank-text {
      font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor};
      animation: scaleInAnimation 0.3s ease-in-out forwards;
    }
    .not_bold { font-weight: 400 }
    .bold { font-weight: 700 }
    .icon {
      fill: ${iconColor};
      display: ${show_icons ? "block" : "none"};
    }
    .rank-circle-rim {
      stroke: ${ringColor};
      fill: none;
      stroke-width: 6;
      opacity: 0.2;
    }
    .rank-circle {
      stroke: ${ringColor};
      stroke-dasharray: 250;
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      opacity: 0.8;
      transform-origin: -10px 8px;
      transform: rotate(-90deg);
      animation: rankAnimation 1s forwards ease-in-out;
    }
    ${process.env.NODE_ENV === "test" ? "" : getProgressAnimation({ progress })}
  `;
};

const createTextNode = ({ icon, label, value, id, unitSymbol, index, showIcons, shiftValuePos, bold, number_format }) => {
  const kValue = number_format === "long" ? value : kFormatter(value);
  const staggerDelay = (index + 3) * 150;
  const labelOffset = showIcons ? `x="25"` : "";
  const iconSvg = showIcons
    ? `<svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">${icon}</svg>`
    : "";

  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
      ${iconSvg}
      <text class="stat ${bold ? " bold" : "not_bold"}" ${labelOffset} y="12.5">${label}:</text>
      <text
        class="stat ${bold ? " bold" : "not_bold"}"
        x="${(showIcons ? 140 : 120) + shiftValuePos}"
        y="12.5"
        data-testid="${id}"
      >${kValue}${unitSymbol ? ` ${unitSymbol}` : ""}</text>
    </g>
  `;
};

const renderStatsCard = (stats, options = {}) => {
  const {
    name = "GitHub User",
    totalStars = 0,
    totalCommits = 0,
    totalIssues = 0,
    totalPRs = 0,
    totalPRsMerged = 0,
    mergedPRsPercentage = 0,
    totalReviews = 0,
    totalDiscussionsStarted = 0,
    totalDiscussionsAnswered = 0,
    contributedTo = 0,
    rank = { level: "C", percentile: 50, score: 0 },
  } = stats;

  const {
    hide = [],
    show_icons = false,
    hide_title = false,
    hide_border = false,
    card_width,
    hide_rank = false,
    include_all_commits = false,
    line_height = 25,
    title_color,
    ring_color,
    icon_color,
    text_color,
    text_bold = true,
    bg_color,
    theme = "default",
    custom_title,
    border_radius,
    border_color,
    number_format = "short",
    locale,
    disable_animations = false,
    rank_icon = "default",
    show = [],
  } = options;

  const lheight = parseInt(String(line_height), 10);

  const { titleColor, iconColor, textColor, bgColor, borderColor, ringColor } = getCardColors({
    title_color,
    text_color,
    icon_color,
    bg_color,
    border_color,
    ring_color,
    theme,
  });

  const i18n = new I18n({ locale, translations: statCardLocales({ name, apostrophe: "s" }) });

  const STATS = {};
  STATS.stars = { icon: starIcon, label: i18n.t("statcard.totalstars"), value: totalStars, id: "stars" };
  STATS.commits = {
    icon: commitIcon,
    label: `${i18n.t("statcard.commits")}${include_all_commits ? "" : ` (${new Date().getFullYear()})`}`,
    value: totalCommits,
    id: "commits",
  };
  STATS.prs = { icon: prIcon, label: i18n.t("statcard.prs"), value: totalPRs, id: "prs" };
  STATS.issues = { icon: issuesIcon, label: i18n.t("statcard.issues"), value: totalIssues, id: "issues" };

  if (show.includes("reviews")) {
    STATS.reviews = { icon: reviewsIcon, label: i18n.t("statcard.reviews"), value: totalReviews, id: "reviews" };
  }

  STATS.contribs = { icon: starIcon, label: i18n.t("statcard.contribs"), value: contributedTo, id: "contribs" };

  const statItems = Object.keys(STATS)
    .filter((key) => !hide.includes(key))
    .map((key, index) =>
      createTextNode({
        icon: STATS[key].icon,
        label: STATS[key].label,
        value: STATS[key].value,
        id: STATS[key].id,
        unitSymbol: STATS[key].unitSymbol,
        index,
        showIcons: show_icons,
        shiftValuePos: 79.01,
        bold: text_bold,
        number_format,
      }),
    );

  let height = Math.max(
    45 + (statItems.length + 1) * lheight,
    hide_rank ? 0 : statItems.length ? 150 : 180,
  );

  const progress = 100 - rank.percentile;
  const cssStyles = getStyles({ titleColor, ringColor, textColor, iconColor, show_icons, progress });

  const iconWidth = show_icons && statItems.length ? 16 + 1 : 0;
  const minCardWidth = (hide_rank
    ? Math.max(50 + measureText(custom_title || "GitHub Stats") * 2, CARD_MIN_WIDTH)
    : statItems.length
      ? RANK_CARD_MIN_WIDTH
      : RANK_CARD_MIN_WIDTH) + iconWidth;
  
  let width = card_width ? (isNaN(card_width) ? RANK_CARD_DEFAULT_WIDTH : card_width) : RANK_CARD_DEFAULT_WIDTH;
  if (width < minCardWidth) width = minCardWidth;

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: statItems.length ? i18n.t("statcard.title") : i18n.t("statcard.ranktitle"),
    width,
    height,
    border_radius,
    colors: { titleColor, textColor, iconColor, bgColor, borderColor },
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(cssStyles);

  if (disable_animations) {
    card.disableAnimations();
  }

  const calculateRankXTranslation = () => {
    if (statItems.length) {
      const minXTranslation = RANK_CARD_MIN_WIDTH + iconWidth - 70;
      if (width > RANK_CARD_DEFAULT_WIDTH) {
        const xMaxExpansion = minXTranslation + (450 - minCardWidth) / 2;
        return xMaxExpansion + width - RANK_CARD_DEFAULT_WIDTH;
      } else {
        return minXTranslation + (width - minCardWidth) / 2;
      }
    } else {
      return width / 2 + 20 - 10;
    }
  };

  const rankCircle = hide_rank
    ? ""
    : `<g data-testid="rank-circle" transform="translate(${calculateRankXTranslation()}, ${height / 2 - 50})">
      <circle class="rank-circle-rim" cx="-10" cy="8" r="40" />
      <circle class="rank-circle" cx="-10" cy="8" r="40" />
      <g class="rank-text">
        ${rankIcon(rank_icon, rank?.level, rank?.percentile)}
      </g>
    </g>`;

  return card.render(`
    ${rankCircle}
    <svg x="0" y="0">
      ${flexLayout({
        items: statItems,
        gap: lheight,
        direction: "column",
      }).join("")}
    </svg>
  `);
};

export { renderStatsCard };
