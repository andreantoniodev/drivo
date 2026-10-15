import { AxiosError } from 'axios';
import { getApiErrorMessage, getApiErrorStatus } from './errors';

const apiError = (status: number, data: unknown) =>
  new AxiosError('falhou', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: {} as never,
  });

describe('getApiErrorMessage', () => {
  it('devolve a mensagem em texto da API', () => {
    expect(getApiErrorMessage(apiError(409, { message: 'E-mail já em uso' }), 'padrão')).toBe(
      'E-mail já em uso',
    );
  });

  it('devolve a primeira mensagem quando a API manda uma lista de validações', () => {
    const error = apiError(400, { message: ['Placa inválida', 'Marca obrigatória'] });
    expect(getApiErrorMessage(error, 'padrão')).toBe('Placa inválida');
  });

  it('usa o texto padrão para erros que não vêm da API ou sem mensagem', () => {
    expect(getApiErrorMessage(new Error('rede'), 'padrão')).toBe('padrão');
    expect(getApiErrorMessage(apiError(500, {}), 'padrão')).toBe('padrão');
    expect(getApiErrorMessage(null, 'padrão')).toBe('padrão');
  });
});

describe('getApiErrorStatus', () => {
  it('devolve o status HTTP ou undefined', () => {
    expect(getApiErrorStatus(apiError(404, {}))).toBe(404);
    expect(getApiErrorStatus(new Error('x'))).toBeUndefined();
  });
});
