import { classToPlain, plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../../auth/dto/auth-response.dto';
import { CrlvResponseDto } from '../../crlv/dto/crlv-response.dto';
import { VehicleResponseDto } from './vehicle-response.dto';

const serialize = <T>(type: new () => T, plain: object) =>
  classToPlain(plainToInstance(type, plain, { excludeExtraneousValues: true }));

describe('DTOs de resposta (lista branca com @Expose)', () => {
  it('VehicleResponseDto descarta campos fora do contrato, inclusive nos aninhados', () => {
    const result = serialize(VehicleResponseDto, {
      id: 'veh-1',
      userId: 'user-1',
      brand: 'TOYOTA',
      model: 'Corolla',
      plate: 'RTX4B21',
      yearFabrication: 2022,
      yearModel: 2023,
      imageUrl: '/vehicles/veh-1/image?v=1',
      createdAt: new Date('2026-10-14T00:00:00Z'),
      updatedAt: new Date('2026-10-14T00:00:00Z'),
      internalNote: 'não deve sair',
      image: { data: Buffer.from('bytes') },
      crlv: {
        id: 'crlv-1',
        vehicleId: 'veh-1',
        numeroCrLV: '123',
        scannedAt: new Date('2026-10-14T00:00:00Z'),
        createdAt: new Date('2026-10-14T00:00:00Z'),
        updatedAt: new Date('2026-10-14T00:00:00Z'),
        fileUrl: '/app/uploads/crlv/segredo.pdf',
        rawAiExtraction: { confidence: 0.98 },
      },
    });

    expect(result).not.toHaveProperty('internalNote');
    expect(result).not.toHaveProperty('image');
    expect(result.crlv).toMatchObject({ id: 'crlv-1', numeroCrLV: '123' });
    expect(result.crlv).not.toHaveProperty('fileUrl');
    expect(result.crlv).not.toHaveProperty('rawAiExtraction');
  });

  it('CrlvResponseDto nunca expõe o caminho do arquivo nem o JSON bruto da IA', () => {
    const result = serialize(CrlvResponseDto, {
      id: 'crlv-1',
      vehicleId: 'veh-1',
      fileName: 'CRLV.pdf',
      fileUrl: '/app/uploads/crlv/x.pdf',
      rawAiExtraction: { a: 1 },
    });

    expect(result).toEqual({
      id: 'crlv-1',
      vehicleId: 'veh-1',
      fileName: 'CRLV.pdf',
    });
  });

  it('UserResponseDto nunca expõe o hash da senha', () => {
    const result = serialize(UserResponseDto, {
      id: 'u1',
      name: 'Mariana',
      email: 'mariana@email.com',
      password: '$2b$10$hash',
    });

    expect(result).toEqual({
      id: 'u1',
      name: 'Mariana',
      email: 'mariana@email.com',
    });
  });

  it('mantém valores nulos legítimos (ex.: veículo sem foto)', () => {
    const result = serialize(VehicleResponseDto, {
      id: 'veh-2',
      imageUrl: null,
      renavam: null,
    });

    expect(result).toMatchObject({
      id: 'veh-2',
      imageUrl: null,
      renavam: null,
    });
  });
});
