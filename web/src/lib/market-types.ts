export const MARKET_TYPES = [
  {
    id: "x-followers",
    label: "X Followers",
    paramLabel: "X Username",
    paramPlaceholder: "elonmusk",
    buildEndpointPath: (param: string) =>
      `users/by/username/${param}?user.fields=public_metrics`,
    jsonPath: "data.public_metrics.followers_count",
    targetLabel: "Target Followers",
    targetPlaceholder: "200000000",
  },
  {
    id: "x-post-likes",
    label: "Post Likes",
    paramLabel: "Tweet ID",
    paramPlaceholder: "1234567890",
    buildEndpointPath: (param: string) =>
      `tweets/${param}?tweet.fields=public_metrics`,
    jsonPath: "data.public_metrics.like_count",
    targetLabel: "Target Likes",
    targetPlaceholder: "100000",
  },
  {
    id: "x-post-views",
    label: "Post Views",
    paramLabel: "Tweet ID",
    paramPlaceholder: "1234567890",
    buildEndpointPath: (param: string) =>
      `tweets/${param}?tweet.fields=public_metrics`,
    jsonPath: "data.public_metrics.impression_count",
    targetLabel: "Target Views",
    targetPlaceholder: "1000000",
  },
  {
    id: "x-post-retweets",
    label: "Post Retweets",
    paramLabel: "Tweet ID",
    paramPlaceholder: "1234567890",
    buildEndpointPath: (param: string) =>
      `tweets/${param}?tweet.fields=public_metrics`,
    jsonPath: "data.public_metrics.retweet_count",
    targetLabel: "Target Retweets",
    targetPlaceholder: "10000",
  },
  {
    id: "x-search-count",
    label: "Search Post Count",
    paramLabel: "Search Term",
    paramPlaceholder: "India",
    buildEndpointPath: (param: string) =>
      `tweets/counts/recent?query=${encodeURIComponent(param)}`,
    jsonPath: "meta.total_tweet_count",
    targetLabel: "Target Post Count",
    targetPlaceholder: "10000",
  },
] as const;

export const COMPARISON_OPTIONS = [
  { value: 0, label: ">= (at least)" },
  { value: 1, label: "<= (at most)" },
  { value: 2, label: "> (more than)" },
  { value: 3, label: "< (less than)" },
  { value: 4, label: "= (exactly)" },
] as const;
