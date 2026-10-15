import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  UserProfileResponseDto,
  UserResponseDto,
} from '../auth/dto/auth-response.dto';
import { SerializeAs } from '../common/decorators/serialize-as.decorator';
import { MessageResponseDto } from '../common/dto/message-response.dto';

@ApiTags('Usuários & Perfil')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @SerializeAs(UserProfileResponseDto)
  @ApiOperation({
    summary: 'Obter perfil do usuário autenticado',
    description:
      'Retorna os dados cadastrais e a quantidade de veículos na garagem.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil retornado com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido',
  })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @SerializeAs(UserResponseDto)
  @ApiOperation({
    summary: 'Atualizar dados cadastrais',
    description:
      'Permite alterar o nome completo e o e-mail do usuário logado.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados cadastrais atualizados com sucesso',
  })
  @ApiConflictResponse({
    description: 'E-mail informado já pertence a outra conta',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  @SerializeAs(MessageResponseDto)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alterar senha de acesso',
    description: 'Valida a senha atual e grava a nova senha criptografada.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha alterada com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Senha atual informada incorreta',
  })
  async updatePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(userId, dto);
  }
}
