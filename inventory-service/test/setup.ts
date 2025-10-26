import 'reflect-metadata';

// Suppress console methods during tests to reduce noise from intentional error scenarios
beforeAll(() => {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Suppress console output during tests
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();

  // Store originals for potential restoration
  (global as any).__originalConsoleError = originalConsoleError;
  (global as any).__originalConsoleWarn = originalConsoleWarn;
  (global as any).__originalConsoleLog = originalConsoleLog;
});

afterAll(() => {
  // Restore original console methods
  console.error = (global as any).__originalConsoleError;
  console.warn = (global as any).__originalConsoleWarn;
  console.log = (global as any).__originalConsoleLog;
});

// Override NestJS Logger to suppress all output during tests
jest.spyOn(require('@nestjs/common').Logger.prototype, 'log').mockImplementation();
jest.spyOn(require('@nestjs/common').Logger.prototype, 'error').mockImplementation();
jest.spyOn(require('@nestjs/common').Logger.prototype, 'warn').mockImplementation();
jest.spyOn(require('@nestjs/common').Logger.prototype, 'debug').mockImplementation();
jest.spyOn(require('@nestjs/common').Logger.prototype, 'verbose').mockImplementation();
