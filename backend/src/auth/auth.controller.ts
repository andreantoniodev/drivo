import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { SerializeAs } from '../common/decorators/serialize-as.decorator';
import { MessageResponseDto } from '../common/dto/message-response.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ long: { limit: 10, ttl: 60000 } })
  @Post('register')
  @SerializeAs(AuthResponseDto)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar novo usuário',
    description:
      'Cria uma conta de usuário na plataforma e retorna o token de acesso inicial.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário cadastrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({
    description: 'E-mail já cadastrado no sistema',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ long: { limit: 10, ttl: 60000 } })
  @Post('login')
  @SerializeAs(AuthResponseDto)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Realizar login',
    description:
      'Autentica um usuário existente com e-mail e senha, retornando o token Bearer JWT.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas (e-mail ou senha incorretos)',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('logout')
  @SerializeAs(MessageResponseDto)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Encerrar sessão (Logout)',
    description:
      'Invalida a sessão no cliente e retorna confirmação de encerramento.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sessão finalizada com sucesso',
  })
  async logout(): Promise<{ message: string }> {
    return this.authService.logout();
  }
}
