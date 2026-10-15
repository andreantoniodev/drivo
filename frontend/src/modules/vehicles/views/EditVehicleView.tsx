'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, Button, ConfirmModal } from '@/shared/design-system';
import { getApiErrorMessage } from '@/shared/services/errors';
import { VehicleFormFields } from '../components/VehicleFormFields';
import { VehicleFormShell } from '../components/VehicleFormShell';
import { useCrlvScan } from '../hooks/useCrlvScan';
import { useVehicle } from '../hooks/useVehicle';
import {
  emptyVehicleForm,
  VehicleFormValues,
  vehicleSchema,
  vehicleToFormValues,
} from '../schemas/vehicle.schema';
import { PendingCrlv, updateVehicleWithCrlv } from '../services/vehicle-actions';
import { vehiclesService } from '../services/vehicles.service';
import { formatLastChange, formatShortDate, scanToFormValues } from '../utils/format';

export interface EditVehicleViewProps {
  vehicleId: string;
}

export const EditVehicleView: React.FC<EditVehicleViewProps> = ({ vehicleId }) => {
  const router = useRouter();
  const { vehicle, status, reload } = useVehicle(vehicleId);
  const { scan, isScanning, error: scanError } = useCrlvScan();

  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingCrlv, setPendingCrlv] = useState<PendingCrlv | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: emptyVehicleForm,
  });

  useEffect(() => {
    if (vehicle) reset(vehicleToFormValues(vehicle));
  }, [vehicle, reset]);

  const handleReimport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setApiError(null);
    const result = await scan(file);
    if (!result) return;

    reset(scanToFormValues(result.vehicle, getValues()), {
      keepDefaultValues: true,
    });
    setPendingCrlv({ file, document: result.document });
  };

  const onSubmit = async (values: VehicleFormValues) => {
    setApiError(null);
    const result = await updateVehicleWithCrlv(vehicleId, values, pendingCrlv);

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

    if (result.crlvError) {
      setPendingCrlv(null);
      setApiError(`Alterações salvas, mas o CRLV não foi anexado: ${result.crlvError}`);
      return;
    }

    router.push('/');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await vehiclesService.delete(vehicleId);
      router.push('/');
    } catch (error) {
      setIsDeleteOpen(false);
      setApiError(
        getApiErrorMessage(error, 'Não foi possível excluir o veículo. Tente novamente.'),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!vehicle) {
    return (
      <main className="flex flex-col items-center gap-4 px-6 py-24 text-center">
        {status === 'loading' ? (
          <Loader2 className="w-6 h-6 animate-spin text-accent" aria-label="Carregando veículo" />
        ) : (
          <div role="alert" className="flex flex-col items-center gap-4 text-fg-muted">
            <AlertCircle className="w-8 h-8 text-danger" aria-hidden />
            <p className="text-[15px]">
              {status === 'not-found'
                ? 'Veículo não encontrado.'
                : 'Não foi possível carregar o veículo.'}
            </p>
            <div className="flex gap-3">
              {status === 'error' && (
                <Button type="button" variant="secondary" onClick={reload}>
                  Tentar novamente
                </Button>
              )}
              <Link href="/">
                <Button type="button" variant="secondary">
                  Voltar para a garagem
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    );
  }

  const aside = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleReimport}
        data-testid="crlv-file-input"
      />

      <div className="bg-surface rounded-[20px] px-6 py-2 text-sm">
        <div className="h-12 flex items-center justify-between">
          <span className="text-fg-muted">Cadastrado em</span>
          <span className="font-medium text-fg">{formatShortDate(vehicle.createdAt)}</span>
        </div>
        <div className="h-12 flex items-center justify-between">
          <span className="text-fg-muted">Última alteração</span>
          <span className="font-medium text-fg">{formatLastChange(vehicle.updatedAt)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          isLoading={isScanning}
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          Atualizar com novo CRLV
        </Button>
        {scanError && <Alert>{scanError}</Alert>}
        {pendingCrlv && (
          <p className="text-xs text-fg-muted px-1">
            {pendingCrlv.file.name} lido. Salve as alterações para aplicar.
          </p>
        )}
      </div>

      <div className="bg-surface rounded-[20px] p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[17px] font-semibold text-fg">Excluir veículo</h2>
          <p className="text-[13px] leading-[1.45] text-fg-muted">
            Remove o veículo e todos os seus dados da sua garagem. Não é possível desfazer.
          </p>
        </div>
        <Button variant="danger-soft" onClick={() => setIsDeleteOpen(true)} className="w-full">
          Excluir veículo
        </Button>
      </div>
    </>
  );

  return (
    <>
      <VehicleFormShell
        title={vehicle.model}
        summary={`Editando · ${vehicle.model} · ${vehicle.plate}`}
        submitLabel="Salvar alterações"
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        apiError={apiError}
        aside={aside}
      >
        <VehicleFormFields register={register} errors={errors} />
      </VehicleFormShell>

      <ConfirmModal
        isOpen={isDeleteOpen}
        title={`Excluir ${vehicle.model}?`}
        description={`O veículo de placa ${vehicle.plate} e todos os seus dados serão removidos permanentemente.`}
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
