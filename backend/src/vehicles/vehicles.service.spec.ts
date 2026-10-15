import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const VEHICLE_INCLUDE = {
  crlv: true,
  image: { select: { vehicleId: true, updatedAt: true } },
};

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prismaService: {
    vehicle: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const userId = 'user-uuid-123';
  const vehicleId = 'vehicle-uuid-456';

  const mockVehicle = {
    id: vehicleId,
    userId,
    brand: 'TOYOTA',
    model: 'Corolla Altis Hybrid',
    plate: 'RTX4B21',
    yearFabrication: 2022,
    yearModel: 2023,
    color: 'Prata',
    fuelType: 'Híbrido',
    category: 'Passageiro',
    mileage: 18000,
    renavam: '01234567890',
    chassi: '9BRBL3HE8P0124821',
    imageUrl: 'https://example.com/corolla.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    crlv: null,
  };

  beforeEach(async () => {
    prismaService = {
      vehicle: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um veículo com sucesso vinculado ao usuário', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(null);
      prismaService.vehicle.create.mockResolvedValue(mockVehicle);

      const result = await service.create(userId, {
        brand: 'TOYOTA',
        model: 'Corolla Altis Hybrid',
        plate: 'RTX4B21',
        yearFabrication: 2022,
        yearModel: 2023,
      });

      expect(prismaService.vehicle.findFirst).toHaveBeenCalledWith({
        where: { userId, plate: 'RTX4B21' },
      });
      expect(prismaService.vehicle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          brand: 'TOYOTA',
          model: 'Corolla Altis Hybrid',
          plate: 'RTX4B21',
        }),
        include: VEHICLE_INCLUDE,
      });
      expect(result.id).toBe(vehicleId);
    });

    it('deve lançar ConflictException se o usuário já tiver um veículo com a mesma placa', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);

      await expect(
        service.create(userId, {
          brand: 'TOYOTA',
          model: 'Corolla Altis Hybrid',
          plate: 'RTX4B21',
          yearFabrication: 2022,
          yearModel: 2023,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('deve listar apenas os veículos do usuário autenticado', async () => {
      prismaService.vehicle.findMany.mockResolvedValue([mockVehicle]);

      const result = await service.findAll(userId);

      expect(prismaService.vehicle.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: VEHICLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('deve aplicar filtros de busca case-insensitive por modelo, marca ou placa', async () => {
      prismaService.vehicle.findMany.mockResolvedValue([mockVehicle]);

      await service.findAll(userId, { search: 'Corolla' });

      expect(prismaService.vehicle.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          OR: [
            { model: { contains: 'Corolla', mode: 'insensitive' } },
            { brand: { contains: 'Corolla', mode: 'insensitive' } },
            { plate: { contains: 'Corolla', mode: 'insensitive' } },
          ],
        },
        include: VEHICLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar o veículo se pertencer ao usuário', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);

      const result = await service.findOne(userId, vehicleId);

      expect(result.id).toBe(vehicleId);
      expect(prismaService.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: vehicleId, userId },
        include: VEHICLE_INCLUDE,
      });
    });

    it('deve lançar NotFoundException se o veículo não existir ou pertencer a outro usuário', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, 'outro-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar os dados do veículo com sucesso', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);
      prismaService.vehicle.update.mockResolvedValue({
        ...mockVehicle,
        mileage: 20000,
      });

      const result = await service.update(userId, vehicleId, {
        mileage: 20000,
      });

      expect(result.mileage).toBe(20000);
      expect(prismaService.vehicle.update).toHaveBeenCalled();
    });

    it('deve lançar ConflictException se a nova placa colidir com outro veículo do mesmo usuário', async () => {
      prismaService.vehicle.findFirst
        .mockResolvedValueOnce(mockVehicle)
        .mockResolvedValueOnce({ id: 'outro-veiculo', plate: 'BRA2E19' });

      await expect(
        service.update(userId, vehicleId, {
          plate: 'BRA2E19',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deve excluir o veículo com sucesso', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);
      prismaService.vehicle.delete.mockResolvedValue(mockVehicle);

      const result = await service.remove(userId, vehicleId);

      expect(result.message).toContain('sucesso');
      expect(prismaService.vehicle.delete).toHaveBeenCalledWith({
        where: { id: vehicleId },
      });
    });

    it('deve lançar NotFoundException se tentar excluir veículo inexistente', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, 'id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('imageUrl', () => {
    it('monta a URL autenticada da foto (com versão) quando o veículo tem foto no banco', async () => {
      const updatedAt = new Date('2026-10-14T20:00:00.000Z');
      prismaService.vehicle.findFirst.mockResolvedValue({
        id: 'veh-1',
        userId: 'user-1',
        imageUrl: null,
        image: { vehicleId: 'veh-1', updatedAt },
      });

      const result = await service.findOne('user-1', 'veh-1');

      expect(result.imageUrl).toBe(
        `/vehicles/veh-1/image?v=${updatedAt.getTime()}`,
      );
      expect(result).not.toHaveProperty('image');
    });

    it('mantém o imageUrl guardado (link externo) quando não há foto no banco', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue({
        id: 'veh-2',
        userId: 'user-1',
        imageUrl: 'https://exemplo.test/carro.jpg',
        image: null,
      });

      const result = await service.findOne('user-1', 'veh-2');

      expect(result.imageUrl).toBe('https://exemplo.test/carro.jpg');
    });
  });

  describe('getImage', () => {
    it('devolve a foto do veículo do usuário', async () => {
      const image = {
        vehicleId: 'veh-1',
        mimeType: 'image/jpeg',
        size: 3,
        data: Buffer.from([1, 2, 3]),
      };
      prismaService.vehicle.findFirst.mockResolvedValue({ image });

      await expect(service.getImage('user-1', 'veh-1')).resolves.toEqual(image);
      expect(prismaService.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: 'veh-1', userId: 'user-1' },
        select: { image: true },
      });
    });

    it('responde 404 quando o veículo não é do usuário', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.getImage('user-2', 'veh-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('responde 404 quando o veículo não tem foto', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue({ image: null });

      await expect(service.getImage('user-1', 'veh-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('violação de unicidade (condição de corrida)', () => {
    const p2002 = () =>
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      });

    it('create: traduz P2002 em 409 quando outra requisição criou a mesma placa', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(null);
      prismaService.vehicle.create.mockRejectedValue(p2002());

      await expect(
        service.create(userId, { plate: 'RTX4B21' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('update: traduz P2002 em 409', async () => {
      prismaService.vehicle.findFirst
        .mockResolvedValueOnce(mockVehicle)
        .mockResolvedValueOnce(null);
      prismaService.vehicle.update.mockRejectedValue(p2002());

      await expect(
        service.update(userId, vehicleId, { plate: 'ABC1D23' }),
      ).rejects.toThrow(ConflictException);
    });

    it('não mascara outros erros do banco', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(null);
      prismaService.vehicle.create.mockRejectedValue(
        new Error('conexão perdida'),
      );

      await expect(
        service.create(userId, { plate: 'RTX4B21' } as never),
      ).rejects.toThrow('conexão perdida');
    });
  });
});
