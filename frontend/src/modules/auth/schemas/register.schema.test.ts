import { registerSchema } from './register.schema';

const valid = {
  name: 'Mariana Costa',
  email: 'mariana.costa@email.com',
  password: 'Senha1234',
  confirmPassword: 'Senha1234',
};

const messages = (input: object) => {
  const result = registerSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('registerSchema', () => {
  it('aceita dados válidos', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('exige nome com ao menos 2 caracteres', () => {
    expect(messages({ ...valid, name: 'A' })).toContain('O nome deve ter no mínimo 2 caracteres');
  });

  it('rejeita e-mail inválido', () => {
    expect(messages({ ...valid, email: 'mariana' })).toContain(
      'Informe um e-mail válido (ex: seu@email.com)',
    );
  });

  it('exige senha com 8+ caracteres, letra e número', () => {
    expect(messages({ ...valid, password: 'abc123', confirmPassword: 'abc123' })).toContain(
      'A senha deve ter no mínimo 8 caracteres',
    );
    expect(messages({ ...valid, password: 'abcdefgh', confirmPassword: 'abcdefgh' })).toContain(
      'A senha deve conter ao menos uma letra e um número',
    );
  });

  it('exige que a confirmação seja igual à senha', () => {
    expect(messages({ ...valid, confirmPassword: 'Outra1234' })).toContain(
      'As senhas não coincidem',
    );
  });
});
