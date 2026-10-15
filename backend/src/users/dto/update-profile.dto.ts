import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Mariana Silva Costa',
    description: 'Novo nome do usuário',
  })
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    example: 'mariana.costa@email.com',
    description: 'Novo e-mail do usuário',
  })
  @IsOptional()
  @Transform(({ value }: { value?: string }) => value?.trim().toLowerCase())
  @IsEmail({}, { message: 'Forneça um e-mail válido' })
  email?: string;
}
