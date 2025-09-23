// Puppeteer Configuration
export const BROWSER_CONFIG = {
  headless: true,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  viewport: {
    width: 1920,
    height: 1080,
  },
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--disable-gpu",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-features=TranslateUI",
    "--disable-ipc-flooding-protection",
  ],
} as const;

// Scrolling Configuration
export const SCROLL_CONFIG = {
  maxScrolls: 50,
  scrollDelay: 2000,
  waitTime: 3000,
  loadMoreSelector: '[data-testid="more-posts-link"]',
} as const;

// Facebook Selectors
export const FACEBOOK_SELECTORS = {
  login: {
    email: "#email",
    password: "#pass",
    loginButton: '[name="login"]',
    twoFactorCode: '[name="approvals_code"]',
  },
  posts: {
    postContainer: '[data-pagelet="FeedUnit_0"]',
    content: '[data-testid="post_message"]',
    author: '[data-testid="story-subtitle"] a',
    timestamp: '[data-testid="story-subtitle"] time',
    likes: '[aria-label*="like"]',
    comments: '[aria-label*="comment"]',
    shares: '[aria-label*="share"]',
  },
  group: {
    postsContainer: '[role="main"]',
    postItem: '[data-pagelet^="FeedUnit"]',
    seeMoreButton: '[data-testid="see-more-link"]',
  },
} as const;

// API Endpoints
export const API_ROUTES = {
  jobs: {
    list: "/api/jobs",
    get: "/api/jobs/[id]",
    delete: "/api/jobs/[id]",
  },
  groups: {
    list: "/api/groups",
    add: "/api/groups",
    delete: "/api/groups/[id]",
    update: "/api/groups/[id]",
  },
  dashboard: {
    stats: "/api/dashboard/stats",
  },
} as const;

// Database Configuration
export const DB_CONFIG = {
  collections: {
    jobs: "job_posts",
    groups: "facebook_groups",
    credentials: "user_credentials",
  },
  indexes: {
    jobs: ["postId", "groupId", "scrapedAt", "isProcessed"],
    groups: ["groupId", "url"],
  },
} as const;

// Rate Limiting Configuration
export const RATE_LIMITS = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
} as const;

// Job Processing Configuration
export const JOB_KEYWORDS = [
  "hiring",
  "job",
  "position",
  "vacancy",
  "career",
  "opportunity",
  "work",
  "employment",
  "recruiter",
  "developer",
  "engineer",
  "designer",
  "manager",
  "analyst",
  "coordinator",
  "specialist",
  "consultant",
  "intern",
  "freelance",
  "remote",
  "full-time",
  "part-time",
  "contract",
] as const;

export const LOCATION_KEYWORDS = [
  "remote",
  "hybrid",
  "on-site",
  "location",
  "based in",
  "work from",
  "office",
] as const;
