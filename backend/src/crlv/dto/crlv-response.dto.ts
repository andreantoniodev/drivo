import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CrlvResponseDto {
  @Expose()
  @ApiProperty({ example: '7c1f1d8e-8f5e-4a6c-9c3b-0f2a2f9a1b11' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'b8162e7d-44fe-4822-8762-88cec4bee316' })
  vehicleId: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'CRLV_Digital_Corolla_2023.pdf',
    nullable: true,
  })
  fileName?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 'application/pdf', nullable: true })
  fileType?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 245800, nullable: true })
  fileSize?: number | null;

  @Expose()
  @ApiPropertyOptional({ example: '01293847561', nullable: true })
  numeroCrLV?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '984712039', nullable: true })
  codigoSeguranca?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 2023, nullable: true })
  exercicio?: number | null;

  @Expose()
  @ApiPropertyOptional({ example: '2023-04-15T10:30:00.000Z', nullable: true })
  dataEmissao?: Date | null;

  @Expose()
  @ApiPropertyOptional({ example: 'Mariana Costa', nullable: true })
  nomeProprietario?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '***.482.918-**', nullable: true })
  cpfCnpjProprietario?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 'São Paulo / SP', nullable: true })
  localRegistro?: string | null;

  @Expose()
  @ApiProperty({ example: '2026-10-13T18:00:00.000Z' })
  scannedAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-10-13T18:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-10-13T18:00:00.000Z' })
  updatedAt: Date;
}
