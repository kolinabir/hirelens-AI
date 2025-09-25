import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface EnvConfig {
  // Facebook Credentials
  facebookEmail: string;
  facebookPassword: string;

  // MongoDB Configuration
  mongodbUri: string;
  mongodbDbName: string;

  // Application Configuration
  nodeEnv: string;
  port: number;
  baseUrl: string;

  // Scraping Configuration
  maxConcurrentSessions: number;
  defaultScrollLimit: number;
  requestDelayMs: number;

  // Security
  jwtSecret: string;
  encryptionKey: string;

  // Logging
  logLevel: string;
  logFile: string;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // Browser Configuration
  puppeteerHeadless: boolean;
  browserTimeout: number;

  // Optional Proxy Configuration
  proxyHost?: string;
  proxyPort?: number;
  proxyUsername?: string;
  proxyPassword?: string;

  // SMTP / Email
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFromEmail: string;

  // Smyth AI
  smythAiApiKey?: string;
  smythAiAuthToken?: string;

  // Apify API
  apifyApiToken?: string;

  // Ultravox API
  ultravoxApiKey?: string;
}

function validateEnvVar(
  name: string,
  value: string | undefined,
  defaultValue?: string
): string {
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue!;
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number value: ${value}`);
  }
  return parsed;
}

export const env: EnvConfig = {
  // Facebook Credentials
  facebookEmail: validateEnvVar("FACEBOOK_EMAIL", process.env.FACEBOOK_EMAIL),
  facebookPassword: validateEnvVar(
    "FACEBOOK_PASSWORD",
    process.env.FACEBOOK_PASSWORD
  ),

  // MongoDB Configuration
  mongodbUri: validateEnvVar(
    "MONGODB_URI",
    process.env.MONGODB_URI,
    "mongodb://localhost:27017/job-scraper"
  ),
  mongodbDbName: validateEnvVar(
    "MONGODB_DB_NAME",
    process.env.MONGODB_DB_NAME,
    "job_scraper"
  ),

  // Application Configuration
  nodeEnv: validateEnvVar("NODE_ENV", process.env.NODE_ENV, "development"),
  port: parseNumber(process.env.PORT, 3000),
  baseUrl: validateEnvVar(
    "BASE_URL",
    process.env.BASE_URL,
    "http://localhost:3000"
  ),

  // Scraping Configuration
  maxConcurrentSessions: parseNumber(process.env.MAX_CONCURRENT_SESSIONS, 1),
  defaultScrollLimit: parseNumber(process.env.DEFAULT_SCROLL_LIMIT, 50),
  requestDelayMs: parseNumber(process.env.REQUEST_DELAY_MS, 1000),

  // Security
  jwtSecret: validateEnvVar(
    "JWT_SECRET",
    process.env.JWT_SECRET,
    "default-jwt-secret-change-in-production"
  ),
  encryptionKey: validateEnvVar(
    "ENCRYPTION_KEY",
    process.env.ENCRYPTION_KEY,
    "default-32-char-encryption-key!!"
  ),

  // Logging
  logLevel: validateEnvVar("LOG_LEVEL", process.env.LOG_LEVEL, "info"),
  logFile: validateEnvVar("LOG_FILE", process.env.LOG_FILE, "logs/app.log"),

  // Rate Limiting
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 minutes
  rateLimitMaxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),

  // Browser Configuration
  puppeteerHeadless: parseBoolean(process.env.PUPPETEER_HEADLESS, true),
  browserTimeout: parseNumber(process.env.BROWSER_TIMEOUT, 30000),

  // Optional Proxy Configuration
  proxyHost: process.env.PROXY_HOST,
  proxyPort: process.env.PROXY_PORT
    ? parseNumber(process.env.PROXY_PORT, 0)
    : undefined,
  proxyUsername: process.env.PROXY_USERNAME,
  proxyPassword: process.env.PROXY_PASSWORD,

  // SMTP / Email
  smtpHost: validateEnvVar(
    "SMTP_HOST",
    process.env.SMTP_HOST,
    "smtp.gmail.com"
  ),
  smtpPort: parseNumber(process.env.SMTP_PORT, 465),
  smtpUser: validateEnvVar("SMTP_USER", process.env.SMTP_USER),
  smtpPass: validateEnvVar("SMTP_PASS", process.env.SMTP_PASS),
  smtpFromEmail: validateEnvVar(
    "SMTP_FROM_EMAIL",
    process.env.SMTP_FROM_EMAIL,
    process.env.SMTP_USER
  ),

  // Smyth AI
  smythAiApiKey: process.env.SMYTH_AI_API_KEY,
  smythAiAuthToken: process.env.SMYTH_AI_AUTH_TOKEN,

  // Apify API
  apifyApiToken: process.env.APIFY_API_TOKEN,

  // Ultravox API
  ultravoxApiKey: process.env.ULTRAVOX_API_KEY,
};

// Validate required environment variables on startup
export function validateEnvironment(): void {
  const requiredVars = ["FACEBOOK_EMAIL", "FACEBOOK_PASSWORD"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please copy .env.example to .env and fill in the required values."
    );
  }

  console.log("✅ Environment variables validated successfully");
}

export default env;
