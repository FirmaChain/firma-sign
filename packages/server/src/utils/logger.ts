import winston from 'winston';
import path from 'path';
import type { LoggingConfig } from '../config/ConfigManager.js';

// Create a basic logger instance with default settings
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'firma-sign-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Configure logger with settings from ConfigManager
 * This should be called after ConfigManager is initialized
 */
export function configureLogger(config: LoggingConfig, nodeEnv: string): void {
  // Update log level
  logger.level = config.level;

  // Clear all existing transports
  logger.clear();

  // Re-add console transport
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));

  // Add file transports in production
  if (nodeEnv === 'production') {
    const logDir = config.directory;
    
    logger.add(new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }));
    
    logger.add(new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }));
  }

  logger.info('Logger configured', {
    level: config.level,
    environment: nodeEnv,
    directory: nodeEnv === 'production' ? config.directory : 'console only'
  });
}