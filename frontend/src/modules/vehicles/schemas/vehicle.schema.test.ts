import { Vehicle } from '../types';
import {
  emptyVehicleForm,
  formValuesToPayload,
  normalizePlate,
  vehicleSchema,
  vehicleToFormValues,
} from './vehicle.schema';

const valid = {
  ...emptyVehicleForm,
  plate: 'RTX4B21',
  brand: 'Toyota',
  model: 'Corolla Altis Hybrid',
  yearFabrication: '2022',
  yearModel: '2023',
};

describe('vehicleSchema', () => {
  it('aceita um veículo válido com opcionais em branco', () => {
    expect(vehicleSchema.safeParse(valid).success).toBe(true);
  });

  it.each(['rtx4b21', 'RTX-4B21', 'RTX4121', ' abc1d23 '])('aceita a placa %s', (plate) => {
    expect(vehicleSchema.safeParse({ ...valid, plate }).success).toBe(true);
  });

  it.each(['', 'ABC', '1234567', 'RTX4B2'])('rejeita a placa "%s"', (plate) => {
    const result = vehicleSchema.safeParse({ ...valid, plate });
    expect(result.success).toBe(false);
  });

  it('exige marca, modelo e anos', () => {
    const result = vehicleSchema.safeParse({
      ...valid,
      brand: '',
      model: '',
      yearFabrication: '',
      yearModel: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(
        expect.arrayContaining(['brand', 'model', 'yearFabrication', 'yearModel']),
      );
    }
  });

  it('valida o intervalo e o formato dos anos', () => {
    expect(vehicleSchema.safeParse({ ...valid, yearFabrication: '1899' }).success).toBe(false);
    expect(vehicleSchema.safeParse({ ...valid, yearFabrication: '20x2' }).success).toBe(false);
    expect(vehicleSchema.safeParse({ ...valid, yearModel: '2999' }).success).toBe(false);
  });
});

describe('normalizePlate', () => {
  it('coloca em maiúsculas e remove símbolos', () => {
    expect(normalizePlate('rtx-4b21')).toBe('RTX4B21');
  });
});

describe('formValuesToPayload', () => {
  it('na criação omite opcionais em branco e converte anos para número', () => {
    const payload = formValuesToPayload({ ...valid, plate: 'rtx-4b21', color: ' Prata ' });

    expect(payload).toMatchObject({
      plate: 'RTX4B21',
      yearFabrication: 2022,
      yearModel: 2023,
      color: 'Prata',
    });
    expect(payload.renavam).toBeUndefined();
    expect(payload.nickname).toBeUndefined();
  });

  it('na edição envia "" para limpar opcionais em branco', () => {
    const payload = formValuesToPayload(valid, 'update');
    expect(payload.renavam).toBe('');
    expect(payload.nickname).toBe('');
  });
});

describe('vehicleToFormValues', () => {
  it('converte o veículo da API em valores de formulário (strings)', () => {
    const vehicle = {
      id: '1',
      userId: 'u',
      plate: 'RTX4B21',
      brand: 'TOYOTA',
      model: 'Corolla',
      yearFabrication: 2022,
      yearModel: 2023,
      renavam: null,
      nickname: 'Meu carro',
      createdAt: '',
      updatedAt: '',
    } as Vehicle;

    expect(vehicleToFormValues(vehicle)).toMatchObject({
      yearFabrication: '2022',
      yearModel: '2023',
      renavam: '',
      nickname: 'Meu carro',
    });
  });
});
