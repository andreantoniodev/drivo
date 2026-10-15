import { emptyVehicleForm } from '../schemas/vehicle.schema';
import { formatLastChange, formatShortDate, scanToCrlvMetadata, scanToFormValues } from './format';

describe('formatShortDate', () => {
  it('formata como "14 mar 2026"', () => {
    expect(formatShortDate('2026-03-14T12:00:00')).toBe('14 mar 2026');
  });
});

describe('formatLastChange', () => {
  const now = new Date('2026-10-14T18:00:00');

  it('mostra "Hoje" com a hora quando é do mesmo dia', () => {
    expect(formatLastChange('2026-10-14T09:42:00', now)).toBe('Hoje, 09:42');
  });

  it('mostra a data completa quando é de outro dia', () => {
    expect(formatLastChange('2026-10-01T08:05:00', now)).toBe('1 out 2026, 08:05');
  });
});

describe('scanToFormValues', () => {
  it('preenche os campos identificados e preserva os atuais quando o scan veio vazio', () => {
    const current = { ...emptyVehicleForm, nickname: 'Carro da família', color: 'Azul' };
    const result = scanToFormValues(
      {
        brand: 'TOYOTA',
        model: 'Corolla',
        plate: 'RTX4B21',
        yearFabrication: null,
        yearModel: 2023,
        color: null,
        renavam: '01234567890',
      },
      current,
    );

    expect(result.brand).toBe('TOYOTA');
    expect(result.plate).toBe('RTX4B21');
    expect(result.yearModel).toBe('2023');
    expect(result.yearFabrication).toBe('');
    expect(result.renavam).toBe('01234567890');
    expect(result.nickname).toBe('Carro da família');
  });
});

describe('scanToCrlvMetadata', () => {
  it('mantém a data de emissão válida (AAAA-MM-DD)', () => {
    expect(scanToCrlvMetadata({ dataEmissao: '2023-05-10' }).dataEmissao).toBe('2023-05-10');
  });

  it('descarta data de emissão em formato inválido', () => {
    expect(scanToCrlvMetadata({ dataEmissao: '10/05/2023' }).dataEmissao).toBeUndefined();
    expect(scanToCrlvMetadata({ dataEmissao: null }).dataEmissao).toBeUndefined();
  });
});
