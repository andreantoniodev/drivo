import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('é type="button" por padrão e dispara onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toHaveAttribute('type', 'button');

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('usa as medidas do DS: 44px (md) e 36px (sm)', () => {
    render(
      <>
        <Button>Padrão</Button>
        <Button size="sm">Pequeno</Button>
      </>,
    );

    expect(screen.getByText('Padrão')).toHaveClass('h-11', 'rounded-xl', 'text-[15px]');
    expect(screen.getByText('Pequeno')).toHaveClass('h-9', 'text-sm');
  });

  it('aplica a cor da variante', () => {
    render(<Button variant="danger-soft">Excluir</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-danger');
  });

  it('desabilita e marca aria-busy enquanto carrega, sem disparar clique', async () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Salvar')).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
