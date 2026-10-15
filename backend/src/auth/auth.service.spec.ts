import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('mockHashedPassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };

  const mockUser = {
    id: 'user-uuid-123',
    name: 'Mariana Costa',
    email: 'mariana.costa@email.com',
    password: '$2b$10$hashedpasswordhere',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt-mock-token-abc'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso e retornar token', async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Mariana Costa',
        email: 'mariana.costa@email.com',
        password: 'Password@123',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('jwt-mock-token-abc');
      expect(result.user.email).toBe('mariana.costa@email.com');
      expect(result.user).not.toHaveProperty('password');
    });

    it('deve repassar ConflictException se o UsersService acusar e-mail duplicado', async () => {
      usersService.create.mockRejectedValue(
        new ConflictException('Este e-mail já está em uso'),
      );

      await expect(
        service.register({
          name: 'Outro Nome',
          email: 'mariana.costa@email.com',
          password: 'Password@123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('deve realizar login com sucesso se e-mail e senha forem válidos', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'mariana.costa@email.com',
        password: 'Password@123',
      });

      expect(result.accessToken).toBe('jwt-mock-token-abc');
      expect(result.user.name).toBe('Mariana Costa');
      expect(result.user).not.toHaveProperty('password');
    });

    it('deve lançar UnauthorizedException se o e-mail não existir', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'inexistente@email.com',
          password: 'Password@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se a senha for incorreta', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'mariana.costa@email.com',
          password: 'SenhaErrada123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('deve retornar mensagem de confirmação de logout', async () => {
      const result = await service.logout();
      expect(result.message).toContain('sucesso');
    });
  });
});
