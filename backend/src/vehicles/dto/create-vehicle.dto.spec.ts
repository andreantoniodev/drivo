import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';

const base = {
  brand: 'toyota',
  model: 'Corolla',
  plate: 'rtx-4b21',
  yearFabrication: 2022,
  yearModel: 2023,
};

const build = (overrides: Record<string, unknown> = {}) =>
  plainToInstance(CreateVehicleDto, { ...base, ...overrides });

describe('CreateVehicleDto', () => {
  it('normaliza marca, placa e campos opcionais', async () => {
    const dto = build({
      brand: '  toyota  ',
      plate: ' rtx-4b21 ',
      renavam: ' 01234567890 ',
      chassi: ' 9brbl3he8p0124821 ',
      nickname: '  Carro da família  ',
      color: ' Prata ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      brand: 'TOYOTA',
      plate: 'RTX4B21',
      renavam: '01234567890',
      chassi: '9BRBL3HE8P0124821',
      nickname: 'Carro da família',
      color: 'Prata',
    });
  });

  it('converte anos e quilometragem recebidos como texto', async () => {
    const dto = build({
      yearFabrication: '2022',
      yearModel: '2023',
      mileage: '18000',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.yearFabrication).toBe(2022);
    expect(dto.mileage).toBe(18000);
  });

  it.each(['ABC', 'ABCD123', '1234567', 'AB1C234'])(
    'rejeita a placa inválida %s',
    async (plate) => {
      const errors = await validate(build({ plate }));
      expect(errors.map((e) => e.property)).toContain('plate');
    },
  );

  it('rejeita quilometragem negativa e anos fora do intervalo', async () => {
    const errors = await validate(
      build({ mileage: -1, yearFabrication: 1800, yearModel: 2999 }),
    );
    expect(errors.map((e) => e.property)).toEqual(
      expect.arrayContaining(['mileage', 'yearFabrication', 'yearModel']),
    );
  });
});
