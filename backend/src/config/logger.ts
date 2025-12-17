/**
 * Logger Configuration
 *
 * Configures Winston logger with multiple transports for application-wide logging.
 * Logs are written to console and files (error.log and combined.log).
 * Supports log rotation to prevent disk space issues.
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom Log Format
 *
 * Formats log messages with timestamp, level, and message/stack trace.
 * Format: "YYYY-MM-DD HH:mm:ss [LEVEL]: MESSAGE"
 */
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

/**
 * Winston Logger Instance
 *
 * Configured with multiple transports:
 * - Console: For real-time monitoring during development
 * - error.log: Contains only error-level logs
 * - combined.log: Contains all logs
 *
 * Features:
 * - Automatic log rotation (5MB max file size, 5 files max)
 * - Error stack trace capture
 * - Colorized output in development
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }), // Capture error stack traces
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport - for real-time monitoring
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep last 5 files
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep last 5 files
    }),
  ],
});

// In development, add additional console transport with colors and timestamps
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    })
  );
}

export default logger;
