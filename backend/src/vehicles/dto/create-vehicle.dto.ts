import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({
    example: 'TOYOTA',
    description: 'Marca ou montadora do veículo',
  })
  @Transform(({ value }: { value?: string }) => value?.trim().toUpperCase())
  @IsString({ message: 'A marca deve ser um texto válido' })
  @IsNotEmpty({ message: 'A marca é obrigatória' })
  brand: string;

  @ApiProperty({
    example: 'Corolla Altis Hybrid',
    description: 'Modelo ou versão do veículo',
  })
  @Transform(({ value }: { value?: string }) => value?.trim())
  @IsString({ message: 'O modelo deve ser um texto válido' })
  @IsNotEmpty({ message: 'O modelo é obrigatório' })
  model: string;

  @ApiProperty({
    example: 'RTX4B21',
    description:
      'Placa no padrão Mercosul (ex: RTX4B21) ou cinza tradicional (ex: RTX4121)',
  })
  @Transform(({ value }: { value?: string }) =>
    value
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ''),
  )
  @IsString()
  @IsNotEmpty({ message: 'A placa é obrigatória' })
  @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, {
    message:
      'Placa inválida. Forneça uma placa no padrão Mercosul (ex: RTX4B21) ou tradicional (ex: RTX4121)',
  })
  plate: string;

  @ApiProperty({ example: 2022, description: 'Ano de fabricação' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  @IsInt({ message: 'Ano de fabricação deve ser um número inteiro' })
  @Min(1900, { message: 'Ano de fabricação deve ser maior que 1900' })
  @Max(new Date().getFullYear() + 1, {
    message: 'Ano de fabricação não pode ser maior que o próximo ano',
  })
  yearFabrication: number;

  @ApiProperty({ example: 2023, description: 'Ano do modelo' })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  @IsInt({ message: 'Ano do modelo deve ser um número inteiro' })
  @Min(1900, { message: 'Ano do modelo deve ser maior que 1900' })
  @Max(new Date().getFullYear() + 2, {
    message: 'Ano do modelo não pode ser superior a dois anos à frente',
  })
  yearModel: number;

  @ApiPropertyOptional({ example: 'Prata', description: 'Cor predominante' })
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    example: 'Híbrido',
    description:
      'Tipo de combustível (ex: Gasolina, Flex, Híbrido, Diesel, Elétrico)',
  })
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({
    example: 'Passageiro',
    description: 'Categoria do veículo',
  })
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 18000, description: 'Quilometragem atual' })
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null
      ? typeof value === 'string'
        ? parseInt(value, 10)
        : value
      : undefined,
  )
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @Min(0, { message: 'Quilometragem não pode ser negativa' })
  mileage?: number;

  @ApiPropertyOptional({
    example: 'Carro da família',
    description: 'Apelido opcional do veículo',
  })
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    example: '01234567890',
    description: 'Código RENAVAM',
  })
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  @IsString()
  renavam?: string;

  @ApiPropertyOptional({
    example: '9BRBL3HE8P0124821',
    description: 'Número do chassi',
  })
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim().toUpperCase())
  @IsString()
  chassi?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb',
    description: 'URL da foto do veículo',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
