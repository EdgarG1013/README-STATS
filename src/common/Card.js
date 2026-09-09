import { getCardColors } from "./utils.js";

class Card {
  #css = "";
  #hideBorder = false;
  #hideTitle = false;
  #customTitle = "";
  #defaultTitle = "";
  #accessibilityLabel = {};

  constructor({
    width = 495,
    height = null,
    customTitle = "",
    defaultTitle = "",
    title = null,
    titlePrefix = null,
    titleSuffix = null,
    border_radius = 4.5,
    paddingX = 25,
    paddingY = 35,
    colors = {},
    animations,
    layout,
  }) {
    this.width = width;
    this.height = height;
    this.title = title;
    this.titlePrefix = titlePrefix;
    this.titleSuffix = titleSuffix;
    this.border_radius = border_radius;
    this.paddingX = paddingX;
    this.paddingY = paddingY;
    this.colors = colors;
    this.animations = animations;
    this.layout = layout;
    this.#customTitle = customTitle;
    this.#defaultTitle = defaultTitle;
  }

  setHideBorder(hide) {
    this.#hideBorder = hide;
  }

  setHideTitle(hide) {
    this.#hideTitle = hide;
  }

  setCSS(css) {
    this.#css += css;
  }

  setAccessibilityLabel(label) {
    this.#accessibilityLabel = label;
  }

  disableAnimations() {
    this.#css += `
      * {
        animation: none !important;
        transition: none !important;
      }
    `;
  }

  get title() {
    return this.#hideTitle ? "" : this.#customTitle || this.#defaultTitle;
  }

  cssClass() {
    let classes = ["card"];
    if (!this.#hideBorder && this.colors.borderColor) classes.push("card-border");
    if (this.animations) classes.push("animable");
    if (this.layout) classes.push(this.layout);
    return classes.join(" ");
  }

  widthOffset() {
    return this.width - this.paddingX * 2;
  }

  renderTitle() {
    return `<style>
      .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.colors.titleColor}; }
      .header::before { fill: ${this.colors.titleColor}; }
    </style>
    <g data-testid="card-title">
      <title>${this.title}</title>
      ${this.titlePrefix}
      <text x="25" y="21" class="header">${this.title}</text>
      ${this.titleSuffix}
    </g>`;
  }

  render(body) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
    <defs>
      <clipPath id="clipPath-${this.width}-${this.height}">
        <rect width="${this.width}" height="${this.height}" rx="${this.border_radius}" />
      </clipPath>
    </defs>
    <style>
      .card { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.colors.textColor}; }
      .card a { text-decoration: none; }
      .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.colors.titleColor}; }
      .header::before { fill: ${this.colors.titleColor}; }
      .bold { font-weight: 700; }
      .author-name { font: 400 26px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.colors.titleColor}; }
      .repo-name { font: 600 22px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.colors.titleColor}; }
      .stats { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${this.colors.textColor}; }
      .contribution-stats { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; }
      .sub { font: 600 12px 'Segoe UI', Ubuntu, sans-serif; }
      @keyframes fadeInAnimation {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleInAnimation {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
      ${this.#css}
      ${this.animations || ""}
    </style>
    <rect x="0.5" y="0.5" width="${this.width - 1}" height="${this.height - 1}" rx="${this.border_radius}" class="${this.cssClass()}" fill="${this.colors.bgColor}" stroke="${this.#hideBorder ? "none" : this.colors.borderColor || "none"}" stroke-width="1"/>
    ${this.title ? this.renderTitle() : ""}
    <g transform="translate(0, ${this.title ? this.paddingY - 5 : this.paddingY})">
      ${body}
    </g>
  </svg>`;
  }
}

export { Card };
