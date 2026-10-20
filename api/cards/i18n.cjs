// Card text translations. Technical GitHub terms (Commits, PRs, Issues) are kept as-is.

const STRINGS = {
  en: {
    statsTitle: "{name}'s GitHub Stats",
    stars: 'Total Stars Earned:',
    commits: 'Total Commits (last year):',
    prs: 'Total PRs:',
    issues: 'Total Issues:',
    contribs: 'Contributed to (last year):',
    languagesTitle: 'Most Used Languages',
    totalContributions: 'Total Contributions',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    present: 'Present',
    contributionsTitle: "{name}'s Contribution Graph",
    contributionsAxis: 'Contributions',
    daysAxis: 'Days',
  },
  es: {
    statsTitle: 'Estadísticas de GitHub de {name}',
    stars: 'Estrellas obtenidas:',
    commits: 'Commits (último año):',
    prs: 'PRs totales:',
    issues: 'Issues totales:',
    contribs: 'Contribuyó a (último año):',
    languagesTitle: 'Lenguajes más usados',
    totalContributions: 'Contribuciones totales',
    currentStreak: 'Racha actual',
    longestStreak: 'Racha más larga',
    present: 'Presente',
    contributionsTitle: 'Gráfico de contribuciones de {name}',
    contributionsAxis: 'Contribuciones',
    daysAxis: 'Días',
  },
  pt: {
    statsTitle: 'Estatísticas do GitHub de {name}',
    stars: 'Estrelas recebidas:',
    commits: 'Commits (último ano):',
    prs: 'Total de PRs:',
    issues: 'Total de Issues:',
    contribs: 'Contribuiu para (último ano):',
    languagesTitle: 'Linguagens mais usadas',
    totalContributions: 'Total de contribuições',
    currentStreak: 'Sequência atual',
    longestStreak: 'Maior sequência',
    present: 'Presente',
    contributionsTitle: 'Gráfico de contribuições de {name}',
    contributionsAxis: 'Contribuições',
    daysAxis: 'Dias',
  },
  fr: {
    statsTitle: 'Statistiques GitHub de {name}',
    stars: 'Étoiles obtenues :',
    commits: 'Commits (dernière année) :',
    prs: 'Total des PRs :',
    issues: 'Total des Issues :',
    contribs: 'A contribué à (dernière année) :',
    languagesTitle: 'Langages les plus utilisés',
    totalContributions: 'Contributions totales',
    currentStreak: 'Série actuelle',
    longestStreak: 'Plus longue série',
    present: 'Présent',
    contributionsTitle: 'Graphique des contributions de {name}',
    contributionsAxis: 'Contributions',
    daysAxis: 'Jours',
  },
  de: {
    statsTitle: 'GitHub-Statistiken von {name}',
    stars: 'Erhaltene Sterne:',
    commits: 'Commits (letztes Jahr):',
    prs: 'PRs gesamt:',
    issues: 'Issues gesamt:',
    contribs: 'Beigetragen zu (letztes Jahr):',
    languagesTitle: 'Meistgenutzte Sprachen',
    totalContributions: 'Beiträge gesamt',
    currentStreak: 'Aktuelle Serie',
    longestStreak: 'Längste Serie',
    present: 'Heute',
    contributionsTitle: 'Beitragsdiagramm von {name}',
    contributionsAxis: 'Beiträge',
    daysAxis: 'Tage',
  },
  it: {
    statsTitle: 'Statistiche GitHub di {name}',
    stars: 'Stelle ottenute:',
    commits: 'Commits (ultimo anno):',
    prs: 'PRs totali:',
    issues: 'Issues totali:',
    contribs: 'Ha contribuito a (ultimo anno):',
    languagesTitle: 'Linguaggi più usati',
    totalContributions: 'Contributi totali',
    currentStreak: 'Serie attuale',
    longestStreak: 'Serie più lunga',
    present: 'Oggi',
    contributionsTitle: 'Grafico dei contributi di {name}',
    contributionsAxis: 'Contributi',
    daysAxis: 'Giorni',
  },
};

const LOCALES = Object.keys(STRINGS);

/** Returns a translator bound to a locale (falls back to English). */
function translator(locale) {
  const dict = STRINGS[locale] || STRINGS.en;
  return (key, vars = {}) =>
    (dict[key] ?? STRINGS.en[key]).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

const formatNumber = (value, locale) => Number(value || 0).toLocaleString(locale || 'en');

module.exports = { LOCALES, translator, formatNumber };
