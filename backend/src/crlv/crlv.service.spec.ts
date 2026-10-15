import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CrlvStorageService } from './crlv-storage.service';
import { CrlvService } from './crlv.service';
import { GeminiExtractionService } from './gemini-extraction.service';

describe('CrlvService', () => {
  let service: CrlvService;
  let prisma: PrismaService;

  const mockPrismaService = {
    vehicle: {
      findFirst: jest.fn(),
    },
    crlvDocument: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockStorage = {
    save: jest.fn(),
    exists: jest.fn(),
    remove: jest.fn(),
  };

  const mockExtraction = { scan: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrlvService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CrlvStorageService, useValue: mockStorage },
        { provide: GeminiExtractionService, useValue: mockExtraction },
      ],
    }).compile();

    service = module.get(CrlvService);
    prisma = module.get(PrismaService);
  });

  describe('scanDocument', () => {
    it('delega a leitura do documento ao serviço de extração', async () => {
      const file = { originalname: 'crlv.pdf' } as Express.Multer.File;
      const response = { isMock: false };
      mockExtraction.scan.mockResolvedValue(response);

      await expect(service.scanDocument(file)).resolves.toBe(response);
      expect(mockExtraction.scan).toHaveBeenCalledWith(file);
    });
  });

  describe('attachToVehicle', () => {
    it('deve lançar NotFoundException se o veículo não pertencer ao usuário', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.attachToVehicle('user-1', 'vehicle-99', undefined, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve salvar e vincular metadados do documento ao veículo com sucesso', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        userId: 'user-1',
        yearModel: 2023,
        crlv: null,
      };

      const mockCreatedCrlv = {
        id: 'crlv-1',
        vehicleId: 'vehicle-1',
        numeroCrLV: '123456789012',
        exercicio: 2023,
      };

      mockPrismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrismaService.crlvDocument.upsert.mockResolvedValue(mockCreatedCrlv);

      const result = await service.attachToVehicle(
        'user-1',
        'vehicle-1',
        undefined,
        {
          numeroCrLV: '123456789012',
        },
      );

      expect(result).toEqual(mockCreatedCrlv);
      expect(mockPrismaService.crlvDocument.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vehicleId: 'vehicle-1' },
        }),
      );
    });

    it('deve salvar arquivo físico em disco quando arquivo for fornecido', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        userId: 'user-1',
        yearModel: 2023,
        crlv: null,
      };

      const file = {
        buffer: Buffer.from('%PDF-1.4 teste'),
        mimetype: 'application/pdf',
        originalname: 'meu_crlv.pdf',
        size: 1024,
      } as Express.Multer.File;

      mockPrismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockStorage.save.mockReturnValue({
        fileName: 'meu_crlv.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        filePath: '/uploads/crlv/novo.pdf',
      });
      mockPrismaService.crlvDocument.upsert.mockImplementation((args) => ({
        id: 'crlv-1',
        ...args.create,
      }));

      const result = await service.attachToVehicle('user-1', 'vehicle-1', file);

      expect(mockStorage.save).toHaveBeenCalledWith(file);
      expect(result).toMatchObject({
        fileName: 'meu_crlv.pdf',
        fileSize: 1024,
        fileUrl: '/uploads/crlv/novo.pdf',
      });
      expect(mockStorage.remove).toHaveBeenCalledWith(undefined);
    });

    it('remove o arquivo anterior ao substituir o CRLV do veículo', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        userId: 'user-1',
        yearModel: 2023,
        crlv: { fileUrl: '/uploads/crlv/antigo.pdf' },
      });
      mockStorage.save.mockReturnValue({
        fileName: 'novo.pdf',
        fileType: 'application/pdf',
        fileSize: 10,
        filePath: '/uploads/crlv/novo.pdf',
      });
      mockPrismaService.crlvDocument.upsert.mockResolvedValue({ id: 'crlv-1' });

      await service.attachToVehicle('user-1', 'vehicle-1', {
        originalname: 'novo.pdf',
      } as Express.Multer.File);

      expect(mockStorage.remove).toHaveBeenCalledWith(
        '/uploads/crlv/antigo.pdf',
      );
    });
  });

  describe('findByVehicle', () => {
    it('deve lançar NotFoundException se o veículo não pertencer ao usuário', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.findByVehicle('user-1', 'vehicle-99'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se o veículo não possuir CRLV', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        userId: 'user-1',
        crlv: null,
      });

      await expect(
        service.findByVehicle('user-1', 'vehicle-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve retornar os dados do CRLV se existir', async () => {
      const mockCrlv = {
        id: 'crlv-1',
        vehicleId: 'vehicle-1',
        numeroCrLV: '123456789012',
      };

      mockPrismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        userId: 'user-1',
        crlv: mockCrlv,
      });

      const result = await service.findByVehicle('user-1', 'vehicle-1');

      expect(result).toEqual(mockCrlv);
    });
  });

  describe('getDownloadStream', () => {
    const crlv = {
      id: 'crlv-1',
      vehicleId: 'vehicle-1',
      fileUrl: '/uploads/crlv/a.pdf',
      fileName: 'CRLV.pdf',
      fileType: 'application/pdf',
    };

    it('devolve o caminho e os metadados quando o arquivo existe', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        crlv,
      });
      mockStorage.exists.mockReturnValue(true);

      await expect(
        service.getDownloadStream('user-1', 'vehicle-1'),
      ).resolves.toEqual({
        filePath: '/uploads/crlv/a.pdf',
        fileName: 'CRLV.pdf',
        fileType: 'application/pdf',
      });
    });

    it('usa nome e tipo padrão quando o documento não os guardou', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        crlv: { ...crlv, fileName: null, fileType: null },
      });
      mockStorage.exists.mockReturnValue(true);

      const result = await service.getDownloadStream('user-1', 'vehicle-1');

      expect(result.fileName).toBe('CRLV_Documento.pdf');
      expect(result.fileType).toBe('application/pdf');
    });

    it('responde 404 quando o arquivo físico não está mais no servidor', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        crlv,
      });
      mockStorage.exists.mockReturnValue(false);

      await expect(
        service.getDownloadStream('user-1', 'vehicle-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeByVehicle', () => {
    it('deve excluir o documento e o registro do banco', async () => {
      const mockCrlv = {
        id: 'crlv-1',
        vehicleId: 'vehicle-1',
        fileUrl: '/tmp/test.pdf',
      };

      mockPrismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        userId: 'user-1',
        crlv: mockCrlv,
      });

      mockPrismaService.crlvDocument.delete.mockResolvedValue(mockCrlv);

      const result = await service.removeByVehicle('user-1', 'vehicle-1');

      expect(result).toEqual(mockCrlv);
      expect(mockStorage.remove).toHaveBeenCalledWith('/tmp/test.pdf');
      expect(mockPrismaService.crlvDocument.delete).toHaveBeenCalledWith({
        where: { vehicleId: 'vehicle-1' },
      });
    });
  });
});
