const translations = {
  en: {
    stat: {
      label: "Total Stars Earned:",
      count: "{count} ",
    },
    contrib: {
      label: "Total Contributions (last year):",
      count: "{count}",
    },
    commit: {
      label: "Total Commits (last year):",
      count: "{count} ",
    },
    pr: {
      label: "Total PRs:",
      count: "{count} ",
    },
    issue: {
      label: "Total Issues:",
      count: "{count} ",
    },
    contribs: {
      label: "Contributions:",
      count: "{count} ",
    },
    prs: {
      label: "Pull Requests:",
      count: "{count} ",
    },
    issues: {
      label: "Issues:",
      count: "{count} ",
    },
    stars: {
      label: "Stars Earned:",
      count: "{count} ",
    },
    commits: {
      label: "Commits:",
      count: "{count} ",
    },
    reviews: {
      label: "Pull Request Reviews:",
      count: "{count} ",
    },
    discussions: {
      label: "Discussions Started:",
      count: "{count} ",
    },
    talks: {
      label: "Talks:",
      count: "{count} ",
    },
    followers: {
      label: "Followers:",
      count: "{count} ",
    },
    stargazers: {
      label: "Stargazers:",
      count: "{count} ",
    },
    contributions: {
      label: "Contributions:",
      count: "{count} ",
    },
    streak: {
      label: "Current Streak:",
      count: "{count} ",
    },
    longestStreak: {
      label: "Longest Streak:",
      count: "{count} ",
    },
    rank: {
      label: "Rank:",
      count: "{count} ",
    },
    total: {
      label: "Total",
      count: "",
    },
    following: {
      label: "Following:",
      count: "{count} ",
    },
    pinned: {
      label: "Pinned",
    },
    ips: {
      label: "Commits in the last year",
    },
    activity: {
      label: "Activity",
    },
  },
  es: {
    stat: {
      label: "Total de Estrellas:",
      count: "{count} ",
    },
    contrib: {
      label: "Contribuciones totales (ultimo año):",
      count: "{count}",
    },
    commit: {
      label: "Commits totales (ultimo año):",
      count: "{count} ",
    },
    pr: {
      label: "PRs totales:",
      count: "{count} ",
    },
    issue: {
      label: "Issues totales:",
      count: "{count} ",
    },
    contribs: {
      label: "Contribuciones:",
      count: "{count} ",
    },
    prs: {
      label: "Pull Requests:",
      count: "{count} ",
    },
    issues: {
      label: "Issues:",
      count: "{count} ",
    },
    stars: {
      label: "Estrellas:",
      count: "{count} ",
    },
    commits: {
      label: "Commits:",
      count: "{count} ",
    },
    reviews: {
      label: "Revisiones de PR:",
      count: "{count} ",
    },
    discussions: {
      label: "Discusiones:",
      count: "{count} ",
    },
    talks: {
      label: "Charlas:",
      count: "{count} ",
    },
    followers: {
      label: "Seguidores:",
      count: "{count} ",
    },
    stargazers: {
      label: "Estrellas:",
      count: "{count} ",
    },
    contributions: {
      label: "Contribuciones:",
      count: "{count} ",
    },
    streak: {
      label: "Racha actual:",
      count: "{count} ",
    },
    longestStreak: {
      label: "Racha mas larga:",
      count: "{count} ",
    },
    rank: {
      label: "Rango:",
      count: "{count} ",
    },
    total: {
      label: "Total",
      count: "",
    },
    following: {
      label: "Siguiendo:",
      count: "{count} ",
    },
    pinned: {
      label: "Fijados",
    },
    ips: {
      label: "Commits en el último año",
    },
    activity: {
      label: "Actividad",
    },
  },
};

// Stat card locales
const statCardLocales = ({ name, apostrophe }) => {
  return {
    en: {
      statcard: {
        title: `${name}${apostrophe}'s GitHub Stats`,
        ranktitle: `${name}${apostrophe}'s GitHub Rank`,
        totalstars: "Total Stars Earned",
        commits: "Total Commits",
        prs: "Total PRs",
        issues: "Total Issues",
        contribs: "Contributed to",
        reviews: "Pull Request Reviews",
        "discussions-started": "Discussions Started",
        "discussions-answered": "Discussions Answered",
        "prs-merged": "PRs Merged",
        "prs-merged-percentage": "PRs Merged %",
      },
    },
    es: {
      statcard: {
        title: `Estadísticas de GitHub de ${name}${apostrophe}`,
        ranktitle: `Rango de GitHub de ${name}${apostrophe}`,
        totalstars: "Total de Estrellas",
        commits: "Total de Commits",
        prs: "Total de PRs",
        issues: "Total de Issues",
        contribs: "Contribuyó a",
        reviews: "Revisiones de PR",
        "discussions-started": "Discusiones Iniciadas",
        "discussions-answered": "Discusiones Respondidas",
        "prs-merged": "PRs Combinados",
        "prs-merged-percentage": "PRs Combinados %",
      },
    },
  };
};

// Language card locales
const langCardLocales = {
  en: {
    langcard: {
      title: "Most Used Languages",
      nodata: "No languages data.",
    },
  },
  es: {
    langcard: {
      title: "Lenguajes Más Usados",
      nodata: "Sin datos de lenguajes.",
    },
  },
};

export { translations, statCardLocales, langCardLocales };
