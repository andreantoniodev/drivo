import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from './ConfirmModal';

const baseProps = {
  title: 'Excluir Corolla?',
  description: 'O veículo de placa RTX4B21 será removido.',
  onConfirm: vi.fn(),
  onClose: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('ConfirmModal', () => {
  it('não renderiza fechado', () => {
    render(<ConfirmModal {...baseProps} isOpen={false} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('mostra título e descrição acessíveis quando aberto', () => {
    render(<ConfirmModal {...baseProps} isOpen />);

    const dialog = screen.getByRole('alertdialog', { name: 'Excluir Corolla?' });
    expect(dialog).toHaveAccessibleDescription('O veículo de placa RTX4B21 será removido.');
  });

  it('confirma e cancela pelos botões e fecha com Esc', async () => {
    render(<ConfirmModal {...baseProps} isOpen />);

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Escape}');
    expect(baseProps.onClose).toHaveBeenCalledTimes(2);
  });

  it('não fecha por Esc nem permite cancelar enquanto exclui', async () => {
    render(<ConfirmModal {...baseProps} isOpen isLoading />);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });
});
