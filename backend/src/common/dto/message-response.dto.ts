import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MessageResponseDto {
  @Expose()
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;
}
