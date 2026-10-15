import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';

describe('UpdateProfileDto', () => {
  it('aceita atualização parcial e normaliza o e-mail (minúsculas, sem espaços)', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      email: '  Ana.Souza@Email.COM ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.email).toBe('ana.souza@email.com');
    expect(dto.name).toBeUndefined();
  });

  it('rejeita nome curto e e-mail inválido', async () => {
    const errors = await validate(
      plainToInstance(UpdateProfileDto, { name: 'A', email: 'ana' }),
    );
    expect(errors.map((e) => e.property)).toEqual(
      expect.arrayContaining(['name', 'email']),
    );
  });
});
