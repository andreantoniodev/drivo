import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponseDto } from '../auth/dto/auth-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; email: string; password: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existingUser = await this.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException(
        'Este e-mail já está em uso por outro usuário',
      );
    }

    return this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        password: data.password,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      ...new UserResponseDto(user),
      vehicleCount: user._count.vehicles,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const dataToUpdate: { name?: string; email?: string } = {};

    if (dto.name) {
      dataToUpdate.name = dto.name.trim();
    }

    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();

      const emailInUse = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id: userId },
        },
      });

      if (emailInUse) {
        throw new ConflictException(
          'Este e-mail já está sendo utilizado por outro usuário',
        );
      }

      dataToUpdate.email = normalizedEmail;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return new UserResponseDto(updatedUser);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentValid) {
      throw new UnauthorizedException('A senha atual informada está incorreta');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return {
      message: 'Senha alterada com sucesso',
    };
  }
}
