import { CrlvExtractionResponse, CrlvDocument } from '@/modules/vehicles/types';
import { VehicleFormValues } from '../schemas/vehicle.schema';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatShortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatLastChange(iso: string, now = new Date()) {
  const date = new Date(iso);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const isToday = date.toDateString() === now.toDateString();
  return `${isToday ? 'Hoje' : formatShortDate(iso)}, ${time}`;
}

export function scanToFormValues(
  scan: CrlvExtractionResponse['vehicle'],
  current: VehicleFormValues,
): VehicleFormValues {
  return {
    ...current,
    plate: scan.plate || current.plate,
    renavam: scan.renavam ?? current.renavam,
    chassi: scan.chassi ?? current.chassi,
    brand: scan.brand || current.brand,
    model: scan.model || current.model,
    yearFabrication: scan.yearFabrication ? String(scan.yearFabrication) : current.yearFabrication,
    yearModel: scan.yearModel ? String(scan.yearModel) : current.yearModel,
    color: scan.color ?? current.color,
    fuelType: scan.fuelType ?? current.fuelType,
    category: scan.category ?? current.category,
  };
}

export function scanToCrlvMetadata(
  document: CrlvExtractionResponse['document'],
): Partial<CrlvDocument> {
  const validDate = document.dataEmissao && /^\d{4}-\d{2}-\d{2}$/.test(document.dataEmissao);

  return {
    numeroCrLV: document.numeroCrLV,
    codigoSeguranca: document.codigoSeguranca,
    exercicio: document.exercicio,
    dataEmissao: validDate ? document.dataEmissao : undefined,
    nomeProprietario: document.nomeProprietario,
    cpfCnpjProprietario: document.cpfCnpjProprietario,
    localRegistro: document.localRegistro,
  };
}
