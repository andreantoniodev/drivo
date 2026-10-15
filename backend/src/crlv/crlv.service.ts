import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachCrlvDto } from './dto/attach-crlv.dto';
import { CrlvExtractionResponseDto } from './dto/crlv-extraction-response.dto';
import { CrlvStorageService } from './crlv-storage.service';
import { GeminiExtractionService } from './gemini-extraction.service';

@Injectable()
export class CrlvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly extraction: GeminiExtractionService,
    private readonly storage: CrlvStorageService,
  ) {}

  scanDocument(file: Express.Multer.File): Promise<CrlvExtractionResponseDto> {
    return this.extraction.scan(file);
  }

  async attachToVehicle(
    userId: string,
    vehicleId: string,
    file?: Express.Multer.File,
    dto?: AttachCrlvDto,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
      include: { crlv: true },
    });

    if (!vehicle) {
      throw new NotFoundException(
        'Veículo não encontrado ou não pertence a você',
      );
    }

    let fileName = vehicle.crlv?.fileName || null;
    let fileType = vehicle.crlv?.fileType || null;
    let fileSize = vehicle.crlv?.fileSize || null;
    let fileUrl = vehicle.crlv?.fileUrl || null;

    if (file) {
      const previousPath = vehicle.crlv?.fileUrl;
      const stored = this.storage.save(file);
      this.storage.remove(previousPath);

      fileName = stored.fileName;
      fileType = stored.fileType;
      fileSize = stored.fileSize;
      fileUrl = stored.filePath;
    }

    return this.prisma.crlvDocument.upsert({
      where: { vehicleId },
      create: {
        vehicleId,
        fileName,
        fileType,
        fileSize,
        fileUrl,
        numeroCrLV: dto?.numeroCrLV || null,
        codigoSeguranca: dto?.codigoSeguranca || null,
        exercicio: dto?.exercicio || vehicle.yearModel,
        dataEmissao: dto?.dataEmissao ? new Date(dto.dataEmissao) : null,
        nomeProprietario: dto?.nomeProprietario || null,
        cpfCnpjProprietario: dto?.cpfCnpjProprietario || null,
        localRegistro: dto?.localRegistro || null,
      },
      update: {
        fileName,
        fileType,
        fileSize,
        fileUrl,
        ...(dto?.numeroCrLV !== undefined && { numeroCrLV: dto.numeroCrLV }),
        ...(dto?.codigoSeguranca !== undefined && {
          codigoSeguranca: dto.codigoSeguranca,
        }),
        ...(dto?.exercicio !== undefined && { exercicio: dto.exercicio }),
        ...(dto?.dataEmissao !== undefined && {
          dataEmissao: dto.dataEmissao ? new Date(dto.dataEmissao) : null,
        }),
        ...(dto?.nomeProprietario !== undefined && {
          nomeProprietario: dto.nomeProprietario,
        }),
        ...(dto?.cpfCnpjProprietario !== undefined && {
          cpfCnpjProprietario: dto.cpfCnpjProprietario,
        }),
        ...(dto?.localRegistro !== undefined && {
          localRegistro: dto.localRegistro,
        }),
      },
    });
  }

  async findByVehicle(userId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
      include: { crlv: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    if (!vehicle.crlv) {
      throw new NotFoundException(
        'Este veículo não possui documento CRLV anexado',
      );
    }

    return vehicle.crlv;
  }

  async getDownloadStream(userId: string, vehicleId: string) {
    const crlv = await this.findByVehicle(userId, vehicleId);

    if (!this.storage.exists(crlv.fileUrl)) {
      throw new NotFoundException(
        'Arquivo físico do CRLV não encontrado no servidor',
      );
    }

    return {
      filePath: crlv.fileUrl,
      fileName: crlv.fileName || 'CRLV_Documento.pdf',
      fileType: crlv.fileType || 'application/pdf',
    };
  }

  async removeByVehicle(userId: string, vehicleId: string) {
    const crlv = await this.findByVehicle(userId, vehicleId);

    this.storage.remove(crlv.fileUrl);

    return this.prisma.crlvDocument.delete({
      where: { vehicleId },
    });
  }
}
