import { renderHook, waitFor } from '@testing-library/react';
import { vehiclesService } from '../services/vehicles.service';
import { Vehicle } from '../types';
import { useVehicles } from './useVehicles';

vi.mock('../services/vehicles.service', () => ({ vehiclesService: { getAll: vi.fn() } }));

const vehicle = (id: string, model: string) => ({ id, model }) as Vehicle;

beforeEach(() => vi.clearAllMocks());

describe('useVehicles', () => {
  it('carrega a lista e informa o total', async () => {
    vi.mocked(vehiclesService.getAll).mockResolvedValue([
      vehicle('1', 'Corolla'),
      vehicle('2', 'Polo'),
    ]);

    const { result } = renderHook(() => useVehicles(''));
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.vehicles).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(vehiclesService.getAll).toHaveBeenCalledWith(undefined);
  });

  it('mantém o total da garagem ao filtrar pela busca', async () => {
    vi.mocked(vehiclesService.getAll).mockImplementation(async (search?: string) =>
      search ? [vehicle('1', 'Corolla')] : [vehicle('1', 'Corolla'), vehicle('2', 'Polo')],
    );

    const { result, rerender } = renderHook(({ search }) => useVehicles(search), {
      initialProps: { search: '' },
    });
    await waitFor(() => expect(result.current.total).toBe(2));

    rerender({ search: 'corolla' });
    await waitFor(() => expect(result.current.vehicles).toHaveLength(1));

    expect(vehiclesService.getAll).toHaveBeenLastCalledWith('corolla');
    expect(result.current.total).toBe(2);
  });

  it('entra em erro e se recupera ao tentar de novo', async () => {
    vi.mocked(vehiclesService.getAll).mockRejectedValueOnce(new Error('rede'));
    vi.mocked(vehiclesService.getAll).mockResolvedValueOnce([vehicle('1', 'Corolla')]);

    const { result } = renderHook(() => useVehicles(''));
    await waitFor(() => expect(result.current.status).toBe('error'));

    result.current.reload();

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.vehicles).toHaveLength(1);
  });
});
