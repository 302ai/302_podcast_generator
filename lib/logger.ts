const pino = require('pino')
import { Logger } from 'pino'

export const logger: Logger =
  process.env.NODE_ENV === 'production'
    ? pino({
        level: process.env.PINO_LOG_LEVEL || 'warn',
      })
    : pino({
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
        level: process.env.PINO_LOG_LEVEL || 'debug',
      })
