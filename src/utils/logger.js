import pino from 'pino';

export const logger = pino({
  level: 'info',
  messageKey: 'message',
  formatters: {
    level: (label) => ({ severity: label.toUpperCase() })
  }
});