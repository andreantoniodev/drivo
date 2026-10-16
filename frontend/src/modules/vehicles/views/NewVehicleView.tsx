'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CrlvImporter } from '../components/CrlvImporter';
import { VehicleFormFields } from '../components/VehicleFormFields';
import { VehicleFormShell } from '../components/VehicleFormShell';
import { emptyVehicleForm, VehicleFormValues, vehicleSchema } from '../schemas/vehicle.schema';
import { createVehicleWithCrlv, PendingCrlv } from '../services/vehicle-actions';
import { CrlvExtractionResponse } from '../types';
import { scanToFormValues } from '../utils/format';

export const NewVehicleView: React.FC = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingCrlv, setPendingCrlv] = useState<PendingCrlv | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: emptyVehicleForm,
  });

  const [brand, model] = useWatch({ control, name: ['brand', 'model'] });
  const summary = ['Novo veículo', [brand, model].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(' · ');

  const handleScanComplete = (result: CrlvExtractionResponse, file: File) => {
    reset(scanToFormValues(result.vehicle, getValues()));
    setPendingCrlv({ file, document: result.document });
    setApiError(null);
  };

  const onSubmit = async (values: VehicleFormValues) => {
    setApiError(null);
    const result = await createVehicleWithCrlv(values, pendingCrlv);

    if (!result.ok) {
      if (result.plateConflict) {
        setError('plate', {
          message: 'Você já possui um veículo com esta placa',
        });
      } else {
        setApiError(result.message);
      }
      return;
    }

    router.push(result.crlvError ? `/vehicles/${result.vehicleId}` : '/');
  };

  return (
    <VehicleFormShell
      title="Novo veículo"
      summary={summary}
      submitLabel="Salvar veículo"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
      apiError={apiError}
      aside={<CrlvImporter onScanComplete={handleScanComplete} />}
    >
      <VehicleFormFields register={register} errors={errors} />
    </VehicleFormShell>
  );
};
