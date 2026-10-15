import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    name: 'E2E Test User',
    email: `e2e_${Date.now()}@drivo.com`,
    password: 'Password@2026',
  };

  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'e2e_',
        },
      },
    });

    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user.password).toBeUndefined();
    });

    it('deve rejeitar tentativa de registro com mesmo e-mail (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('deve rejeitar senha fraca sem número ou menor que 8 caracteres (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Senha Fraca',
          email: `weak_${Date.now()}@drivo.com`,
          password: 'fraca',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('deve realizar login com sucesso e retornar token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
      authToken = response.body.accessToken;
    });

    it('deve rejeitar login com senha incorreta (401 Unauthorized)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'SenhaIncorreta@123',
        })
        .expect(401);
    });
  });

  describe('/users/me (GET)', () => {
    it('deve rejeitar requisição sem token (401 Unauthorized)', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('deve retornar o perfil do usuário com Bearer token válido', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email.toLowerCase());
      expect(response.body).toHaveProperty('vehicleCount');
      expect(response.body).not.toHaveProperty('password');
      expect(Object.keys(response.body).sort()).toEqual(
        [
          'createdAt',
          'email',
          'id',
          'name',
          'updatedAt',
          'vehicleCount',
        ].sort(),
      );
    });
  });

  describe('/users/me (PATCH)', () => {
    it('deve atualizar o nome do usuário', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Updated Name',
        })
        .expect(200);

      expect(response.body.name).toBe('E2E Updated Name');
    });
  });

  describe('/auth/logout (POST)', () => {
    it('deve responder 200 OK com confirmação de logout', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('sucesso');
    });
  });
});
