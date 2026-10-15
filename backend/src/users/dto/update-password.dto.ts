import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'Drivo@2026',
    description: 'Senha atual do usuário',
  })
  @IsString({ message: 'A senha atual é obrigatória' })
  @IsNotEmpty({ message: 'Informe a senha atual' })
  currentPassword: string;

  @ApiProperty({
    example: 'NovaSenha@2026',
    minLength: 8,
    description:
      'Nova senha com ao menos 8 caracteres, contendo letras e números',
  })
  @IsString({ message: 'A nova senha deve ser informada' })
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'A nova senha deve conter ao menos uma letra e um número',
  })
  newPassword: string;
}
