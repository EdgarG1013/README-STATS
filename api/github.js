const GITHUB_API = 'https://api.github.com';

async function fetchGitHubData(username, token) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'github-readme-stats-app',
  };
  if (token) headers['Authorization'] = `token ${token}`;

  const [
    userRes,
    reposRes,
    contributionsRes,
  ] = await Promise.all([
    fetch(`${GITHUB_API}/users/${username}`, { headers }),
    fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`, { headers }),
    fetch(`https://github.com/${username}`, {
      headers: { ...headers, Accept: 'text/html' },
    }),
  ]);

  if (!userRes.ok) {
    throw new Error(`GitHub user not found: ${username}`);
  }

  const user = await userRes.json();
  const repos = await reposRes.json();

  let totalStars = 0;
  let totalForks = 0;
  const langMap = {};

  for (const repo of repos) {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    if (repo.language) {
      langMap[repo.language] = (langMap[repo.language] || 0) + 1;
    }
  }

  const languages = Object.entries(langMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const totalLangCount = languages.reduce((s, l) => s + l.count, 0);
  for (const lang of languages) {
    lang.percentage = ((lang.count / totalLangCount) * 100).toFixed(2);
  }

  const totalCommits = await fetchCommitCount(username, repos, headers);
  const totalPRs = await fetchPRCount(username, headers);
  const totalIssues = await fetchIssueCount(username, headers);
  const contributedTo = await fetchContributedTo(username, headers);
  const streakData = await fetchStreakData(username);
  const contributionDays = await fetchContributionDays(username);

  return {
    name: user.name || user.login,
    login: user.login,
    avatarUrl: user.avatar_url,
    totalStars,
    totalForks,
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

async function fetchPRCount(username, headers) {
  try {
    const res = await fetch(
      `${GITHUB_API}/search/issues?q=author:${username}+type:pr`,
      { headers }
    );
    const data = await res.json();
    return data.total_count || 0;
  } catch {
    return 0;
  }
}

async function fetchIssueCount(username, headers) {
  try {
    const res = await fetch(
      `${GITHUB_API}/search/issues?q=author:${username}+type:issue`,
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
    const today = new Date().toISOString().split('T')[0];

    for (const day of contributions) {
      totalContributions += day.count;
    }

    const recent = [...contributions].reverse();
    for (const day of recent) {
      if (day.count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    for (const day of contributions) {
      if (day.count > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // `recent` is contributions in reverse-chronological order (today first),
    // so the *oldest* day of the current streak is at the END of this slice,
    // not the start. The previous version had streakStart/streakEnd swapped,
    // which produced an incorrect (reversed) date range on the card.
    let streakStart = null;
    let streakEnd = null;
    if (currentStreak > 0) {
      const dates = recent.filter((d) => d.count > 0).slice(0, currentStreak);
      streakStart = dates[dates.length - 1]?.date; // oldest day of the streak
      streakEnd = dates[0]?.date; // most recent day of the streak (today)
    }

    // The longest streak previously had no date range of its own and just
    // reused the current streak's range, which is wrong whenever the
    // longest streak happened at a different time than the current one.
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
