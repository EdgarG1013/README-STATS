import { Card } from "../common/Card.js";
import { flexLayout, getCardColors, lowercaseTrim, chunkArray, measureText, clampValue } from "../common/utils.js";
import { I18n } from "../common/I18n.js";
import { langCardLocales } from "../translations.js";

const DEFAULT_CARD_WIDTH = 300;
const MIN_CARD_WIDTH = 280;
const CARD_PADDING = 25;
const COMPACT_LAYOUT_BASE_HEIGHT = 90;
const MAXIMUM_LANGS_COUNT = 20;
const NORMAL_LAYOUT_DEFAULT_LANGS_COUNT = 5;
const COMPACT_LAYOUT_DEFAULT_LANGS_COUNT = 6;

const getLongestLang = (arr) =>
  arr.reduce(
    (savedLang, lang) =>
      lang.name.length > savedLang.name.length ? lang : savedLang,
    { name: "", size: 0, color: "" },
  );

const trimTopLanguages = (topLangs, langs_count, hide) => {
  let langs = Object.values(topLangs);
  let langsToHide = {};
  let langsCount = clampValue(langs_count, 1, MAXIMUM_LANGS_COUNT);

  if (hide) {
    hide.forEach((langName) => {
      langsToHide[lowercaseTrim(langName)] = true;
    });
  }

  langs = langs
    .sort((a, b) => b.size - a.size)
    .filter((lang) => !langsToHide[lowercaseTrim(lang.name)])
    .slice(0, langsCount);

  const totalLanguageSize = langs.reduce((acc, curr) => acc + curr.size, 0);
  return { langs, totalLanguageSize };
};

const createCompactLangNode = ({ lang, totalSize, hideProgress, index, textColor }) => {
  const percentage = ((lang.size / totalSize) * 100).toFixed(2);
  const color = lang.color || "#858585";

  return `
    <g>
      <circle cx="5" cy="6" r="5" fill="${color}" />
      <text data-testid="lang-name" x="15" y="10" fill="${textColor}" font-size="11" font-family="'Segoe UI', Ubuntu, Sans-Serif">
        ${lang.name} ${hideProgress ? "" : percentage + "%"}
      </text>
    </g>
  `;
};

const createLanguageTextNode = ({ langs, totalSize, hideProgress, textColor }) => {
  const longestLang = getLongestLang(langs);
  const chunked = chunkArray(langs, Math.ceil(langs.length / 2));
  const layouts = chunked.map((array) => {
    const items = array.map((lang, index) =>
      createCompactLangNode({ lang, totalSize, hideProgress, index, textColor })
    );
    return flexLayout({ items, gap: 25, direction: "column" }).join("");
  });

  const percent = ((longestLang.size / totalSize) * 100).toFixed(2);
  const minGap = 150;
  const maxGap = 20 + measureText(`${longestLang.name} ${percent}%`, 11);
  return flexLayout({ items: layouts, gap: maxGap < minGap ? minGap : maxGap }).join("");
};

const renderCompactLayout = (langs, width, totalLanguageSize, hideProgress, textColor) => {
  const paddingRight = 50;
  const offsetWidth = width - paddingRight;
  let progressOffset = 0;

  const compactProgressBar = langs
    .map((lang) => {
      const percentage = parseFloat(
        ((lang.size / totalLanguageSize) * offsetWidth).toFixed(2)
      );
      const progress = percentage < 10 ? percentage + 10 : percentage;
      const output = `
        <rect
          mask="url(#rect-mask)"
          data-testid="lang-progress"
          x="${progressOffset}"
          y="0"
          width="${progress}"
          height="8"
          fill="${lang.color || "#858585"}"
        />
      `;
      progressOffset += percentage;
      return output;
    })
    .join("");

  return `
    ${
      hideProgress
        ? ""
        : `
      <mask id="rect-mask">
        <rect x="0" y="0" width="${offsetWidth}" height="8" fill="white" rx="5"/>
      </mask>
      ${compactProgressBar}
    `
    }
    <g transform="translate(0, ${hideProgress ? "0" : "25"})">
      ${createLanguageTextNode({ langs, totalSize: totalLanguageSize, hideProgress, textColor })}
    </g>
  `;
};

const renderNormalLayout = (langs, width, totalLanguageSize, textColor) => {
  return flexLayout({
    items: langs.map((lang, index) => {
      const percentage = ((lang.size / totalLanguageSize) * 100).toFixed(2);
      const paddingRight = 95;
      const progressTextX = width - paddingRight + 10;
      const progressWidth = width - paddingRight;

      return `
        <g>
          <text data-testid="lang-name" x="2" y="15" fill="${textColor}" font-size="11" font-family="'Segoe UI', Ubuntu, Sans-Serif">${lang.name}</text>
          <text x="${progressTextX}" y="34" fill="${textColor}" font-size="11" font-family="'Segoe UI', Ubuntu, Sans-Serif">${percentage}%</text>
          <rect
            x="0"
            y="25"
            width="${progressWidth}"
            height="8"
            fill="#ddd"
            rx="5"
          />
          <rect
            x="0"
            y="25"
            width="${(percentage / 100) * progressWidth}"
            height="8"
            fill="${lang.color || "#858585"}"
            rx="5"
          />
        </g>
      `;
    }),
    gap: 40,
    direction: "column",
  }).join("");
};

const calculateCompactLayoutHeight = (totalLangs) => {
  return COMPACT_LAYOUT_BASE_HEIGHT + Math.round(totalLangs / 2) * 25;
};

const calculateNormalLayoutHeight = (totalLangs) => {
  return 45 + (totalLangs + 1) * 40;
};

const renderTopLanguages = (topLangs, options = {}) => {
  const {
    hide_title = false,
    hide_border = false,
    card_width,
    title_color,
    text_color,
    bg_color,
    hide,
    hide_progress,
    theme,
    layout,
    custom_title,
    locale,
    langs_count = layout === "compact" || hide_progress ? COMPACT_LAYOUT_DEFAULT_LANGS_COUNT : NORMAL_LAYOUT_DEFAULT_LANGS_COUNT,
    border_radius,
    border_color,
    disable_animations,
  } = options;

  const i18n = new I18n({ locale, translations: langCardLocales });

  const { langs, totalLanguageSize } = trimTopLanguages(topLangs, langs_count, hide);

  let width = card_width
    ? isNaN(card_width)
      ? DEFAULT_CARD_WIDTH
      : card_width < MIN_CARD_WIDTH
        ? MIN_CARD_WIDTH
        : card_width
    : DEFAULT_CARD_WIDTH;

  let height = calculateNormalLayoutHeight(langs.length);

  const colors = getCardColors({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  let finalLayout = "";
  if (langs.length === 0) {
    height = COMPACT_LAYOUT_BASE_HEIGHT;
    finalLayout = `<text x="0" y="11" fill="${colors.textColor}" font-size="14" font-weight="700" font-family="'Segoe UI', Ubuntu, Sans-Serif">${i18n.t("langcard.nodata")}</text>`;
  } else if (layout === "compact" || hide_progress === true) {
    height = calculateCompactLayoutHeight(langs.length) + (hide_progress ? -25 : 0);
    finalLayout = renderCompactLayout(langs, width, totalLanguageSize, hide_progress, colors.textColor);
  } else {
    finalLayout = renderNormalLayout(langs, width, totalLanguageSize, colors.textColor);
  }

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: i18n.t("langcard.title"),
    width,
    height,
    border_radius,
    colors,
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(`
    @keyframes fadeInAnimation {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .stat {
      font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor};
    }
    .bold { font-weight: 700 }
    .lang-name {
      font: 400 11px "Segoe UI", Ubuntu, Sans-Serif;
      fill: ${colors.textColor};
    }
    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }
  `);

  if (disable_animations) {
    card.disableAnimations();
  }

  return card.render(`
    <g data-testid="lang-items" transform="translate(${CARD_PADDING}, 0)">
      ${finalLayout}
    </g>
  `);
};

export { renderTopLanguages, trimTopLanguages };
