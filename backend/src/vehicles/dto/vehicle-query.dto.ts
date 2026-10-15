import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class VehicleQueryDto {
  @ApiPropertyOptional({
    example: 'Corolla',
    description:
      'Termo de pesquisa para buscar por modelo, marca ou placa (busca reativa do Figma)',
  })
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim())
  @IsString()
  search?: string;
}
