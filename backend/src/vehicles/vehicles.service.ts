import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';

const VEHICLE_INCLUDE = {
  crlv: true,
  image: { select: { vehicleId: true, updatedAt: true } },
} as const;

const DUPLICATE_PLATE_ON_CREATE =
  'Você já possui um veículo cadastrado com esta placa';
const DUPLICATE_PLATE_ON_UPDATE =
  'Já existe outro veículo cadastrado com esta placa na sua garagem';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  private translateUniqueViolation(error: unknown, message: string): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(message);
    }
    return error;
  }

  private toResponse<
    T extends {
      id: string;
      imageUrl?: string | null;
      image?: { updatedAt: Date } | null;
    },
  >(vehicle: T) {
    const { image, ...rest } = vehicle;
    return {
      ...rest,
      imageUrl: image
        ? `/vehicles/${vehicle.id}/image?v=${image.updatedAt.getTime()}`
        : (vehicle.imageUrl ?? null),
    };
  }

  async create(userId: string, dto: CreateVehicleDto) {
    const existingVehicle = await this.prisma.vehicle.findFirst({
      where: {
        userId,
        plate: dto.plate,
      },
    });

    if (existingVehicle) {
      throw new ConflictException(DUPLICATE_PLATE_ON_CREATE);
    }

    try {
      const created = await this.prisma.vehicle.create({
        data: {
          ...dto,
          userId,
        },
        include: VEHICLE_INCLUDE,
      });

      return this.toResponse(created);
    } catch (error) {
      throw this.translateUniqueViolation(error, DUPLICATE_PLATE_ON_CREATE);
    }
  }

  async findAll(userId: string, query?: VehicleQueryDto) {
    const where: Prisma.VehicleWhereInput = { userId };

    if (query?.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { model: { contains: searchTerm, mode: 'insensitive' } },
        { brand: { contains: searchTerm, mode: 'insensitive' } },
        { plate: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: VEHICLE_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return vehicles.map((vehicle) => this.toResponse(vehicle));
  }

  async findOne(userId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        userId,
      },
      include: VEHICLE_INCLUDE,
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return this.toResponse(vehicle);
  }

  async getImage(userId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, userId },
      select: { image: true },
    });

    if (!vehicle?.image) {
      throw new NotFoundException('Foto do veículo não encontrada');
    }

    return vehicle.image;
  }

  async update(userId: string, id: string, dto: UpdateVehicleDto) {
    await this.findOne(userId, id);

    if (dto.plate) {
      const duplicatePlate = await this.prisma.vehicle.findFirst({
        where: {
          userId,
          plate: dto.plate,
          NOT: { id },
        },
      });

      if (duplicatePlate) {
        throw new ConflictException(DUPLICATE_PLATE_ON_UPDATE);
      }
    }

    try {
      const updated = await this.prisma.vehicle.update({
        where: { id },
        data: dto,
        include: VEHICLE_INCLUDE,
      });

      return this.toResponse(updated);
    } catch (error) {
      throw this.translateUniqueViolation(error, DUPLICATE_PLATE_ON_UPDATE);
    }
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return {
      message: 'Veículo excluído com sucesso',
    };
  }
}
