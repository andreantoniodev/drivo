import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

@Controller('rate-test')
class TestThrottlerController {
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Get()
  test() {
    return { ok: true };
  }
}

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 2,
          },
        ]),
      ],
      controllers: [TestThrottlerController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve permitir requisições dentro do limite e bloquear a 3ª com 429', async () => {
    await request(app.getHttpServer()).get('/rate-test').expect(200);

    await request(app.getHttpServer()).get('/rate-test').expect(200);

    const response = await request(app.getHttpServer())
      .get('/rate-test')
      .expect(429);

    expect(response.body.statusCode).toBe(429);
    expect(response.body.message).toContain('Muitas requisições');
  });
});
