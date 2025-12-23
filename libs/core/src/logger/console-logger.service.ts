import { Injectable } from '@nestjs/common';
import { Logger, LogContext } from './logger.interface';
import { LoggerConfigService } from '../config/services/logger-config.service';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

@Injectable()
export class ConsoleLogger implements Logger {
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(private readonly loggerConfig: LoggerConfigService) {}

  private log(level: LogLevel, message: string, context?: LogContext) {
    const configuredLevel = this.loggerConfig.level;
    if (this.levelPriority[level] < this.levelPriority[configuredLevel]) {
      return;
    }

    const logEntry: Record<string, any> = {
      level,
      message,
      ...context,
    };

    if (this.loggerConfig.includeTimestamp) {
      logEntry.timestamp = new Date().toISOString();
    }

    const output =
      this.loggerConfig.format === 'json'
        ? logEntry
        : this.formatPretty(logEntry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  private formatPretty(logEntry: Record<string, any>): string {
    const { timestamp, level, message, ...context } = logEntry;
    let output = '';

    if (timestamp) {
      output += `[${timestamp}] `;
    }

    output += `${level.toUpperCase()}: ${message}`;

    if (Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }

    return output;
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }
}
