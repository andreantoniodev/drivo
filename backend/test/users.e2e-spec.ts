import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users & sessão (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = `users_pwd_${Date.now()}@drivo.test`;
  const originalPassword = 'Senha1234';
  let token: string;
  let userId: string;

  const login = (password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Usuário Senha', email, password: originalPassword })
      .expect(201);

    token = response.body.accessToken;
    userId = response.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'users_pwd_' } },
    });
    await app.close();
  });

  describe('PATCH /users/me/password', () => {
    const patch = (body: object, bearer: string | null = token) => {
      const req = request(app.getHttpServer()).patch('/users/me/password');
      return bearer
        ? req.set('Authorization', `Bearer ${bearer}`).send(body)
        : req.send(body);
    };

    it('exige autenticação', async () => {
      await patch(
        { currentPassword: originalPassword, newPassword: 'Nova12345' },
        null,
      ).expect(401);
    });

    it('rejeita senha atual incorreta com 401 (sem derrubar a sessão)', async () => {
      await patch({
        currentPassword: 'Errada1234',
        newPassword: 'Nova12345',
      }).expect(401);

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('rejeita nova senha fraca (sem letra, sem número ou curta) com 400', async () => {
      await patch({
        currentPassword: originalPassword,
        newPassword: 'abcdefgh',
      }).expect(400);
      await patch({
        currentPassword: originalPassword,
        newPassword: '12345678',
      }).expect(400);
      await patch({
        currentPassword: originalPassword,
        newPassword: 'Ab1',
      }).expect(400);
    });

    it('rejeita campos desconhecidos (whitelist)', async () => {
      await patch({
        currentPassword: originalPassword,
        newPassword: 'Nova12345',
        role: 'admin',
      }).expect(400);
    });

    it('altera a senha: a nova funciona no login e a antiga deixa de funcionar', async () => {
      await patch({
        currentPassword: originalPassword,
        newPassword: 'Nova12345',
      }).expect(200);

      await login('Nova12345').expect(200);
      await login(originalPassword).expect(401);
    });
  });

  describe('token de usuário excluído', () => {
    it('responde 401 quando o usuário do token não existe mais', async () => {
      await prisma.user.delete({ where: { id: userId } });

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
