import { type DynamicModule, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { INSTANCE_ID } from '../observability/instance';

interface BackendLoggerModuleOptions {
  serviceName: string;
  role?: string;
}

const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

@Module({})
export class BackendLoggerModule {
  static register({ serviceName, role }: BackendLoggerModuleOptions): DynamicModule {
    return {
      module: BackendLoggerModule,
      imports: [
        PinoLoggerModule.forRoot({
          pinoHttp: {
            level: LOG_LEVEL,
            transport: IS_PRODUCTION
              ? undefined
              : { target: 'pino-pretty', options: { colorize: true, singleLine: true, translateTime: 'SYS:HH:MM:ss' } },
            autoLogging: {
              ignore: (req) => req.url === '/health',
            },
            base: { service: serviceName, ...(role ? { role } : {}), instance: INSTANCE_ID },
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.apiKey'],
              censor: '[Redacted]',
            },
          },
        }),
      ],
      exports: [PinoLoggerModule],
    };
  }
}
