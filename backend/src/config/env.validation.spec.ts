import { validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/drivo_db',
  JWT_SECRET: 'um-segredo-com-mais-de-16-caracteres',
};

describe('validateEnv', () => {
  it('aplica os valores padrão quando só o obrigatório é informado', () => {
    const env = validateEnv(valid);

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3001,
      JWT_EXPIRES_IN: '7d',
      CORS_ORIGINS: 'http://localhost:3000',
      GEMINI_MODEL: 'gemini-3.8-flash',
      GEMINI_FALLBACK_MODELS: 'gemini-3.1-flash-lite,gemini-3.5-flash',
      GEMINI_MOCK: 'false',
    });
  });

  it('converte PORT para número e respeita valores informados (inclusive reserva vazia)', () => {
    const env = validateEnv({
      ...valid,
      PORT: '4000',
      GEMINI_FALLBACK_MODELS: '',
      GEMINI_MOCK: 'true',
    });

    expect(env.PORT).toBe(4000);
    expect(env.GEMINI_FALLBACK_MODELS).toBe('');
    expect(env.GEMINI_MOCK).toBe('true');
  });

  it('falha com mensagem clara quando falta variável obrigatória', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
    expect(() => validateEnv({ DATABASE_URL: valid.DATABASE_URL })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('rejeita segredo curto, porta inválida e GEMINI_MOCK fora de true/false', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: 'curto' })).toThrow(
      /JWT_SECRET/,
    );
    expect(() => validateEnv({ ...valid, PORT: '99999' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...valid, GEMINI_MOCK: 'talvez' })).toThrow(
      /GEMINI_MOCK/,
    );
  });
});
