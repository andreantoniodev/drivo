import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

const registerUser = vi.fn();
vi.mock('@/shared/auth/AuthContext', () => ({ useAuth: () => ({ register: registerUser }) }));

const httpError = (status: number) =>
  new AxiosError('x', 'ERR', undefined, undefined, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {} as never,
  });

async function fill(values: Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>) {
  const user = userEvent.setup();
  if (values.name) await user.type(screen.getByLabelText('Nome completo'), values.name);
  if (values.email) await user.type(screen.getByLabelText('E-mail'), values.email);
  if (values.password) await user.type(screen.getByLabelText('Senha'), values.password);
  if (values.confirm) await user.type(screen.getByLabelText('Confirmar senha'), values.confirm);
  await user.click(screen.getByRole('button', { name: 'Criar conta' }));
}

beforeEach(() => vi.clearAllMocks());

describe('RegisterForm', () => {
  it('mostra os erros de campos obrigatórios e não chama a API', async () => {
    render(<RegisterForm />);
    await fill({});

    expect(await screen.findByText('O nome é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('O e-mail é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('A senha é obrigatória')).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('valida a confirmação de senha', async () => {
    render(<RegisterForm />);
    await fill({
      name: 'Ana',
      email: 'ana@email.com',
      password: 'Senha1234',
      confirm: 'Outra1234',
    });

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('envia nome, e-mail e senha (sem a confirmação)', async () => {
    registerUser.mockResolvedValue(undefined);
    render(<RegisterForm />);
    await fill({
      name: 'Ana Souza',
      email: 'ana@email.com',
      password: 'Senha1234',
      confirm: 'Senha1234',
    });

    expect(registerUser).toHaveBeenCalledWith('Ana Souza', 'ana@email.com', 'Senha1234');
  });

  it('explica quando o e-mail já está cadastrado (409)', async () => {
    registerUser.mockRejectedValue(httpError(409));
    render(<RegisterForm />);
    await fill({
      name: 'Ana Souza',
      email: 'ana@email.com',
      password: 'Senha1234',
      confirm: 'Senha1234',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já está cadastrado');
  });
});
