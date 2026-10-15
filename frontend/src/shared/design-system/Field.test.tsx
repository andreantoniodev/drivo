import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from './Field';

describe('Field', () => {
  it('associa o rótulo ao input', async () => {
    render(<Field label="E-mail" />);

    const input = screen.getByLabelText('E-mail');
    await userEvent.type(input, 'ana@email.com');
    expect(input).toHaveValue('ana@email.com');
  });

  it('mostra o erro com role=alert e marca o input como inválido', () => {
    render(<Field label="E-mail" error="Informe um e-mail válido" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Informe um e-mail válido');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Informe um e-mail válido');
  });

  it('alterna a visibilidade da senha', async () => {
    render(<Field label="Senha" fieldVariant="password" />);

    const input = screen.getByLabelText('Senha');
    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Exibir senha' }));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('respeita disabled', () => {
    render(<Field label="Placa" disabled />);
    expect(screen.getByLabelText('Placa')).toBeDisabled();
  });
});
