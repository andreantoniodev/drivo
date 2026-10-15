import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

export const SWAGGER_PATH = 'api/docs';

const apiContentSecurityPolicy = {
  useDefaults: false,
  directives: {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
  },
};

const swaggerContentSecurityPolicy = {
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:'],
    fontSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
};

export function applySecurity(app: INestApplication): void {
  const shared = {
    crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  };

  const apiHeaders = helmet({
    ...shared,
    contentSecurityPolicy: apiContentSecurityPolicy,
  });
  const swaggerHeaders = helmet({
    ...shared,
    contentSecurityPolicy: swaggerContentSecurityPolicy,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const isSwagger =
      req.path === `/${SWAGGER_PATH}` ||
      req.path.startsWith(`/${SWAGGER_PATH}/`);
    (isSwagger ? swaggerHeaders : apiHeaders)(req, res, next);
  });
}
