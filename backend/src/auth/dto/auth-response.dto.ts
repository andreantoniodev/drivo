import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: 'b8162e7d-44fe-4822-8762-88cec4bee316' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Mariana Costa' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'mariana.costa@email.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: '2026-10-13T18:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-10-13T18:00:00.000Z' })
  updatedAt: Date;

  constructor(partial?: Partial<UserResponseDto> & { password?: string }) {
    if (partial) {
      const { password: _password, ...publicData } = partial;
      Object.assign(this, publicData);
    }
  }
}

export class UserProfileResponseDto extends UserResponseDto {
  @Expose()
  @ApiProperty({ example: 5, description: 'Quantidade de veículos na garagem' })
  vehicleCount: number;
}

export class AuthResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  @ApiProperty({
    type: UserResponseDto,
    description: 'Dados do usuário autenticado',
  })
  user: UserResponseDto;

  @Expose()
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token Bearer JWT para autenticação das rotas privadas',
  })
  accessToken: string;

  constructor(partial?: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
