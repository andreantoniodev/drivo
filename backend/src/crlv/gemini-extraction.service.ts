import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  type ObjectSchema,
  type SimpleStringSchema,
  type IntegerSchema,
  SchemaType,
} from '@google/generative-ai';
import { EnvironmentVariables } from '../config/env.validation';
import {
  CrlvExtractionResponseDto,
  CrlvOfficialDataDto,
  CrlvVehicleDataDto,
} from './dto/crlv-extraction-response.dto';

const nullableString = (description: string): SimpleStringSchema => ({
  type: SchemaType.STRING,
  description,
  nullable: true,
});

const nullableInteger = (description: string): IntegerSchema => ({
  type: SchemaType.INTEGER,
  description,
  nullable: true,
});

const CRLV_RESPONSE_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    brand: nullableString('Marca limpa do veículo (ex: TOYOTA)'),
    model: nullableString('Modelo do veículo (ex: Corolla Altis Hybrid)'),
    plate: nullableString('Placa sem pontuação ou hífens (ex: RTX4B21)'),
    renavam: nullableString('Número do RENAVAM'),
    chassi: nullableString('Número do Chassi'),
    yearFabrication: nullableInteger('Ano de fabricação'),
    yearModel: nullableInteger('Ano do modelo'),
    color: nullableString('Cor predominante'),
    fuelType: nullableString('Tipo de combustível (ex: Híbrido, Flex)'),
    category: nullableString('Categoria (ex: Automóvel)'),
    numeroCrLV: nullableString('Número do documento CRLV'),
    codigoSeguranca: nullableString('Código de segurança do CLA'),
    exercicio: nullableInteger('Ano do exercício de licenciamento'),
    dataEmissao: nullableString('Data de emissão (AAAA-MM-DD)'),
    nomeProprietario: nullableString('Nome completo do proprietário'),
    cpfCnpjProprietario: nullableString('CPF ou CNPJ do proprietário'),
    localRegistro: nullableString('Município e UF'),
  },
  required: [
    'brand',
    'model',
    'plate',
    'renavam',
    'chassi',
    'yearFabrication',
    'yearModel',
    'color',
    'fuelType',
    'category',
    'numeroCrLV',
    'codigoSeguranca',
    'exercicio',
    'dataEmissao',
    'nomeProprietario',
    'cpfCnpjProprietario',
    'localRegistro',
  ],
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class GeminiExtractionService {
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  private static readonly ATTEMPT_TIMEOUT_MS = 20000;
  private static readonly TOTAL_BUDGET_MS = 45000;

  private static RETRY_DELAYS_MS = [2000];

  private readonly logger = new Logger(GeminiExtractionService.name);

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async scan(file: Express.Multer.File): Promise<CrlvExtractionResponseDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Nenhum arquivo enviado para análise');
    }

    if (!GeminiExtractionService.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato inválido. Envie um arquivo PDF ou imagem (PNG, JPEG, WEBP)',
      );
    }

    if (this.config.get('GEMINI_MOCK', { infer: true }) === 'true') {
      this.logger.warn(
        'GEMINI_MOCK=true: devolvendo extração simulada (modo demonstração).',
      );
      return this.getMockExtraction(file);
    }

    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true })?.trim();
    if (!apiKey || apiKey === 'sua_chave_gemini_aqui') {
      throw new ServiceUnavailableException(
        'Leitura de CRLV indisponível: a chave GEMINI_API_KEY não está configurada no servidor.',
      );
    }

    let extracted: {
      vehicle: CrlvVehicleDataDto;
      document: CrlvOfficialDataDto;
    };
    try {
      extracted = await this.extractWithFallback(file, apiKey);
    } catch (error: any) {
      this.logger.error(
        `Falha na chamada à API Gemini: ${error?.message || error}`,
      );
      throw new BadGatewayException(
        'Não foi possível ler o documento com o Gemini agora. Tente novamente ou preencha os dados manualmente.',
      );
    }

    const { brand, model, plate } = extracted.vehicle;
    if (!brand && !model && !plate) {
      throw new UnprocessableEntityException(
        'Não foi possível identificar os dados do veículo neste documento. Envie um CRLV legível.',
      );
    }

    return {
      ...extracted,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      isMock: false,
    };
  }

  private async extractWithFallback(file: Express.Multer.File, apiKey: string) {
    const models = this.modelChain();
    const rounds = GeminiExtractionService.RETRY_DELAYS_MS.length + 1;
    const deadline = Date.now() + GeminiExtractionService.TOTAL_BUDGET_MS;
    let lastError: unknown;

    for (let round = 1; round <= rounds; round++) {
      for (const modelName of models) {
        if (lastError && Date.now() > deadline) throw lastError;

        try {
          return await this.extractWithGemini(file, apiKey, modelName);
        } catch (error: unknown) {
          if (!GeminiExtractionService.isTransientGeminiError(error))
            throw error;
          lastError = error;
          this.logger.warn(
            `Gemini (${modelName}) indisponível, rodada ${round}/${rounds}.`,
          );
        }
      }

      if (round < rounds) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            GeminiExtractionService.RETRY_DELAYS_MS[round - 1],
          ),
        );
      }
    }

    throw lastError;
  }

  private modelChain(): string[] {
    const primary = this.config.get('GEMINI_MODEL', { infer: true });
    const fallbacks = this.config
      .get('GEMINI_FALLBACK_MODELS', { infer: true })
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);

    return [...new Set([primary, ...fallbacks])];
  }

  private static isTransientGeminiError(error: unknown): boolean {
    const status = Number((error as { status?: unknown } | null)?.status);
    if (status === 429 || status === 503) return true;
    return /\[(429|503)\b|Timeout de/.test(errorMessage(error));
  }

  private async extractWithGemini(
    file: Express.Multer.File,
    apiKey: string,
    modelName: string,
  ): Promise<{ vehicle: CrlvVehicleDataDto; document: CrlvOfficialDataDto }> {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: CRLV_RESPONSE_SCHEMA,
      },
    });

    const prompt = `Você é um especialista em documentos de veículos do Brasil (CRLV digital emitido pelo Detran/Senatran).
Analise o documento anexo e extraia com precisão os dados cadastrais do veículo e do documento.
Regras fundamentais de extração:
1. No campo 'MARCA / MODELO', separe a MARCA (ex: se estiver 'I/TOYOTA COROLLA ALTIS HY', a marca é 'TOYOTA' e o modelo é 'Corolla Altis Hybrid').
2. Remova prefixos como 'I/', 'VW/', 'GM/' do nome do modelo e da marca.
3. A placa deve ser extraída em letras maiúsculas e sem hífens (ex: 'RTX4B21' ou 'ABC1234').
4. Ano de fabricação e modelo devem ser números inteiros (ex: 2022 e 2023).
5. Data de emissão no formato AAAA-MM-DD.
6. Se um campo não estiver visível ou legível no documento, retorne null. Nunca estime, deduza ou invente valores.
Retorne estritamente o objeto JSON conforme o schema configurado.`;

    const inlineData = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype,
      },
    };

    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Timeout de 20s na API do Gemini excedido')),
        GeminiExtractionService.ATTEMPT_TIMEOUT_MS,
      );
    });

    let result: Awaited<ReturnType<typeof model.generateContent>>;
    try {
      result = await Promise.race([
        model.generateContent([prompt, inlineData]),
        timeoutPromise,
      ]);
    } finally {
      clearTimeout(timer);
    }
    const responseText = result.response.text();
    const rawJson = JSON.parse(responseText);

    return this.sanitizeExtraction(rawJson);
  }

  private sanitizeExtraction(raw: Record<string, any>): {
    vehicle: CrlvVehicleDataDto;
    document: CrlvOfficialDataDto;
  } {
    const normalizedPlate = String(raw.plate ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const plate = PLATE_PATTERN.test(normalizedPlate) ? normalizedPlate : '';

    let brand = (raw.brand || '').trim();
    let model = (raw.model || '').trim();

    if (model.includes('/') && !brand) {
      const parts = model.split('/');
      brand = parts[0].trim();
      model = parts.slice(1).join(' ').trim();
    }

    if (brand.toUpperCase().includes('TOYOTA')) brand = 'TOYOTA';
    if (brand.toUpperCase().includes('HONDA')) brand = 'HONDA';
    if (
      brand.toUpperCase().includes('VOLKSWAGEN') ||
      brand.toUpperCase() === 'VW'
    )
      brand = 'VOLKSWAGEN';
    if (brand.toUpperCase().includes('FIAT')) brand = 'FIAT';
    if (brand.toUpperCase().includes('YAMAHA')) brand = 'YAMAHA';

    const vehicle: CrlvVehicleDataDto = {
      brand,
      model,
      plate,
      renavam: raw.renavam ? String(raw.renavam).replace(/\D/g, '') : null,
      chassi: raw.chassi
        ? String(raw.chassi)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
        : null,
      yearFabrication: Number(raw.yearFabrication) || null,
      yearModel: Number(raw.yearModel) || null,
      color: raw.color || null,
      fuelType: raw.fuelType || null,
      category: raw.category || null,
    };

    const document: CrlvOfficialDataDto = {
      numeroCrLV: raw.numeroCrLV
        ? String(raw.numeroCrLV).replace(/\D/g, '')
        : null,
      codigoSeguranca: raw.codigoSeguranca
        ? String(raw.codigoSeguranca).trim()
        : null,
      exercicio: raw.exercicio ? Number(raw.exercicio) : null,
      dataEmissao: this.normalizeIsoDate(raw.dataEmissao),
      nomeProprietario: raw.nomeProprietario || null,
      cpfCnpjProprietario: raw.cpfCnpjProprietario || null,
      localRegistro: raw.localRegistro || null,
    };

    return { vehicle, document };
  }

  private normalizeIsoDate(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!ISO_DATE_PATTERN.test(trimmed)) return null;

    const parsed = new Date(`${trimmed}T00:00:00Z`);
    const isRealDate =
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === trimmed;

    return isRealDate ? trimmed : null;
  }

  private getMockExtraction(
    file: Express.Multer.File,
  ): CrlvExtractionResponseDto {
    return {
      vehicle: {
        brand: 'TOYOTA',
        model: 'Corolla Altis Hybrid',
        plate: 'RTX4B21',
        renavam: '01234567890',
        chassi: '9BRBL3HE8P0124821',
        yearFabrication: 2022,
        yearModel: 2023,
        color: 'Prata',
        fuelType: 'Híbrido',
        category: 'Automóvel',
      },
      document: {
        numeroCrLV: '123456789012',
        codigoSeguranca: '987654321',
        exercicio: 2023,
        dataEmissao: '2023-05-10',
        nomeProprietario: 'Mariana Costa',
        cpfCnpjProprietario: '123.456.789-00',
        localRegistro: 'São Paulo / SP',
      },
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      isMock: true,
    };
  }
}
