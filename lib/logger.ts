import winston from 'winston';
import { env } from '../config/env';

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const logDir = dirname(env.logFile);
try {
  mkdirSync(logDir, { recursive: true });
} catch {
  // Directory already exists or other error
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: env.logLevel,
  format: logFormat,
  defaultMeta: { service: 'job-scraper' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: env.logFile.replace('.log', '-error.log'),
      level: 'error',
    }),
    // Write all logs with importance level of `info` or less to combined log
    new winston.transports.File({
      filename: env.logFile,
    }),
  ],
});

// If we're not in production, log to the console as well
if (env.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Create specialized loggers for different components
export const scraperLogger = logger.child({ component: 'scraper' });
export const apiLogger = logger.child({ component: 'api' });
export const dbLogger = logger.child({ component: 'database' });

export default logger;