import { renderHook, waitFor } from '@testing-library/react';
import { api } from '@/shared/services/api';
import { isApiImagePath, useAuthedImage } from './useAuthedImage';

vi.mock('@/shared/services/api', () => ({ api: { get: vi.fn() } }));

const createObjectURL = vi.fn((blob: Blob) => `blob:mock-${blob.size}`);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
});

describe('isApiImagePath', () => {
  it('só caminhos da API (começam com "/") precisam do token', () => {
    expect(isApiImagePath('/vehicles/1/image?v=1')).toBe(true);
    expect(isApiImagePath('https://exemplo.test/foto.jpg')).toBe(false);
    expect(isApiImagePath('data:image/png;base64,AAAA')).toBe(false);
  });
});

describe('useAuthedImage', () => {
  it('não faz nada sem URL', () => {
    const { result } = renderHook(() => useAuthedImage(null));

    expect(result.current).toEqual({ src: null, isLoading: false, hasError: false });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('usa links externos diretamente, sem chamar a API', () => {
    const { result } = renderHook(() => useAuthedImage('https://exemplo.test/foto.jpg'));

    expect(result.current.src).toBe('https://exemplo.test/foto.jpg');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('busca a imagem protegida como blob e devolve uma URL de objeto', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: new Blob(['abc']) } as never);

    const { result } = renderHook(() => useAuthedImage('/vehicles/veh-a/image?v=1'));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.src).toBe('blob:mock-3'));
    expect(result.current.isLoading).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/vehicles/veh-a/image?v=1', { responseType: 'blob' });
  });

  it('reaproveita o cache para a mesma URL', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: new Blob(['abc']) } as never);

    const first = renderHook(() => useAuthedImage('/vehicles/veh-cache/image?v=1'));
    await waitFor(() => expect(first.result.current.src).not.toBeNull());

    const second = renderHook(() => useAuthedImage('/vehicles/veh-cache/image?v=1'));
    await waitFor(() => expect(second.result.current.src).not.toBeNull());

    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('sinaliza erro (para o card mostrar o placeholder) quando a busca falha', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('404'));

    const { result } = renderHook(() => useAuthedImage('/vehicles/veh-erro/image?v=1'));

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.src).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
