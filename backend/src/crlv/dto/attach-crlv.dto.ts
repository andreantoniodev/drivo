import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class AttachCrlvDto {
  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Número do CRLV digital',
  })
  @IsOptional()
  @IsString()
  numeroCrLV?: string;

  @ApiPropertyOptional({
    example: '987654321',
    description: 'Código de segurança do CLA',
  })
  @IsOptional()
  @IsString()
  codigoSeguranca?: string;

  @ApiPropertyOptional({ example: 2023, description: 'Ano do exercício' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  exercicio?: number;

  @ApiPropertyOptional({
    example: '2023-05-10',
    description: 'Data de emissão',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'A data de emissão deve estar no formato AAAA-MM-DD' },
  )
  dataEmissao?: string;

  @ApiPropertyOptional({
    example: 'Mariana Costa',
    description: 'Nome do proprietário',
  })
  @IsOptional()
  @IsString()
  nomeProprietario?: string;

  @ApiPropertyOptional({
    example: '123.456.789-00',
    description: 'CPF ou CNPJ',
  })
  @IsOptional()
  @IsString()
  cpfCnpjProprietario?: string;

  @ApiPropertyOptional({
    example: 'São Paulo / SP',
    description: 'Município / UF',
  })
  @IsOptional()
  @IsString()
  localRegistro?: string;
}
