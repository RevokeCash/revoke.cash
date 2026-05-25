import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.logLevel,
          transport: config.isProduction
            ? undefined
            : { target: 'pino-pretty', options: { colorize: true, singleLine: true, translateTime: 'SYS:HH:MM:ss' } },
          autoLogging: {
            ignore: (req) => req.url === '/health',
          },
          base: { service: 'indexer', role: config.isManager ? 'manager' : 'worker' },
          redact: {
            paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.apiKey'],
            censor: '[Redacted]',
          },
        },
      }),
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
