import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CrlvResponseDto } from '../../crlv/dto/crlv-response.dto';

export class VehicleResponseDto {
  @Expose()
  @ApiProperty({ example: 'vehicle-uuid-123' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'user-uuid-123' })
  userId: string;

  @Expose()
  @ApiProperty({ example: 'TOYOTA' })
  brand: string;

  @Expose()
  @ApiProperty({ example: 'Corolla Altis Hybrid' })
  model: string;

  @Expose()
  @ApiProperty({ example: 'RTX4B21' })
  plate: string;

  @Expose()
  @ApiProperty({ example: 2022 })
  yearFabrication: number;

  @Expose()
  @ApiProperty({ example: 2023 })
  yearModel: number;

  @Expose()
  @ApiPropertyOptional({ example: 'Prata' })
  color?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Híbrido' })
  fuelType?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Passageiro' })
  category?: string;

  @Expose()
  @ApiPropertyOptional({ example: 18000 })
  mileage?: number;

  @Expose()
  @ApiPropertyOptional({ example: 'Carro da família' })
  nickname?: string;

  @Expose()
  @ApiPropertyOptional({ example: '01234567890' })
  renavam?: string;

  @Expose()
  @ApiPropertyOptional({ example: '9BRBL3HE8P0124821' })
  chassi?: string;

  @Expose()
  @ApiPropertyOptional({
    example: '/vehicles/vehicle-uuid-123/image?v=1760400000000',
    description:
      'Caminho da foto na API (requer Bearer). Para exibir, busque com o token e use como blob.',
  })
  imageUrl?: string | null;

  @Expose()
  @Type(() => CrlvResponseDto)
  @ApiPropertyOptional({ type: CrlvResponseDto, nullable: true })
  crlv?: CrlvResponseDto | null;

  @Expose()
  @ApiProperty({ example: '2026-10-13T18:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-10-13T18:00:00.000Z' })
  updatedAt: Date;
}
