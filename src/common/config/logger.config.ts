import { Params } from 'nestjs-pino';
import { join } from 'path';

export const loggerSplitConfig: Params = {
  pinoHttp: {
    customProps: () => ({
      context: 'HTTP',
      environment: process.env.NODE_ENV || 'development',
    }),
    ...(process.env.NODE_ENV !== 'production'
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              levelFirst: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss.l',
              ignore: 'pid,hostname',
              messageFormat: '{context} [{req.method}] {req.url} - {msg}',
            },
          },
        }
      : {
          transport: {
            targets: [
              {
                target: 'pino-roll',
                level: 'error',
                options: {
                  file: join(process.cwd(), 'logs/error'),
                  frequency: 'daily',
                  keep: 7,
                  sync: true,
                  mkdir: true,
                  dateFormat: 'yyyy-MM-dd',
                },
              },
              {
                target: 'pino-roll',
                level: 'info',
                options: {
                  file: join(process.cwd(), 'logs/info'),
                  frequency: 'daily',
                  keep: 1,
                  sync: true,
                  mkdir: true,
                  dateFormat: 'yyyy-MM-dd',
                },
              },
            ],
          },
        }),
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      if (res.statusCode === 404) {
        return 'Resource not found';
      }
      return `${req.method} ${req.url} completed`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} failed: ${err.message}`;
    },
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration',
    },
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
      err: (err: any) => ({
        type: err.type,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      }),
    },
    level: process.env.LOG_LEVEL || 'info',
    autoLogging: true,
    genReqId: (req: any) => {
      const requestId = req.headers?.['x-request-id'] || req.id;
      return requestId as string;
    },
  },
};
