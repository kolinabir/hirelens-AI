/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import winston from "winston";
import { env } from "../config/env";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Lazy initialization of logger to avoid filesystem operations on import
let logger: winston.Logger | null = null;

function initializeLogger(): winston.Logger {
  if (logger) return logger;

  // Create the logger with different configurations for different environments
  logger = winston.createLogger({
    level: env.logLevel,
    format: logFormat,
    defaultMeta: { service: "job-scraper" },
    transports: [],
  });

  // Configure transports based on environment
  if (env.nodeEnv === "production" || process.env.VERCEL) {
    // In production (like Vercel), only use console logging
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  } else {
    // In development, use both file and console logging
    try {
      // Create logs directory if it doesn't exist (only in development)
      const { mkdirSync } = require("fs");
      const { dirname } = require("path");

      const logDir = dirname(env.logFile);
      mkdirSync(logDir, { recursive: true });

      // Add file transports
      logger.add(
        new winston.transports.File({
          filename: env.logFile.replace(".log", "-error.log"),
          level: "error",
        })
      );
      logger.add(
        new winston.transports.File({
          filename: env.logFile,
        })
      );
    } catch (error) {
      // If file logging fails, fall back to console only
      console.warn("File logging unavailable, using console only:", error);
    }

    // Add console transport for development
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  return logger;
}

// Create specialized loggers for different components with lazy initialization
export const scraperLogger = {
  info: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "scraper" })
      .info(message, ...meta),
  error: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "scraper" })
      .error(message, ...meta),
  warn: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "scraper" })
      .warn(message, ...meta),
  debug: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "scraper" })
      .debug(message, ...meta),
};

export const apiLogger = {
  info: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "api" })
      .info(message, ...meta),
  error: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "api" })
      .error(message, ...meta),
  warn: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "api" })
      .warn(message, ...meta),
  debug: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "api" })
      .debug(message, ...meta),
};

export const dbLogger = {
  info: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "database" })
      .info(message, ...meta),
  error: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "database" })
      .error(message, ...meta),
  warn: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "database" })
      .warn(message, ...meta),
  debug: (message: any, ...meta: any[]) =>
    initializeLogger()
      .child({ component: "database" })
      .debug(message, ...meta),
};

// Export the lazy-initialized logger as default
const getLogger = () => initializeLogger();
export default getLogger;
