import { NestFactory } from '@nestjs/core';
import { logBootstrapError, registerProcessErrorHandlers } from '@revoke.cash/backend/logger/bootstrap';
import { Logger } from 'nestjs-pino';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  registerProcessErrorHandlers(logger);
  app.enableShutdownHooks();

  const config = app.get(ConfigService);

  await app.listen(config.port);
  logger.log(`auto-revoke executor listening on :${config.port}`, 'Bootstrap');
};

bootstrap().catch((error) => {
  logBootstrapError('auto-revoke executor', error);
  process.exit(1);
});
