import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SerializeAs } from '../common/decorators/serialize-as.decorator';
import { MessageResponseDto } from '../common/dto/message-response.dto';

@ApiTags('Veículos')
@ApiBearerAuth('JWT-auth')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @SerializeAs(VehicleResponseDto)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar novo veículo',
    description: 'Adiciona um veículo à garagem do usuário autenticado.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Veículo cadastrado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiConflictResponse({
    description:
      'Já existe um veículo cadastrado com essa placa na garagem do usuário',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação ausente ou inválido',
  })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(userId, dto);
  }

  @Get()
  @SerializeAs(VehicleResponseDto)
  @ApiOperation({
    summary: 'Listar veículos da garagem',
    description:
      'Retorna todos os veículos pertencentes ao usuário logado com suporte a busca reativa por placa, modelo ou marca.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de veículos retornada com sucesso',
    type: [VehicleResponseDto],
  })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: VehicleQueryDto,
  ) {
    return this.vehiclesService.findAll(userId, query);
  }

  @Get(':id/image')
  @ApiOperation({
    summary: 'Foto do veículo',
    description:
      'Devolve os bytes da foto guardada no banco. Exige o token Bearer (o frontend busca como blob).',
  })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiResponse({ status: HttpStatus.OK, description: 'Imagem do veículo' })
  @ApiNotFoundResponse({
    description:
      'Veículo não encontrado, não pertence ao usuário ou não possui foto',
  })
  async image(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const image = await this.vehiclesService.getImage(userId, id);

    res.set({
      'Content-Type': image.mimeType,
      'Content-Length': String(image.size),
      'Cache-Control': 'private, max-age=86400',
    });

    return new StreamableFile(Buffer.from(image.data));
  }

  @Get(':id')
  @SerializeAs(VehicleResponseDto)
  @ApiOperation({
    summary: 'Obter detalhes de um veículo',
    description:
      'Retorna as informações completas do veículo e seu documento CRLV associado.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo localizado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado ou não pertence ao usuário',
  })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.findOne(userId, id);
  }

  @Patch(':id')
  @SerializeAs(VehicleResponseDto)
  @ApiOperation({
    summary: 'Atualizar dados de um veículo',
    description: 'Atualiza especificações de um veículo cadastrado na garagem.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo atualizado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado ou não pertence ao usuário',
  })
  @ApiConflictResponse({
    description:
      'A nova placa informada já pertence a outro veículo cadastrado',
  })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(userId, id, dto);
  }

  @Delete(':id')
  @SerializeAs(MessageResponseDto)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Excluir veículo',
    description:
      'Remove o veículo da garagem e seus documentos CRLV associados.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo excluído com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Veículo não encontrado ou não pertence ao usuário',
  })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.remove(userId, id);
  }
}
