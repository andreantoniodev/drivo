import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GeminiExtractionService } from './gemini-extraction.service';

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn((_config?: { model?: string }) => ({
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
  ...jest.requireActual('@google/generative-ai'),
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

const settings: Record<string, string | undefined> = {};
const mockConfig = { get: (key: string) => settings[key] };

describe('GeminiExtractionService', () => {
  let service: GeminiExtractionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.keys(settings).forEach((key) => delete settings[key]);
    Object.assign(settings, {
      GEMINI_MODEL: 'gemini-3.8-flash',
      GEMINI_FALLBACK_MODELS: '',
      GEMINI_MOCK: 'false',
    });
    (GeminiExtractionService as any).RETRY_DELAYS_MS = [0];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiExtractionService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(GeminiExtractionService);
  });

  describe('scan', () => {
    it('deve lançar BadRequestException se nenhum arquivo for fornecido', async () => {
      await expect(service.scan(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException se o formato do arquivo não for permitido', async () => {
      const invalidFile = {
        buffer: Buffer.from('conteúdo falso'),
        mimetype: 'text/plain',
        originalname: 'teste.txt',
        size: 100,
      } as Express.Multer.File;

      await expect(service.scan(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    const validFile = {
      buffer: Buffer.from('%PDF-1.4 teste'),
      mimetype: 'application/pdf',
      originalname: 'CRLV_Documento.pdf',
      size: 5000,
    } as Express.Multer.File;

    it('deve responder 503 quando GEMINI_API_KEY não estiver configurada', async () => {
      await expect(service.scan(validFile)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('deve devolver extração simulada apenas quando GEMINI_MOCK=true, sinalizando isMock', async () => {
      settings.GEMINI_MOCK = 'true';

      const result = await service.scan(validFile);

      expect(result.isMock).toBe(true);
      expect(result.vehicle.plate).toBe('RTX4B21');
      expect(result.fileName).toBe('CRLV_Documento.pdf');
    });

    it('deve responder 502 (sem dados simulados) quando a chamada ao Gemini falhar', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent.mockRejectedValue(new Error('400 chave inválida'));

      await expect(service.scan(validFile)).rejects.toThrow(
        BadGatewayException,
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('deve repetir a chamada quando o Gemini está sobrecarregado (503) e devolver o resultado', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent
        .mockRejectedValueOnce(
          Object.assign(new Error('[503 Service Unavailable] high demand'), {
            status: 503,
          }),
        )
        .mockResolvedValueOnce({
          response: {
            text: () =>
              JSON.stringify({
                brand: 'HONDA',
                model: 'HR-V',
                plate: 'QPL8C34',
              }),
          },
        });

      const result = await service.scan(validFile);

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(result.vehicle.brand).toBe('HONDA');
      expect(result.isMock).toBe(false);
    });

    it('deve desistir com 502 depois de esgotar as rodadas em erro 429/503', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent.mockRejectedValue(
        new Error('[429 Too Many Requests] quota'),
      );

      await expect(service.scan(validFile)).rejects.toThrow(
        BadGatewayException,
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('deve usar o modelo de reserva quando o principal está sobrecarregado', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      settings.GEMINI_MODEL = 'modelo-principal';
      settings.GEMINI_FALLBACK_MODELS = 'modelo-reserva-1, modelo-reserva-2';
      mockGenerateContent
        .mockRejectedValueOnce(
          new Error('[503 Service Unavailable] high demand'),
        )
        .mockResolvedValueOnce({
          response: {
            text: () =>
              JSON.stringify({
                brand: 'FIAT',
                model: 'Toro',
                plate: 'GBN7A55',
              }),
          },
        });

      const result = await service.scan(validFile);

      const modelsTried = mockGetGenerativeModel.mock.calls.map(
        ([config]) => config?.model,
      );
      expect(modelsTried).toEqual(['modelo-principal', 'modelo-reserva-1']);
      expect(result.vehicle.brand).toBe('FIAT');
    });

    it('trata timeout como transitório e passa para o modelo de reserva', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      settings.GEMINI_MODEL = 'modelo-principal';
      settings.GEMINI_FALLBACK_MODELS = 'modelo-reserva-1';
      mockGenerateContent
        .mockRejectedValueOnce(
          new Error('Timeout de 20s na API do Gemini excedido'),
        )
        .mockResolvedValueOnce({
          response: {
            text: () =>
              JSON.stringify({
                brand: 'YAMAHA',
                model: 'MT-03',
                plate: 'MXR1J78',
              }),
          },
        });

      const result = await service.scan(validFile);

      expect(result.vehicle.brand).toBe('YAMAHA');
      expect(mockGetGenerativeModel).toHaveBeenCalledTimes(2);
    });

    it('não usa modelo de reserva em erro permanente (ex.: chave inválida)', async () => {
      settings.GEMINI_API_KEY = 'chave-invalida';
      settings.GEMINI_FALLBACK_MODELS = 'modelo-reserva-1';
      mockGenerateContent.mockRejectedValue(
        new Error('[400 Bad Request] API key not valid'),
      );

      await expect(service.scan(validFile)).rejects.toThrow(
        BadGatewayException,
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('deve devolver os dados extraídos pelo Gemini, sem inventar campos ausentes', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              brand: 'I/TOYOTA',
              model: 'Corolla',
              plate: 'rtx-4b21',
            }),
        },
      });

      const result = await service.scan(validFile);

      expect(result.isMock).toBe(false);
      expect(result.vehicle.brand).toBe('TOYOTA');
      expect(result.vehicle.plate).toBe('RTX4B21');
      expect(result.vehicle.yearFabrication).toBeNull();
      expect(result.vehicle.category).toBeNull();
      expect(result.document.exercicio).toBeNull();
    });

    it('deve configurar o Gemini de forma determinística e com campos anuláveis', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({ brand: 'HONDA', model: 'HR-V', plate: 'QPL8C34' }),
        },
      });

      await service.scan(validFile);

      const [{ generationConfig }] = mockGetGenerativeModel.mock
        .calls[0] as any;
      expect(generationConfig.temperature).toBe(0);
      expect(generationConfig.responseMimeType).toBe('application/json');

      const { properties, required } = generationConfig.responseSchema;
      expect(required).toEqual(expect.arrayContaining(Object.keys(properties)));
      Object.values(properties).forEach((property: any) => {
        expect(property.nullable).toBe(true);
      });
    });

    it('deve descartar placa fora do padrão em vez de preencher com leitura errada', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({ brand: 'FIAT', model: 'Toro', plate: 'AB-12' }),
        },
      });

      const result = await service.scan(validFile);

      expect(result.vehicle.plate).toBe('');
      expect(result.vehicle.model).toBe('Toro');
    });

    it('deve aceitar placa Mercosul e placa antiga com pontuação', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({ model: 'Polo', plate: 'fhd-2e09' }),
        },
      });
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({ model: 'Gol', plate: 'ABC-1234' }),
        },
      });

      const mercosul = await service.scan(validFile);
      const antiga = await service.scan(validFile);

      expect(mercosul.vehicle.plate).toBe('FHD2E09');
      expect(antiga.vehicle.plate).toBe('ABC1234');
    });

    it('deve descartar dataEmissao que não seja uma data AAAA-MM-DD válida', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      const extract = (dataEmissao: unknown) =>
        mockGenerateContent.mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({ model: 'Polo', dataEmissao }),
          },
        });

      extract('2023-05-10');
      extract('10/05/2023');
      extract('2023-02-31');
      extract(20230510);

      const valida = await service.scan(validFile);
      const formatoBr = await service.scan(validFile);
      const diaInexistente = await service.scan(validFile);
      const numero = await service.scan(validFile);

      expect(valida.document.dataEmissao).toBe('2023-05-10');
      expect(formatoBr.document.dataEmissao).toBeNull();
      expect(diaInexistente.document.dataEmissao).toBeNull();
      expect(numero.document.dataEmissao).toBeNull();
    });

    it('deve responder 422 quando o Gemini não identificar nenhum dado do veículo', async () => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent.mockResolvedValue({ response: { text: () => '{}' } });

      await expect(service.scan(validFile)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('normalização de marca', () => {
    const scanBrand = async (brand: string | null, model = 'Modelo X') => {
      settings.GEMINI_API_KEY = 'chave-valida';
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({ brand, model, plate: 'ABC1D23' }),
        },
      });
      const file = {
        buffer: Buffer.from('%PDF'),
        mimetype: 'application/pdf',
        originalname: 'crlv.pdf',
        size: 4,
      } as Express.Multer.File;

      return (await service.scan(file)).vehicle;
    };

    it.each([
      ['I/TOYOTA', 'TOYOTA'],
      ['HONDA MOTOS', 'HONDA'],
      ['VW', 'VOLKSWAGEN'],
      ['VOLKSWAGEN DO BRASIL', 'VOLKSWAGEN'],
      ['FIAT/FCA', 'FIAT'],
      ['YAMAHA MOTOR', 'YAMAHA'],
    ])('normaliza a marca "%s" para "%s"', async (raw, expected) => {
      expect((await scanBrand(raw)).brand).toBe(expected);
    });

    it('mantém marcas desconhecidas como vieram (sem inventar)', async () => {
      expect((await scanBrand('RENAULT')).brand).toBe('RENAULT');
    });

    it('separa marca e modelo quando só o modelo veio no formato MARCA/MODELO', async () => {
      const vehicle = await scanBrand(null, 'HYUNDAI/HB20 1.0');

      expect(vehicle.brand).toBe('HYUNDAI');
      expect(vehicle.model).toBe('HB20 1.0');
    });
  });

  describe('timeout por tentativa', () => {
    it('trata uma chamada que trava como erro transitório e usa o modelo de reserva', async () => {
      jest.useFakeTimers();
      try {
        settings.GEMINI_API_KEY = 'chave-valida';
        settings.GEMINI_MODEL = 'modelo-principal';
        settings.GEMINI_FALLBACK_MODELS = 'modelo-reserva';
        mockGenerateContent
          .mockReturnValueOnce(new Promise(() => undefined))
          .mockResolvedValueOnce({
            response: {
              text: () =>
                JSON.stringify({
                  brand: 'FIAT',
                  model: 'Toro',
                  plate: 'GBN7A55',
                }),
            },
          });
        const file = {
          buffer: Buffer.from('%PDF'),
          mimetype: 'application/pdf',
          originalname: 'crlv.pdf',
          size: 4,
        } as Express.Multer.File;

        const pending = service.scan(file);
        await jest.advanceTimersByTimeAsync(20_000);
        const result = await pending;

        expect(result.vehicle.brand).toBe('FIAT');
        expect(
          mockGetGenerativeModel.mock.calls.map(([config]) => config?.model),
        ).toEqual(['modelo-principal', 'modelo-reserva']);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
