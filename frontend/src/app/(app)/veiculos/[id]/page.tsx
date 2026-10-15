import { Suspense } from 'react';
import { Metadata } from 'next';
import { EditVehicleView } from '@/modules/vehicles/views/EditVehicleView';

export const metadata: Metadata = {
  title: 'Editar veículo — DRIVO',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditVehicleContent({ params }: PageProps) {
  const { id } = await params;
  return <EditVehicleView vehicleId={id} />;
}

export default function EditVehiclePage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <EditVehicleContent params={params} />
    </Suspense>
  );
}
