import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'mariana.costa@email.com',
    description: 'E-mail cadastrado',
  })
  @Transform(({ value }: { value?: string }) => value?.trim().toLowerCase())
  @IsEmail({}, { message: 'Forneça um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'Drivo@2026',
    description: 'Senha de acesso',
  })
  @IsString({ message: 'A senha deve ser informada' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;
}
