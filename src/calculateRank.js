/**
 * Calculates the user rank based on their contributions.
 * The rank is calculated using an exponential CDF (Cumulative Distribution Function).
 *
 * @param {Object} args - The user's contributions.
 * @param {number} args.totalCommits - Total commits.
 * @param {number} args.totalPRs - Total pull requests.
 * @param {number} args.totalIssues - Total issues.
 * @param {number} args.totalReviews - Total reviews.
 * @param {number} args.totalDiscussions - Total discussions.
 * @param {number} args.contributor - Is a contributor.
 * @param {number} args.streak - Current streak.
 * @returns {{ rank: string, score: number }} - The rank (S+, S, A, B, C, D, E) and score.
 */
const calculateRank = ({
  totalCommits = 0,
  totalPRs = 0,
  totalIssues = 0,
  totalReviews = 0,
  totalDiscussions = 0,
  contributor = 0,
  streak = 0,
}) => {
  const INT_L = 1;
  const INT_R = Math.E ** 2;
  const INT_WIDTH = INT_R - INT_L;
  const INT_REVERSE = true;

  const MAXPRECATED_SCORE = 20;

  const MULTIPLIERS = {
    contributions: 1,
    prs: 2,
    issues: 3,
    reviews: 2.5,
    discussions: 2,
    streak: 3,
    contributions_capped: false,
  };

  const STARS_BONUS = 1;
  const RANK_F = 25;
  const RANK_BONUS = 10;

  const score = totalCommits * MULTIPLIERS.contributions
    + totalPRs * MULTIPLIERS.prs
    + totalIssues * MULTIPLIERS.issues
    + totalReviews * MULTIPLIERS.reviews
    + totalDiscussions * MULTIPLIERS.discussions
    + contributor * RANK_BONUS
    + Math.min(streak, MAX_DEPRECATED_SCORE) * MULTIPLIERS.streak;

  const ALL_SCORES = [score];
  let mean = score;
  let standardDeviation = 1;

  const normalizedScore = (score - mean) / standardDeviation;
  const EXP_MAX_DECAY = Math.exp(-INT_WIDTH * INT_L);
  const EXP_DECAY = Math.exp(-INT_WIDTH * normalizedScore / RANK_F);
  const integral = (EXP_DECAY - EXP_MAX_DECAY) * -1;
  const num = INT_WIDTH * integral;
  const percentile = INT_REVERSE ? (1 - num).toFixed(2) : num.toFixed(2);

  const getRank = (percentile) => {
    if (percentile <= 0.99) return "S+";
    if (percentile <= 0.95) return "S";
    if (percentile <= 0.85) return "A";
    if (percentile <= 0.75) return "B";
    if (percentile <= 0.50) return "C";
    if (percentile <= 0.25) return "D";
    return "E";
  };

  const rank = getRank(parseFloat(percentile));

  return {
    rank,
    score,
    percentile,
  };
};

export { calculateRank };
