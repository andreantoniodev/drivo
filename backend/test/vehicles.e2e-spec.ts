import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Vehicles (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  let createdVehicleId: string;

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
        name: 'User One',
        email: `u1_${Date.now()}@drivo.com`,
        password: 'Password@2026',
      })
      .expect(201);

    user1Token = res1.body.accessToken;
    user1Id = res1.body.user.id;

    const res2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User Two',
        email: `u2_${Date.now()}@drivo.com`,
        password: 'Password@2026',
      })
      .expect(201);

    user2Token = res2.body.accessToken;
    user2Id = res2.body.user.id;
  });

  afterAll(async () => {
    if (user1Id || user2Id) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [user1Id, user2Id].filter(Boolean),
          },
        },
      });
    }

    await app.close();
  });

  describe('POST /vehicles', () => {
    it('deve criar um veículo para o Usuário 1 com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          brand: 'TOYOTA',
          model: 'Corolla Altis Hybrid',
          plate: 'RTX4B21',
          yearFabrication: 2022,
          yearModel: 2023,
          color: 'Prata',
          fuelType: 'Híbrido',
          category: 'Passageiro',
          mileage: 18000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.brand).toBe('TOYOTA');
      expect(response.body.model).toBe('Corolla Altis Hybrid');
      expect(response.body.plate).toBe('RTX4B21');
      expect(response.body.userId).toBe(user1Id);

      createdVehicleId = response.body.id;
    });

    it('deve rejeitar criação com mesma placa para o mesmo usuário (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          brand: 'TOYOTA',
          model: 'Outro Modelo',
          plate: 'RTX4B21',
          yearFabrication: 2022,
          yearModel: 2023,
        })
        .expect(409);
    });

    it('deve rejeitar placa inválida (400 Bad Request)', async () => {
      await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          brand: 'HONDA',
          model: 'Civic',
          plate: 'PLACA-INVALIDA',
          yearFabrication: 2020,
          yearModel: 2020,
        })
        .expect(400);
    });
  });

  describe('GET /vehicles', () => {
    it('deve listar o veículo criado para o Usuário 1', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some((v: any) => v.id === createdVehicleId)).toBe(
        true,
      );
    });

    it('NÃO deve exibir o veículo do Usuário 1 para o Usuário 2 (Isolamento)', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.some((v: any) => v.id === createdVehicleId)).toBe(
        false,
      );
    });

    it('deve filtrar veículos pelo termo de busca (query param ?search=)', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles?search=Corolla')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].model).toContain('Corolla');

      const emptyRes = await request(app.getHttpServer())
        .get('/vehicles?search=TermoQueNaoExiste123')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(emptyRes.body.length).toBe(0);
    });
  });

  describe('GET /vehicles/:id', () => {
    it('deve retornar detalhes do veículo para o dono (Usuário 1)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.id).toBe(createdVehicleId);
      expect(response.body.model).toBe('Corolla Altis Hybrid');
    });

    it('deve retornar 404 se o Usuário 2 tentar acessar o veículo do Usuário 1', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });
  });

  describe('serialização por DTO de resposta', () => {
    const publicFields = [
      'id',
      'userId',
      'brand',
      'model',
      'plate',
      'renavam',
      'chassi',
      'yearFabrication',
      'yearModel',
      'color',
      'fuelType',
      'category',
      'mileage',
      'nickname',
      'imageUrl',
      'crlv',
      'createdAt',
      'updatedAt',
    ];

    it('o veículo só expõe os campos do VehicleResponseDto', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const extra = Object.keys(response.body).filter(
        (key) => !publicFields.includes(key),
      );
      expect(extra).toEqual([]);
    });

    it('cada item da listagem segue o mesmo DTO', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      for (const item of response.body) {
        expect(
          Object.keys(item).filter((key) => !publicFields.includes(key)),
        ).toEqual([]);
      }
    });
  });

  describe('regras de entrada e concorrência', () => {
    it('rejeita id que não é UUID com 400 (ParseUUIDPipe) em vez de consultar o banco', async () => {
      await request(app.getHttpServer())
        .get('/vehicles/nao-e-um-uuid')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      await request(app.getHttpServer())
        .get('/vehicles/nao-e-um-uuid/image')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });

    it('permite no máximo uma placa por usuário mesmo em requisições simultâneas', async () => {
      const body = {
        brand: 'FIAT',
        model: 'Uno',
        plate: 'CNC0R01',
        yearFabrication: 2018,
        yearModel: 2019,
      };
      const send = () =>
        request(app.getHttpServer())
          .post('/vehicles')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(body);

      const results = await Promise.all([send(), send(), send(), send()]);
      const statuses = results
        .map((response) => response.status)
        .sort((a, b) => a - b);

      expect(statuses.filter((status) => status === 201)).toHaveLength(1);
      expect(statuses.filter((status) => status === 409)).toHaveLength(3);

      const rows = await prisma.vehicle.count({
        where: { userId: user1Id, plate: 'CNC0R01' },
      });
      expect(rows).toBe(1);
    });

    it('o mesmo usuário não consegue trocar a placa de um veículo para a de outro seu', async () => {
      const first = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          brand: 'VW',
          model: 'Gol',
          plate: 'GOL1A11',
          yearFabrication: 2015,
          yearModel: 2016,
        })
        .expect(201);
      await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          brand: 'VW',
          model: 'Fox',
          plate: 'FOX2B22',
          yearFabrication: 2015,
          yearModel: 2016,
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/vehicles/${first.body.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ plate: 'FOX2B22' })
        .expect(409);
    });

    it('usuários diferentes podem ter a mesma placa', async () => {
      await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          brand: 'FIAT',
          model: 'Uno',
          plate: 'CNC0R01',
          yearFabrication: 2018,
          yearModel: 2019,
        })
        .expect(201);
    });
  });

  describe('GET /vehicles/:id/image', () => {
    const photo = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9,
    ]);

    it('deve retornar 404 enquanto o veículo não tem foto', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}/image`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('deve servir a foto guardada no banco para o dono, com o Content-Type correto', async () => {
      await prisma.vehicleImage.create({
        data: {
          vehicleId: createdVehicleId,
          mimeType: 'image/jpeg',
          size: photo.length,
          data: photo,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}/image`)
        .set('Authorization', `Bearer ${user1Token}`)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('image/jpeg');
      expect(response.headers['cache-control']).toContain('private');
      expect(Buffer.compare(response.body as Buffer, photo)).toBe(0);
    });

    it('deve expor a URL da foto no veículo, sem trazer os bytes', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.imageUrl).toMatch(
        new RegExp(`^/vehicles/${createdVehicleId}/image\\?v=\\d+$`),
      );
      expect(response.body).not.toHaveProperty('image');

      const list = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(JSON.stringify(list.body)).not.toContain('"data"');
    });

    it('deve retornar 404 para outro usuário (isolamento)', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}/image`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}/image`)
        .expect(401);
    });
  });

  describe('PATCH /vehicles/:id', () => {
    it('deve atualizar o veículo para o dono (Usuário 1)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          color: 'Branco Pérola',
          mileage: 21500,
        })
        .expect(200);

      expect(response.body.color).toBe('Branco Pérola');
      expect(response.body.mileage).toBe(21500);
    });

    it('deve retornar 404 se o Usuário 2 tentar editar o veículo do Usuário 1', async () => {
      await request(app.getHttpServer())
        .patch(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          color: 'Preto',
        })
        .expect(404);
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('deve retornar 404 se o Usuário 2 tentar excluir o veículo do Usuário 1', async () => {
      await request(app.getHttpServer())
        .delete(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('deve excluir o veículo com sucesso quando solicitado pelo dono', async () => {
      await request(app.getHttpServer())
        .delete(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });
  });
});
