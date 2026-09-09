const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

async function fetchGitHubData(username, token) {
  const restHeaders = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'github-readme-stats-app',
  };
  if (token) restHeaders['Authorization'] = `token ${token}`;

  const gqlHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'github-readme-stats-app',
  };
  if (token) gqlHeaders['Authorization'] = `bearer ${token}`;

  const userRes = await fetch(`${GITHUB_API}/users/${username}`, { headers: restHeaders });
  if (!userRes.ok) throw new Error(`GitHub user not found: ${username}`);
  const user = await userRes.json();

  const gqlQuery = `query userInfo($login: String!) {
    user(login: $login) {
      name
      login
      avatarUrl
      repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
        nodes {
          name
          stargazerCount
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node { color, name }
            }
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestReviewContributions
      }
      pullRequests {
        totalCount
      }
      issues {
        totalCount
      }
      repositoriesContributedTo(first: 1, contributionTypes: [PULL_REQUEST, ISSUE, REPOSITORY]) {
        totalCount
      }
      followers {
        totalCount
      }
    }
  }`;

  let gqlData = null;
  try {
    const gqlRes = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: gqlHeaders,
      body: JSON.stringify({ query: gqlQuery, variables: { login: username } }),
    });
    if (gqlRes.ok) {
      const gqlJson = await gqlRes.json();
      gqlData = gqlJson.data?.user;
    }
  } catch {
    // GraphQL may fail if no token, fall back to REST
  }

  let totalStars = 0;
  let totalCommits = 0;
  let totalPRs = 0;
  let totalIssues = 0;
  let contributedTo = 0;
  let langMap = {};

  if (gqlData) {
    totalPRs = gqlData.pullRequests?.totalCount || 0;
    totalIssues = gqlData.issues?.totalCount || 0;
    contributedTo = gqlData.repositoriesContributedTo?.totalCount || 0;
    totalCommits = gqlData.contributionsCollection?.totalCommitContributions || 0;

    const repos = gqlData.repositories?.nodes || [];
    for (const repo of repos) {
      totalStars += repo.stargazerCount || 0;
      for (const edge of repo.languages?.edges || []) {
        const name = edge.node.name;
        if (!langMap[name]) {
          langMap[name] = { name, size: 0, color: edge.node.color };
        }
        langMap[name].size += edge.size;
      }
    }
  } else {
    // Fallback: REST-only mode
    const reposRes = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`, { headers: restHeaders });
    const repos = await reposRes.json();
    for (const repo of repos) {
      totalStars += repo.stargazers_count || 0;
      if (repo.language) {
        if (!langMap[repo.language]) {
          langMap[repo.language] = { name: repo.language, size: 0, color: null };
        }
        langMap[repo.language].size += 1;
      }
    }
    totalCommits = await fetchCommitCount(username, repos, restHeaders);
    totalPRs = await fetchSearchCount(username, 'pr', restHeaders);
    totalIssues = await fetchSearchCount(username, 'issue', restHeaders);
    contributedTo = await fetchContributedTo(username, restHeaders);
  }

  // Deduplicate languages and sort by size
  const languages = Object.values(langMap)
    .sort((a, b) => b.size - a.size)
    .slice(0, 6);

  const streakData = await fetchStreakData(username);
  const contributionDays = await fetchContributionDays(username);

  return {
    name: user.name || user.login,
    login: user.login,
    avatarUrl: user.avatar_url,
    totalStars,
    totalCommits,
    totalPRs,
    totalIssues,
    contributedTo,
    languages,
    streakData,
    contributionDays,
  };
}

async function fetchCommitCount(username, repos, headers) {
  try {
    let total = 0;
    const topRepos = repos.slice(0, 5);
    for (const repo of topRepos) {
      const res = await fetch(
        `${GITHUB_API}/repos/${username}/${repo.name}/commits?author=${username}&per_page=1`,
        { headers }
      );
      const link = res.headers.get('link');
      if (link) {
        const match = link.match(/page=(\d+)>; rel="last"/);
        if (match) total += parseInt(match[1]);
      }
    }
    return total;
  } catch {
    return 0;
  }
}

async function fetchSearchCount(username, type, headers) {
  try {
    const res = await fetch(
      `${GITHUB_API}/search/issues?q=author:${username}+type:${type}`,
      { headers }
    );
    const data = await res.json();
    return data.total_count || 0;
  } catch {
    return 0;
  }
}

async function fetchContributedTo(username, headers) {
  try {
    const res = await fetch(
      `${GITHUB_API}/search/issues?q=commenter:${username}+type:pr&per_page=1`,
      { headers }
    );
    const data = await res.json();
    return Math.min(data.total_count || 0, 999);
  } catch {
    return 0;
  }
}

async function fetchStreakData(username) {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}`
    );
    const data = await res.json();
    const contributions = data.contributions || [];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalContributions = 0;

    for (const day of contributions) {
      totalContributions += day.count;
    }

    // Current streak: count from today backwards
    const recent = [...contributions].reverse();
    for (const day of recent) {
      if (day.count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Longest streak: scan all contributions
    let longestStreakStart = null;
    let longestStreakEnd = null;
    let runStart = null;
    tempStreak = 0;
    for (const day of contributions) {
      if (day.count > 0) {
        if (tempStreak === 0) runStart = day.date;
        tempStreak++;
        if (tempStreak >= longestStreak) {
          longestStreak = tempStreak;
          longestStreakStart = runStart;
          longestStreakEnd = day.date;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Current streak date range
    let streakStart = null;
    let streakEnd = null;
    if (currentStreak > 0) {
      const streakDays = recent.filter((d) => d.count > 0).slice(0, currentStreak);
      streakStart = streakDays[streakDays.length - 1]?.date;
      streakEnd = streakDays[0]?.date;
    }

    return {
      totalContributions,
      currentStreak,
      longestStreak,
      streakStart,
      streakEnd,
      longestStreakStart,
      longestStreakEnd,
      contributionsSince: contributions[0]?.date || null,
    };
  } catch {
    return {
      totalContributions: 0,
      currentStreak: 0,
      longestStreak: 0,
      streakStart: null,
      streakEnd: null,
      longestStreakStart: null,
      longestStreakEnd: null,
      contributionsSince: null,
    };
  }
}

async function fetchContributionDays(username) {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}`
    );
    const data = await res.json();
    return (data.contributions || []).slice(-30).map((d) => ({
      date: d.date,
      count: d.count,
    }));
  } catch {
    return [];
  }
}

module.exports = { fetchGitHubData };
