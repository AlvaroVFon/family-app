import { ConsoleLogger } from './console-logger.service';
import { LogContext } from './logger.interface';
import { LoggerConfigService } from '../config/services/logger-config.service';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  let loggerConfig: jest.Mocked<LoggerConfigService>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock LoggerConfigService with default values
    loggerConfig = {
      level: 'debug',
      format: 'json',
      includeTimestamp: true,
    } as jest.Mocked<LoggerConfigService>;

    logger = new ConsoleLogger(loggerConfig);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('info', () => {
    it('should log info message with timestamp and level', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = consoleLogSpy.mock.calls[0][0];

      expect(loggedData).toHaveProperty('timestamp');
      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('Test message');
    });

    it('should include context in log', () => {
      const context: LogContext = {
        module: 'TestModule',
        requestId: '123',
      };

      logger.info('Test message', context);

      const loggedData = consoleLogSpy.mock.calls[0][0];
      expect(loggedData.module).toBe('TestModule');
      expect(loggedData.requestId).toBe('123');
    });
  });

  describe('warn', () => {
    it('should log warning with correct level', () => {
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedData = consoleWarnSpy.mock.calls[0][0];

      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe('Warning message');
    });
  });

  describe('error', () => {
    it('should log error with correct level', () => {
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = consoleErrorSpy.mock.calls[0][0];

      expect(loggedData.level).toBe('error');
      expect(loggedData.message).toBe('Error message');
    });

    it('should include error context', () => {
      logger.error('Error occurred', { error: 'Details' });

      const loggedData = consoleErrorSpy.mock.calls[0][0];
      expect(loggedData.error).toBe('Details');
    });
  });

  describe('debug', () => {
    it('should log debug message with correct level', () => {
      logger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const loggedData = consoleDebugSpy.mock.calls[0][0];

      expect(loggedData.level).toBe('debug');
      expect(loggedData.message).toBe('Debug message');
    });
  });

  describe('timestamp format', () => {
    it('should use ISO 8601 format for timestamp', () => {
      logger.info('Test');

      const loggedData = consoleLogSpy.mock.calls[0][0];
      const timestamp = loggedData.timestamp;

      // Validate ISO 8601 format
      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('context merging', () => {
    it('should merge context with log entry', () => {
      const context: LogContext = {
        module: 'UserService',
        requestId: 'req-123',
        userId: '456',
        custom: 'value',
      };

      logger.info('Operation completed', context);

      const loggedData = consoleLogSpy.mock.calls[0][0];
      expect(loggedData.module).toBe('UserService');
      expect(loggedData.requestId).toBe('req-123');
      expect(loggedData.userId).toBe('456');
      expect(loggedData.custom).toBe('value');
    });

    it('should work without context', () => {
      logger.info('Simple message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = consoleLogSpy.mock.calls[0][0];
      expect(loggedData.message).toBe('Simple message');
    });
  });

  describe('log level filtering', () => {
    it('should filter debug logs when level is info', () => {
      const infoConfig = {
        level: 'info' as const,
        format: 'json' as const,
        includeTimestamp: true,
      } as jest.Mocked<LoggerConfigService>;
      const loggerWithInfo = new ConsoleLogger(infoConfig);

      loggerWithInfo.debug('Debug message');
      loggerWithInfo.info('Info message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should only log errors when level is error', () => {
      const errorConfig = {
        level: 'error' as const,
        format: 'json' as const,
        includeTimestamp: true,
      } as jest.Mocked<LoggerConfigService>;
      const loggerWithError = new ConsoleLogger(errorConfig);

      loggerWithError.debug('Debug message');
      loggerWithError.info('Info message');
      loggerWithError.warn('Warning message');
      loggerWithError.error('Error message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('format configuration', () => {
    it('should use pretty format when configured', () => {
      const prettyConfig = {
        level: 'debug' as const,
        format: 'pretty' as const,
        includeTimestamp: true,
      } as jest.Mocked<LoggerConfigService>;
      const loggerWithPretty = new ConsoleLogger(prettyConfig);

      loggerWithPretty.info('Test message', { module: 'TestModule' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(typeof output).toBe('string');
      expect(output).toContain('INFO: Test message');
    });

    it('should use json format when configured', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0] as Record<string, any>;
      expect(typeof output).toBe('object');
      expect(output.level).toBe('info');
    });
  });

  describe('timestamp configuration', () => {
    it('should include timestamp when configured', () => {
      logger.info('Test message');

      const loggedData = consoleLogSpy.mock.calls[0][0] as Record<string, any>;
      expect(loggedData).toHaveProperty('timestamp');
    });

    it('should exclude timestamp when configured', () => {
      const noTimestampConfig = {
        level: 'debug' as const,
        format: 'json' as const,
        includeTimestamp: false,
      } as jest.Mocked<LoggerConfigService>;
      const loggerNoTimestamp = new ConsoleLogger(noTimestampConfig);

      loggerNoTimestamp.info('Test message');

      const loggedData = consoleLogSpy.mock.calls[0][0] as Record<string, any>;
      expect(loggedData).not.toHaveProperty('timestamp');
    });
  });
});
