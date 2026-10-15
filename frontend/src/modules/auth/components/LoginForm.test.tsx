import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

const login = vi.fn();
vi.mock('@/shared/auth/AuthContext', () => ({ useAuth: () => ({ login }) }));

const httpError = (status: number) =>
  new AxiosError('x', 'ERR', undefined, undefined, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {} as never,
  });

async function submit(email = 'ana@email.com', password = 'Senha1234') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('E-mail'), email);
  await user.type(screen.getByLabelText('Senha'), password);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

beforeEach(() => vi.clearAllMocks());

describe('LoginForm', () => {
  it('começa com os campos vazios (sem credenciais pré-preenchidas)', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('E-mail')).toHaveValue('');
    expect(screen.getByLabelText('Senha')).toHaveValue('');
  });

  it('chama o login com os dados informados', async () => {
    login.mockResolvedValue(undefined);
    render(<LoginForm />);
    await submit();

    expect(login).toHaveBeenCalledWith('ana@email.com', 'Senha1234');
  });

  it('mostra erro de credenciais para 401', async () => {
    login.mockRejectedValue(httpError(401));
    render(<LoginForm />);
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos');
  });

  it('mostra aviso de limite de tentativas para 429', async () => {
    login.mockRejectedValue(httpError(429));
    render(<LoginForm />);
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas');
  });
});
