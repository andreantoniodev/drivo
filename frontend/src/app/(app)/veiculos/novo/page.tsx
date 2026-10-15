import { Metadata } from 'next';
import { NewVehicleView } from '@/modules/vehicles/views/NewVehicleView';

export const metadata: Metadata = {
  title: 'Novo veículo — DRIVO',
};

export default function NewVehiclePage() {
  return <NewVehicleView />;
}
