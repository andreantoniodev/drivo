import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CrlvService } from './crlv.service';
import { AttachCrlvDto } from './dto/attach-crlv.dto';
import { CrlvExtractionResponseDto } from './dto/crlv-extraction-response.dto';
import { SerializeAs } from '../common/decorators/serialize-as.decorator';
import { CrlvResponseDto } from './dto/crlv-response.dto';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

@ApiTags('CRLV & Inteligência Artificial')
@ApiBearerAuth()
@Controller('crlv')
export class CrlvController {
  constructor(private readonly crlvService: CrlvService) {}

  @Throttle({ long: { limit: 10, ttl: 60000 } })
  @Post('scan')
  @SerializeAs(CrlvExtractionResponseDto)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  @ApiOperation({
    summary: 'Escanear CRLV com Google Gemini AI (Stateless em memória)',
    description:
      'Lê um arquivo PDF ou imagem de CRLV, extrai os dados via Google Gemini e devolve o JSON estruturado para autofill do formulário sem gravar arquivo em disco.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF ou imagem (PNG, JPEG, WEBP) de até 10MB',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Dados cadastrais e veiculares extraídos com sucesso',
    type: CrlvExtractionResponseDto,
  })
  @ApiResponse({ status: 413, description: 'Arquivo maior que 10 MB' })
  @ApiResponse({
    status: 422,
    description: 'Documento ilegível: nenhum dado do veículo identificado',
  })
  @ApiResponse({ status: 502, description: 'Falha na chamada à API do Gemini' })
  @ApiResponse({
    status: 503,
    description: 'GEMINI_API_KEY não configurada no servidor',
  })
  async scanDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CrlvExtractionResponseDto> {
    return this.crlvService.scanDocument(file);
  }

  @Post('attach/:vehicleId')
  @SerializeAs(CrlvResponseDto)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  @ApiOperation({
    summary: 'Anexar documento CRLV a um veículo cadastrado',
    description:
      'Grava fisicamente o arquivo do CRLV em disco e vincula os metadados do documento em relacionamento 1:1 com o veículo pertencente ao usuário.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Arquivo do documento (opcional caso queira apenas salvar metadados)',
        },
        numeroCrLV: { type: 'string', example: '123456789012' },
        codigoSeguranca: { type: 'string', example: '987654321' },
        exercicio: { type: 'integer', example: 2023 },
        dataEmissao: { type: 'string', example: '2023-05-10' },
        nomeProprietario: { type: 'string', example: 'Mariana Costa' },
        cpfCnpjProprietario: { type: 'string', example: '123.456.789-00' },
        localRegistro: { type: 'string', example: 'São Paulo / SP' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento CRLV associado com sucesso ao veículo',
  })
  @ApiResponse({ status: 413, description: 'Arquivo maior que 10 MB' })
  async attachToVehicle(
    @CurrentUser('id') userId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body() dto?: AttachCrlvDto,
  ) {
    return this.crlvService.attachToVehicle(userId, vehicleId, file, dto);
  }

  @Get(':vehicleId')
  @SerializeAs(CrlvResponseDto)
  @ApiOperation({
    summary: 'Obter metadados do CRLV vinculado ao veículo',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do documento CRLV associado',
  })
  async findByVehicle(
    @CurrentUser('id') userId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.crlvService.findByVehicle(userId, vehicleId);
  }

  @Get(':vehicleId/download')
  @ApiOperation({
    summary: 'Download seguro e autenticado do arquivo CRLV (Compliance LGPD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo em formato streamable (PDF ou imagem)',
  })
  async download(
    @CurrentUser('id') userId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const fileInfo = await this.crlvService.getDownloadStream(
      userId,
      vehicleId,
    );

    res.set({
      'Content-Type': fileInfo.fileType,
      'Content-Disposition': `attachment; filename="${fileInfo.fileName}"`,
    });

    const fileStream = createReadStream(fileInfo.filePath);
    return new StreamableFile(fileStream);
  }

  @Delete(':vehicleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover documento CRLV de um veículo',
  })
  @ApiResponse({
    status: 204,
    description: 'Documento e arquivo físico removidos com sucesso',
  })
  async removeByVehicle(
    @CurrentUser('id') userId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ): Promise<void> {
    await this.crlvService.removeByVehicle(userId, vehicleId);
  }
}
