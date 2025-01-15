import pino from 'pino';

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

export const logger = pino({
  level: LOG_LEVEL,
  messageKey: 'message',
  formatters: {
    level: (label) => ({ severity: label.toUpperCase() })
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
});