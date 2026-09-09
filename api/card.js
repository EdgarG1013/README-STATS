import { renderStatsCard } from "../src/cards/stats.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderStreakCard } from "../src/cards/streak-card.js";
import { calculateRank } from "../src/calculateRank.js";
import { themes } from "../src/themes/index.js";
import { CONSTANTS, CustomError, MissingParamError } from "../src/common/utils.js";
import { I18n } from "../src/common/I18n.js";

// Token management - reads PAT_1 through PAT_N from environment
const TOKENS = (() => {
  const tokens = [];
  let i = 1;
  while (process.env[`PAT_${i}`]) {
    tokens.push(process.env[`PAT_${i}`]);
    i++;
  }
  return tokens;
})();

let currentTokenIndex = 0;

const getToken = () => {
  if (TOKENS.length === 0) return process.env.GITHUB_TOKEN || null;
  const token = TOKENS[currentTokenIndex];
  currentTokenIndex = (currentTokenIndex + 1) % TOKENS.length;
  return token;
};

const getHeaders = (token) => ({
  Authorization: `bearer ${token || process.env.GITHUB_TOKEN}`,
  "Content-Type": "application/json",
  "User-Agent": "github-readme-stats-custom",
});

// GraphQL query for stats
const STATS_QUERY = `
  query userInfo($login: String!) {
    user(login: $login) {
      name
      login
      contributionsCollection {
        contributionCalendar {
          totalContributions
        }
        restrictedContributionsCount
        totalCommitContributions
        totalPullRequestReviewContributions
      }
      repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
        totalCount
      }
      pullRequests(first: 1) {
        totalCount
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
        totalCount
        nodes {
          stargazerCount
        }
      }
    }
  }
`;

const LANGUAGES_QUERY = `
  query userInfo($login: String!) {
    user(login: $login) {
      repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
        nodes {
          name
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node {
                color
                name
              }
            }
          }
        }
      }
    }
  }
`;

const CONTRIBUTIONS_QUERY = `
  query userInfo($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

const graphqlRequest = async (query, variables) => {
  const token = getToken();
  if (!token) {
    throw new CustomError(
      "GitHub token not found. Set GITHUB_TOKEN or PAT_1 environment variable.",
      "NO_TOKENS",
    );
  }

  const maxRetries = Math.max(TOKENS.length, 1);
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    const currentToken = TOKENS.length > 0 ? getToken() : token;
    try {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: getHeaders(currentToken),
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0]?.message || "GraphQL error");
      }
      return data.data;
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${i + 1} failed:`, err.message);
    }
  }
  throw lastError;
};

const fetchStats = async (username) => {
  const data = await graphqlRequest(STATS_QUERY, { login: username });

  if (!data.user) {
    throw new CustomError("User not found", "USER_NOT_FOUND");
  }

  const user = data.user;
  const contributions = user.contributionsCollection;
  const calendar = contributions.contributionCalendar;

  const totalStars = user.repositories.nodes.reduce((acc, repo) => {
    return acc + repo.stargazerCount;
  }, 0);

  const totalCommits = contributions.totalCommitContributions;
  const totalIssues = user.openIssues.totalCount + user.closedIssues.totalCount;
  const totalPRs = user.pullRequests.totalCount;
  const totalReviews = contributions.totalPullRequestReviewContributions;
  const contributedTo = user.repositoriesContributedTo.totalCount;

  const rank = calculateRank({
    totalCommits,
    totalPRs,
    totalIssues,
    totalReviews,
    contributedTo,
  });

  return {
    name: user.name || username,
    totalStars,
    totalCommits,
    totalIssues,
    totalPRs,
    totalReviews,
    contributedTo,
    rank,
  };
};

const fetchLanguages = async (username) => {
  const data = await graphqlRequest(LANGUAGES_QUERY, { login: username });

  if (!data.user) {
    throw new CustomError("User not found", "USER_NOT_FOUND");
  }

  const repos = data.user.repositories.nodes;
  const langMap = {};

  for (const repo of repos) {
    if (repo.languages?.edges) {
      for (const edge of repo.languages.edges) {
        const lang = edge.node;
        if (langMap[lang.name]) {
          langMap[lang.name].size += edge.size;
        } else {
          langMap[lang.name] = {
            name: lang.name,
            color: lang.color || "#858585",
            size: edge.size,
          };
        }
      }
    }
  }

  return langMap;
};

const fetchContributions = async (username) => {
  const data = await graphqlRequest(CONTRIBUTIONS_QUERY, { login: username });

  if (!data.user) {
    throw new CustomError("User not found", "USER_NOT_FOUND");
  }

  const calendar = data.user.contributionsCollection.contributionCalendar;
  return {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks,
  };
};

const renderStats = async (username, query) => {
  const stats = await fetchStats(username);
  return renderStatsCard(stats, {
    hide: query.hide ? query.hide.split(",") : [],
    show_icons: query.show_icons === "true",
    hide_title: query.hide_title === "true",
    hide_border: query.hide_border === "true",
    hide_rank: query.hide_rank === "true",
    card_width: query.card_width ? parseInt(query.card_width) : undefined,
    show_border: query.show_border !== "false",
    line_height: query.line_height ? parseInt(query.line_height) : 25,
    title_color: query.title_color,
    icon_color: query.icon_color,
    text_color: query.text_color,
    bg_color: query.bg_color,
    theme: query.theme || "default",
    custom_title: query.custom_title,
    border_radius: query.border_radius,
    border_color: query.border_color,
    number_format: query.number_format || "short",
    locale: query.locale,
    include_all_commits: query.include_all_commits === "true",
  });
};

const renderLanguages = async (username, query) => {
  const topLangs = await fetchLanguages(username);
  return renderTopLanguages(topLangs, {
    hide: query.hide ? query.hide.split(",") : [],
    hide_title: query.hide_title === "true",
    hide_border: query.hide_border === "true",
    hide_progress: query.hide_progress === "true",
    card_width: query.card_width ? parseInt(query.card_width) : undefined,
    title_color: query.title_color,
    text_color: query.text_color,
    bg_color: query.bg_color,
    theme: query.theme || "default",
    custom_title: query.custom_title,
    border_radius: query.border_radius,
    border_color: query.border_color,
    layout: query.layout || "compact",
    langs_count: query.langs_count ? parseInt(query.langs_count) : undefined,
  });
};

const renderStreak = async (username, query) => {
  const streak = await fetchStreakData(username);
  return renderStreakCard(username, streak, {
    theme: query.theme || "default",
    hide_border: query.hide_border === "true",
    title_color: query.title_color,
    text_color: query.text_color,
    bg_color: query.bg_color,
    border_color: query.border_color,
  });
};

const fetchStreakData = async (username) => {
  const data = await graphqlRequest(CONTRIBUTIONS_QUERY, { username });

  if (!data.user) {
    throw new CustomError("User not found", "USER_NOT_FOUND");
  }

  const calendar = data.user.contributionsCollection.contributionCalendar;
  const allDays = calendar.weeks.flatMap((week) => week.contributionDays);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let currentStreakStart = null;
  let currentStreakEnd = null;
  let longestStreakStart = null;
  let longestStreakEnd = null;
  let tempStart = null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate from most recent day backwards
  for (let i = allDays.length - 1; i >= 0; i--) {
    const day = allDays[i];
    const date = new Date(day.date);

    if (day.contributionCount > 0) {
      tempStreak++;
      if (!tempStart) tempStart = day.date;
      currentStreakEnd = day.date;
    } else {
      if (tempStreak > 0 && !currentStreakStart) {
        currentStreak = tempStreak;
        currentStreakStart = tempStart;
        longestStreak = tempStreak;
        longestStreakStart = tempStart;
        longestStreakEnd = currentStreakEnd;
      }
      tempStreak = 0;
      tempStart = null;
    }
  }

  // Handle case where streak is ongoing
  if (tempStreak > 0 && !currentStreakStart) {
    currentStreak = tempStreak;
    currentStreakStart = tempStart;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
      longestStreakStart = tempStart;
      longestStreakEnd = currentStreakEnd;
    }
  }

  return {
    totalContributions: calendar.totalContributions,
    currentStreak,
    longestStreak,
    currentStreakStart,
    currentStreakEnd,
    longestStreakStart,
    longestStreakEnd,
    firstContribution: allDays.find((d) => d.contributionCount > 0)?.date,
  };
};

export { renderStats, renderLanguages, renderStreak, fetchStats, fetchLanguages, fetchContributions, themes };
