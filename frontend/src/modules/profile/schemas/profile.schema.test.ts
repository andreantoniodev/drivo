import { joinName, passwordSchema, profileSchema, splitName } from './profile.schema';

describe('splitName / joinName', () => {
  it('separa o primeiro termo do restante', () => {
    expect(splitName('Mariana Costa')).toEqual({ firstName: 'Mariana', lastName: 'Costa' });
    expect(splitName('Ana Paula Souza')).toEqual({ firstName: 'Ana', lastName: 'Paula Souza' });
    expect(splitName('Ana')).toEqual({ firstName: 'Ana', lastName: '' });
    expect(splitName('')).toEqual({ firstName: '', lastName: '' });
  });

  it('junta ignorando partes vazias', () => {
    expect(joinName('Mariana', 'Costa')).toBe('Mariana Costa');
    expect(joinName(' Ana ', '')).toBe('Ana');
  });
});

describe('profileSchema', () => {
  it('exige nome e e-mail válido, sobrenome é opcional', () => {
    expect(
      profileSchema.safeParse({ firstName: 'Ana', lastName: '', email: 'ana@email.com' }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ firstName: '', lastName: '', email: 'ana@email.com' }).success,
    ).toBe(false);
    expect(profileSchema.safeParse({ firstName: 'Ana', lastName: '', email: 'ana' }).success).toBe(
      false,
    );
  });
});

describe('passwordSchema', () => {
  const valid = {
    currentPassword: 'Antiga123',
    newPassword: 'Nova12345',
    confirmPassword: 'Nova12345',
  };

  it('aceita troca válida', () => {
    expect(passwordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita nova senha fraca e confirmação diferente', () => {
    expect(
      passwordSchema.safeParse({ ...valid, newPassword: 'curta1', confirmPassword: 'curta1' })
        .success,
    ).toBe(false);
    expect(passwordSchema.safeParse({ ...valid, confirmPassword: 'Diferente1' }).success).toBe(
      false,
    );
  });
});
