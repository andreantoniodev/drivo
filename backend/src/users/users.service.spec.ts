import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('newHashedPassword'),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-uuid-123',
    name: 'Mariana Costa',
    email: 'mariana.costa@email.com',
    password: '$2b$10$oldHashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      vehicles: 5,
    },
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('deve retornar dados do perfil e contagem de veículos', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-uuid-123');

      expect(result.id).toBe('user-uuid-123');
      expect(result.name).toBe('Mariana Costa');
      expect(result.vehicleCount).toBe(5);
      expect((result as any).password).toBeUndefined();
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar nome e e-mail com sucesso', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Mariana Silva Costa',
        email: 'mariana.silva@email.com',
      });

      const result = await service.updateProfile('user-uuid-123', {
        name: 'Mariana Silva Costa',
        email: 'mariana.silva@email.com',
      });

      expect(result.name).toBe('Mariana Silva Costa');
      expect(result.email).toBe('mariana.silva@email.com');
    });

    it('deve lançar ConflictException se o novo e-mail já estiver em uso por outro usuário', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'outro-user-id',
        email: 'outro@email.com',
      });

      await expect(
        service.updateProfile('user-uuid-123', {
          email: 'outro@email.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar a senha se a senha atual estiver correta', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.updatePassword('user-uuid-123', {
        currentPassword: 'SenhaAtual123',
        newPassword: 'NovaSenha@2026',
      });

      expect(result.message).toContain('sucesso');
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se o usuário não existir', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePassword('user-inexistente', {
          currentPassword: 'SenhaAtual123',
          newPassword: 'NovaSenha@2026',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException se a senha atual estiver incorreta', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.updatePassword('user-uuid-123', {
          currentPassword: 'SenhaIncorreta',
          newPassword: 'NovaSenha@2026',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
