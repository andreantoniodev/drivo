import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/common/docs/setup-swagger';
import { applySecurity } from '../src/common/security/apply-security';

describe('Cabeçalhos de segurança e Swagger (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applySecurity(app);
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('respostas da API', () => {
    it('envia os cabeçalhos do helmet e não revela o framework', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['referrer-policy']).toBeDefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('usa uma CSP restritiva (a API só responde JSON)', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      const csp = response.headers['content-security-policy'];

      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).not.toContain('upgrade-insecure-requests');
    });

    it('permite que o frontend (outra origem) consuma a API', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.headers['cross-origin-resource-policy']).toBe(
        'cross-origin',
      );
    });

    it('aplica os cabeçalhos também nas respostas de erro', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .expect(401);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toContain(
        "default-src 'none'",
      );
    });
  });

  describe('Swagger UI em /api/docs', () => {
    it('é servido com uma CSP própria que permite o próprio UI, sem abrir scripts externos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect(200);
      const csp = response.headers['content-security-policy'];

      expect(response.headers['content-type']).toContain('text/html');
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).not.toContain("default-src 'none'");
      expect(csp).not.toContain('upgrade-insecure-requests');
      expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      expect(csp).not.toMatch(/https?:\/\//);
    });

    it('serve os arquivos do UI com a mesma política', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs/swagger-ui-init.js')
        .expect(200);

      expect(response.headers['content-security-policy']).toContain(
        "script-src 'self'",
      );
    });

    it('publica o documento OpenAPI com as rotas e os DTOs de resposta', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);
      const { paths, components } = response.body;

      expect(paths).toHaveProperty(['/health']);
      expect(paths).toHaveProperty(['/vehicles/{id}/image']);
      expect(components.schemas.VehicleResponseDto).toBeDefined();

      const crlvFields = Object.keys(
        components.schemas.CrlvResponseDto.properties,
      );
      expect(crlvFields).toContain('numeroCrLV');
      expect(crlvFields).not.toContain('fileUrl');
      expect(crlvFields).not.toContain('rawAiExtraction');
    });
  });
});
