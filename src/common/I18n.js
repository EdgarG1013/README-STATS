class I18n {
  constructor({ locale, translations }) {
    const selectedTranslations = translations[locale] || translations["en"];
    this.translations = Object.assign(translations["en"] || {}, selectedTranslations);
  }

  t(key, params = {}) {
    let translation = this.translations[key] || key;
    Object.keys(params).forEach((paramKey) => {
      translation = translation.replace(new RegExp(`{${paramKey}}`, "g"), params[paramKey]);
    });
    return translation;
  }
}

export { I18n };
