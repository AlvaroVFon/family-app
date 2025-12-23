import { ConsoleLogger } from './console-logger.service';
import { LogContext } from './logger.interface';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new ConsoleLogger();
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
});
