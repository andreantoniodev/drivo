import { render, screen } from '@testing-library/react';
import { Vehicle } from '../types';
import { VehicleCard } from './VehicleCard';

vi.mock('@/shared/hooks/useAuthedImage', () => ({
  useAuthedImage: (url?: string | null) => ({
    src: url ? `blob:mock-${url}` : null,
    isLoading: false,
    hasError: false,
  }),
}));

const vehicle: Vehicle = {
  id: 'veh-1',
  userId: 'user-1',
  brand: 'TOYOTA',
  model: 'Corolla Altis Hybrid',
  plate: 'RTX4B21',
  renavam: '01234567890',
  chassi: '9BRBL3HE8P0124821',
  yearFabrication: 2022,
  yearModel: 2023,
  color: 'Prata',
  fuelType: 'Híbrido',
  imageUrl: '/vehicles/veh-1/image?v=1',
  createdAt: '2026-03-14T00:00:00.000Z',
  updatedAt: '2026-03-14T00:00:00.000Z',
};

describe('VehicleCard', () => {
  it('mostra marca, modelo, placa e detalhes', () => {
    render(<VehicleCard vehicle={vehicle} />);

    expect(screen.getByText('TOYOTA')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Corolla Altis Hybrid' })).toBeInTheDocument();
    expect(screen.getByText('RTX4B21')).toBeInTheDocument();
    expect(screen.getByText('Prata · 2022/2023 · Híbrido')).toBeInTheDocument();
    expect(screen.getByText('01234567890')).toBeInTheDocument();
  });

  it('mascara o chassi (3 primeiros e 4 últimos caracteres)', () => {
    render(<VehicleCard vehicle={vehicle} />);
    expect(screen.getByText('9BR•••••••4821')).toBeInTheDocument();
    expect(screen.queryByText('9BRBL3HE8P0124821')).not.toBeInTheDocument();
  });

  it('leva à edição do veículo', () => {
    render(<VehicleCard vehicle={vehicle} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/vehicles/veh-1');
  });

  it('usa "—" quando RENAVAM e chassi não existem e mostra placeholder sem foto', () => {
    render(
      <VehicleCard
        vehicle={{
          ...vehicle,
          renavam: null,
          chassi: null,
          imageUrl: null,
          color: null,
          fuelType: null,
        }}
      />,
    );

    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('2022/2023')).toBeInTheDocument();
  });

  it('exibe a foto buscada da API quando o veículo tem imageUrl', () => {
    render(<VehicleCard vehicle={vehicle} />);

    expect(screen.getByRole('img', { name: 'TOYOTA Corolla Altis Hybrid' })).toHaveAttribute(
      'src',
      'blob:mock-/vehicles/veh-1/image?v=1',
    );
  });

  it("usa o logo do Drivo (decorativo) como marca d'água quando o veículo não tem foto", () => {
    const { container } = render(<VehicleCard vehicle={{ ...vehicle, imageUrl: null }} />);

    const logo = container.querySelector('img[src="/brand/drivo-logo.png"]');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('não mostra o logo quando há foto', () => {
    const { container } = render(<VehicleCard vehicle={vehicle} />);

    expect(container.querySelector('img[src="/brand/drivo-logo.png"]')).not.toBeInTheDocument();
  });
});
