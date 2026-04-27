import { Logger as NestLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule.register(), { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const role = config.isManager ? 'manager' : 'worker';

  await app.listen(config.port);
  logger.log(`approval-monitor [${role}] listening on :${config.port}`, 'Bootstrap');
};

bootstrap().catch((error) => {
  NestLogger.error(
    'Failed to bootstrap approval-monitor',
    error instanceof Error ? error.stack : String(error),
    'Bootstrap',
  );
  process.exit(1);
});
