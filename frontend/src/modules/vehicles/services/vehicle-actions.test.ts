import { AxiosError } from 'axios';
import { emptyVehicleForm, VehicleFormValues } from '../schemas/vehicle.schema';
import { crlvService } from './crlv.service';
import { createVehicleWithCrlv, updateVehicleWithCrlv } from './vehicle-actions';
import { vehiclesService } from './vehicles.service';

vi.mock('./vehicles.service', () => ({
  vehiclesService: { create: vi.fn(), update: vi.fn() },
}));
vi.mock('./crlv.service', () => ({ crlvService: { attach: vi.fn() } }));

const values: VehicleFormValues = {
  ...emptyVehicleForm,
  plate: 'rtx-4b21',
  brand: 'Toyota',
  model: 'Corolla',
  yearFabrication: '2022',
  yearModel: '2023',
};

const pending = {
  file: new File(['pdf'], 'CRLV.pdf', { type: 'application/pdf' }),
  document: { numeroCrLV: '123', dataEmissao: '2023-05-10' },
};

const httpError = (status: number, message: string) =>
  new AxiosError('x', 'ERR', undefined, undefined, {
    status,
    data: { message },
    statusText: '',
    headers: {},
    config: {} as never,
  });

beforeEach(() => vi.clearAllMocks());

describe('createVehicleWithCrlv', () => {
  it('cria o veículo com payload normalizado e não anexa quando não há CRLV', async () => {
    vi.mocked(vehiclesService.create).mockResolvedValue({ id: 'v1' } as never);

    const result = await createVehicleWithCrlv(values, null);

    expect(result).toEqual({ ok: true, vehicleId: 'v1', crlvError: undefined });
    expect(vehiclesService.create).toHaveBeenCalledWith(
      expect.objectContaining({ plate: 'RTX4B21', yearFabrication: 2022, yearModel: 2023 }),
    );
    expect(crlvService.attach).not.toHaveBeenCalled();
  });

  it('anexa o CRLV lido ao veículo criado', async () => {
    vi.mocked(vehiclesService.create).mockResolvedValue({ id: 'v1' } as never);
    vi.mocked(crlvService.attach).mockResolvedValue({} as never);

    const result = await createVehicleWithCrlv(values, pending);

    expect(result).toMatchObject({ ok: true, vehicleId: 'v1' });
    expect(crlvService.attach).toHaveBeenCalledWith(
      'v1',
      pending.file,
      expect.objectContaining({ numeroCrLV: '123', dataEmissao: '2023-05-10' }),
    );
  });

  it('mantém o veículo criado e reporta o erro quando o anexo falha', async () => {
    vi.mocked(vehiclesService.create).mockResolvedValue({ id: 'v1' } as never);
    vi.mocked(crlvService.attach).mockRejectedValue(httpError(500, 'disco cheio'));

    const result = await createVehicleWithCrlv(values, pending);

    expect(result).toEqual({ ok: true, vehicleId: 'v1', crlvError: 'disco cheio' });
  });

  it('sinaliza conflito de placa (409)', async () => {
    vi.mocked(vehiclesService.create).mockRejectedValue(httpError(409, 'placa duplicada'));

    const result = await createVehicleWithCrlv(values, null);

    expect(result).toEqual({ ok: false, plateConflict: true, message: 'placa duplicada' });
  });

  it('devolve a mensagem da API em outros erros', async () => {
    vi.mocked(vehiclesService.create).mockRejectedValue(httpError(400, 'Placa inválida'));

    const result = await createVehicleWithCrlv(values, null);

    expect(result).toEqual({ ok: false, plateConflict: false, message: 'Placa inválida' });
  });
});

describe('updateVehicleWithCrlv', () => {
  it('envia "" para limpar campos opcionais em branco', async () => {
    vi.mocked(vehiclesService.update).mockResolvedValue({} as never);

    await updateVehicleWithCrlv('v1', values, null);

    expect(vehiclesService.update).toHaveBeenCalledWith(
      'v1',
      expect.objectContaining({ nickname: '', renavam: '' }),
    );
  });

  it('atualiza e anexa o novo CRLV', async () => {
    vi.mocked(vehiclesService.update).mockResolvedValue({} as never);
    vi.mocked(crlvService.attach).mockResolvedValue({} as never);

    const result = await updateVehicleWithCrlv('v1', values, pending);

    expect(result).toEqual({ ok: true, vehicleId: 'v1', crlvError: undefined });
    expect(crlvService.attach).toHaveBeenCalledWith('v1', pending.file, expect.any(Object));
  });
});
