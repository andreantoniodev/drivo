import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwagger } from './common/docs/setup-swagger';
import { applySecurity } from './common/security/apply-security';
import { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  applySecurity(app);

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const corsOrigins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  if (
    config.get('NODE_ENV', { infer: true }) === 'production' &&
    config.get('JWT_SECRET', { infer: true }).startsWith('dev-only')
  ) {
    logger.warn(
      'JWT_SECRET está com o valor de desenvolvimento. Defina um segredo próprio antes de publicar.',
    );
  }

  app.enableShutdownHooks();

  setupSwagger(app);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`🚀 Servidor Drivo rodando em: http://localhost:${port}`);
  logger.log(
    `📚 Documentação Swagger disponível em: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
