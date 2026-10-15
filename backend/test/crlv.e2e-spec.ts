import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CRLV & Gemini AI (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  let user1VehicleId: string;

  const overrideConfig = (overrides: Record<string, string | undefined>) => {
    const config = app.get(ConfigService);
    const original = config.get.bind(config);
    const spy = jest
      .spyOn(config, 'get')
      .mockImplementation(((key: string, ...rest: unknown[]) =>
        key in overrides
          ? overrides[key]
          : (original as (...a: unknown[]) => unknown)(key, ...rest)) as never);
    return () => spy.mockRestore();
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    const res1 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Mariana CRLV',
        email: `crlv1_${Date.now()}@drivo.com`,
        password: 'Password@2026',
      })
      .expect(201);

    user1Token = res1.body.accessToken;
    user1Id = res1.body.user.id;

    const res2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Outro Usuario',
        email: `crlv2_${Date.now()}@drivo.com`,
        password: 'Password@2026',
      })
      .expect(201);

    user2Token = res2.body.accessToken;
    user2Id = res2.body.user.id;

    const randomLetter = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
    );
    const randomNum = Math.floor(10 + Math.random() * 89);
    const vehicleRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        brand: 'TOYOTA',
        model: 'Corolla Altis Hybrid',
        plate: `CR${randomLetter}4B${randomNum}`,
        yearFabrication: 2022,
        yearModel: 2023,
      })
      .expect(201);

    user1VehicleId = vehicleRes.body.id;
  });

  afterAll(async () => {
    if (user1Id) {
      await prisma.user.delete({ where: { id: user1Id } }).catch(() => {});
    }
    if (user2Id) {
      await prisma.user.delete({ where: { id: user2Id } }).catch(() => {});
    }
    await app.close();
  });

  describe('POST /crlv/scan', () => {
    it('deve retornar 401 Unauthorized se não houver token JWT', async () => {
      await request(app.getHttpServer())
        .post('/crlv/scan')
        .attach('file', Buffer.from('%PDF-1.4 teste'), 'documento.pdf')
        .expect(401);
    });

    it('deve retornar 400 Bad Request se nenhum arquivo for anexado', async () => {
      await request(app.getHttpServer())
        .post('/crlv/scan')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });

    it('deve retornar 400 Bad Request se o arquivo não for PDF ou imagem permitida', async () => {
      const response = await request(app.getHttpServer())
        .post('/crlv/scan')
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', Buffer.from('conteudo de texto simples'), 'arquivo.txt')
        .expect(400);

      expect(response.body.message).toContain('Formato inválido');
    });

    it('deve retornar 413 quando o arquivo passar de 10 MB', async () => {
      const response = await request(app.getHttpServer())
        .post('/crlv/scan')
        .set('Authorization', `Bearer ${user1Token}`)
        .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
          filename: 'grande.pdf',
          contentType: 'application/pdf',
        })
        .expect(413);

      expect(response.body.message).toContain('10 MB');
    });

    it('deve retornar 503 quando a chave do Gemini não estiver configurada', async () => {
      const restore = overrideConfig({
        GEMINI_API_KEY: undefined,
        GEMINI_MOCK: 'false',
      });

      try {
        await request(app.getHttpServer())
          .post('/crlv/scan')
          .set('Authorization', `Bearer ${user1Token}`)
          .attach(
            'file',
            Buffer.from('%PDF-1.4 simulando_crlv_oficial'),
            'CRLV.pdf',
          )
          .expect(503);
      } finally {
        restore();
      }
    });

    it('deve processar o CRLV e devolver os dados estruturados do veículo (modo demonstração)', async () => {
      const restore = overrideConfig({ GEMINI_MOCK: 'true' });

      let response: request.Response;
      try {
        response = await request(app.getHttpServer())
          .post('/crlv/scan')
          .set('Authorization', `Bearer ${user1Token}`)
          .attach(
            'file',
            Buffer.from('%PDF-1.4 simulando_crlv_oficial'),
            'CRLV_Toyota_Corolla.pdf',
          )
          .expect(200);
      } finally {
        restore();
      }

      expect(response.body).toBeDefined();
      expect(response.body.vehicle).toBeDefined();
      expect(response.body.vehicle.brand).toBe('TOYOTA');
      expect(response.body.vehicle.plate).toBe('RTX4B21');
      expect(response.body.vehicle.yearFabrication).toBe(2022);
      expect(response.body.vehicle.yearModel).toBe(2023);
      expect(response.body.document).toBeDefined();
      expect(response.body.document.nomeProprietario).toBe('Mariana Costa');
      expect(response.body.fileName).toBe('CRLV_Toyota_Corolla.pdf');
      expect(response.body.isMock).toBe(true);
    });
  });

  describe('POST /crlv/attach/:vehicleId', () => {
    it('deve retornar 404 se o veículo não pertencer ao usuário', async () => {
      await request(app.getHttpServer())
        .post(`/crlv/attach/${user1VehicleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .field('numeroCrLV', '999999999999')
        .expect(404);
    });

    it('deve anexar documento e metadados com sucesso ao veículo do usuário', async () => {
      const response = await request(app.getHttpServer())
        .post(`/crlv/attach/${user1VehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .attach(
          'file',
          Buffer.from('%PDF-1.4 arquivo_salvo_definitivo'),
          'CRLV_Anexado.pdf',
        )
        .field('numeroCrLV', '123456789012')
        .field('codigoSeguranca', '987654321')
        .field('exercicio', 2023)
        .field('nomeProprietario', 'Mariana Costa')
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.vehicleId).toBe(user1VehicleId);
      expect(response.body.numeroCrLV).toBe('123456789012');
      expect(response.body.fileName).toBe('CRLV_Anexado.pdf');
      expect(response.body).not.toHaveProperty('fileUrl');
      expect(response.body).not.toHaveProperty('rawAiExtraction');
    });
  });

  describe('GET /crlv/:vehicleId', () => {
    it('deve retornar 404 se outro usuário tentar visualizar o CRLV', async () => {
      await request(app.getHttpServer())
        .get(`/crlv/${user1VehicleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('deve retornar os dados do CRLV para o proprietário do veículo', async () => {
      const response = await request(app.getHttpServer())
        .get(`/crlv/${user1VehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.numeroCrLV).toBe('123456789012');
      expect(response.body.nomeProprietario).toBe('Mariana Costa');
      expect(response.body).not.toHaveProperty('fileUrl');
      expect(response.body).not.toHaveProperty('rawAiExtraction');
    });

    it('o CRLV aninhado no veículo também segue o DTO (sem fileUrl)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${user1VehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.crlv).toMatchObject({ numeroCrLV: '123456789012' });
      expect(response.body.crlv).not.toHaveProperty('fileUrl');
      expect(response.body.crlv).not.toHaveProperty('rawAiExtraction');
    });
  });

  describe('GET /crlv/:vehicleId/download', () => {
    it('deve retornar 404 se outro usuário tentar baixar o arquivo', async () => {
      await request(app.getHttpServer())
        .get(`/crlv/${user1VehicleId}/download`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('deve realizar o download do arquivo com os headers corretos para o proprietário', async () => {
      const response = await request(app.getHttpServer())
        .get(`/crlv/${user1VehicleId}/download`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain(
        'attachment; filename=',
      );
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('DELETE /crlv/:vehicleId', () => {
    it('deve retornar 404 se outro usuário tentar excluir o CRLV', async () => {
      await request(app.getHttpServer())
        .delete(`/crlv/${user1VehicleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('deve excluir o CRLV do veículo com sucesso', async () => {
      await request(app.getHttpServer())
        .delete(`/crlv/${user1VehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/crlv/${user1VehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });
  });
});
