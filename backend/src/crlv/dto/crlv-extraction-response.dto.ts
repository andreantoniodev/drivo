import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CrlvVehicleDataDto {
  @Expose()
  @ApiProperty({
    example: 'TOYOTA',
    description: 'Marca do veículo (vazio se não identificada)',
  })
  brand: string;

  @Expose()
  @ApiProperty({
    example: 'Corolla Altis Hybrid',
    description: 'Modelo do veículo',
  })
  model: string;

  @Expose()
  @ApiProperty({
    example: 'RTX4B21',
    description: 'Placa no padrão Mercosul ou tradicional',
  })
  plate: string;

  @Expose()
  @ApiPropertyOptional({
    example: '01234567890',
    description: 'Código RENAVAM',
  })
  renavam?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: '9BRBL3HE8P0124821',
    description: 'Número do chassi',
  })
  chassi?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: 2022,
    description: 'Ano de fabricação (null se não identificado)',
  })
  yearFabrication: number | null;

  @Expose()
  @ApiPropertyOptional({
    example: 2023,
    description: 'Ano do modelo (null se não identificado)',
  })
  yearModel: number | null;

  @Expose()
  @ApiPropertyOptional({ example: 'Prata', description: 'Cor predominante' })
  color?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: 'Híbrido',
    description: 'Tipo de combustível',
  })
  fuelType?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: 'Automóvel',
    description: 'Categoria do veículo',
  })
  category?: string | null;
}

export class CrlvOfficialDataDto {
  @Expose()
  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Número do CRLV digital',
  })
  numeroCrLV?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: '987654321',
    description: 'Código de segurança do CLA',
  })
  codigoSeguranca?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 2023, description: 'Ano do exercício' })
  exercicio?: number | null;

  @Expose()
  @ApiPropertyOptional({
    example: '2023-05-10',
    description: 'Data de emissão oficial',
  })
  dataEmissao?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: 'Mariana Costa',
    description: 'Nome do proprietário',
  })
  nomeProprietario?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: '123.456.789-00',
    description: 'CPF ou CNPJ do proprietário',
  })
  cpfCnpjProprietario?: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: 'São Paulo / SP',
    description: 'Município e UF de registro',
  })
  localRegistro?: string | null;
}

export class CrlvExtractionResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Dados do veículo prontos para preenchimento de formulário',
  })
  vehicle: CrlvVehicleDataDto;

  @Expose()
  @ApiProperty({
    description: 'Dados oficiais extraídos do documento do Senatran',
  })
  document: CrlvOfficialDataDto;

  @Expose()
  @ApiProperty({
    example: 'CRLV_Toyota_Corolla.pdf',
    description: 'Nome original do arquivo',
  })
  fileName: string;

  @Expose()
  @ApiProperty({
    example: 'application/pdf',
    description: 'Tipo MIME do arquivo',
  })
  fileType: string;

  @Expose()
  @ApiProperty({ example: 245120, description: 'Tamanho em bytes do arquivo' })
  fileSize: number;

  @Expose()
  @ApiProperty({
    example: false,
    description:
      'true apenas quando o servidor roda em modo demonstração (GEMINI_MOCK=true)',
  })
  isMock: boolean;
}
