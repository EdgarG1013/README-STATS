class I18n {
  constructor({ locale, translations }) {
    const selectedTranslations = translations[locale] || translations["en"];
    this.translations = Object.assign(translations["en"] || {}, selectedTranslations);
  }

  t(key, params = {}) {
    const keys = key.split(".");
    let value = this.translations;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    let result = typeof value === "string" ? value : key;
    Object.keys(params).forEach((paramKey) => {
      result = result.replace(new RegExp(`{${paramKey}}`, "g"), params[paramKey]);
    });
    return result;
  }
}

export { I18n };
