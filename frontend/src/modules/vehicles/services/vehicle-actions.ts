import { getApiErrorMessage, getApiErrorStatus } from '@/shared/services/errors';
import { formValuesToPayload, VehicleFormValues } from '../schemas/vehicle.schema';
import { CrlvExtractionResponse } from '../types';
import { scanToCrlvMetadata } from '../utils/format';
import { crlvService } from './crlv.service';
import { vehiclesService } from './vehicles.service';

export interface PendingCrlv {
  file: File;
  document: CrlvExtractionResponse['document'];
}

export type SaveVehicleResult =
  | { ok: true; vehicleId: string; crlvError?: string }
  | { ok: false; plateConflict: boolean; message: string };

async function attachPendingCrlv(vehicleId: string, pending: PendingCrlv | null) {
  if (!pending) return undefined;
  try {
    await crlvService.attach(vehicleId, pending.file, scanToCrlvMetadata(pending.document));
    return undefined;
  } catch (error) {
    return getApiErrorMessage(error, 'tente importar novamente.');
  }
}

function toFailure(error: unknown, fallback: string): SaveVehicleResult {
  return {
    ok: false,
    plateConflict: getApiErrorStatus(error) === 409,
    message: getApiErrorMessage(error, fallback),
  };
}

export async function createVehicleWithCrlv(
  values: VehicleFormValues,
  pending: PendingCrlv | null,
): Promise<SaveVehicleResult> {
  try {
    const vehicle = await vehiclesService.create(formValuesToPayload(values));
    return {
      ok: true,
      vehicleId: vehicle.id,
      crlvError: await attachPendingCrlv(vehicle.id, pending),
    };
  } catch (error) {
    return toFailure(error, 'Não foi possível salvar o veículo. Tente novamente.');
  }
}

export async function updateVehicleWithCrlv(
  vehicleId: string,
  values: VehicleFormValues,
  pending: PendingCrlv | null,
): Promise<SaveVehicleResult> {
  try {
    await vehiclesService.update(vehicleId, formValuesToPayload(values, 'update'));
    return {
      ok: true,
      vehicleId,
      crlvError: await attachPendingCrlv(vehicleId, pending),
    };
  } catch (error) {
    return toFailure(error, 'Não foi possível salvar as alterações. Tente novamente.');
  }
}
