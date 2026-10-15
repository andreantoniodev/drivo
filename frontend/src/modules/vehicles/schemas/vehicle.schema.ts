import { z } from 'zod';
import { CreateVehicleInput, Vehicle } from '@/modules/vehicles/types';

const currentYear = new Date().getFullYear();

const yearField = (label: string, maxYear: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório`)
    .regex(/^\d{4}$/, `${label} deve ter 4 dígitos`)
    .refine((value) => Number(value) >= 1900 && Number(value) <= maxYear, {
      message: `${label} deve estar entre 1900 e ${maxYear}`,
    });

export const vehicleSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, 'A placa é obrigatória')
    .refine((value) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizePlate(value)), {
      message: 'Placa inválida. Ex.: RTX4B21 ou RTX4121',
    }),
  renavam: z.string().trim(),
  chassi: z.string().trim(),
  brand: z.string().trim().min(1, 'A marca é obrigatória'),
  model: z.string().trim().min(1, 'O modelo é obrigatório'),
  yearFabrication: yearField('Ano de fabricação', currentYear + 1),
  yearModel: yearField('Ano do modelo', currentYear + 2),
  color: z.string().trim(),
  fuelType: z.string().trim(),
  category: z.string().trim(),
  nickname: z.string().trim(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

export const emptyVehicleForm: VehicleFormValues = {
  plate: '',
  renavam: '',
  chassi: '',
  brand: '',
  model: '',
  yearFabrication: '',
  yearModel: '',
  color: '',
  fuelType: '',
  category: '',
  nickname: '',
};

export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function vehicleToFormValues(vehicle: Vehicle): VehicleFormValues {
  return {
    plate: vehicle.plate,
    renavam: vehicle.renavam ?? '',
    chassi: vehicle.chassi ?? '',
    brand: vehicle.brand,
    model: vehicle.model,
    yearFabrication: String(vehicle.yearFabrication),
    yearModel: String(vehicle.yearModel),
    color: vehicle.color ?? '',
    fuelType: vehicle.fuelType ?? '',
    category: vehicle.category ?? '',
    nickname: vehicle.nickname ?? '',
  };
}

export function formValuesToPayload(
  values: VehicleFormValues,
  mode: 'create' | 'update' = 'create',
): CreateVehicleInput {
  const optional = (value: string) => {
    const trimmed = value.trim();
    if (trimmed !== '') return trimmed;
    return mode === 'update' ? '' : undefined;
  };

  return {
    plate: normalizePlate(values.plate),
    brand: values.brand.trim(),
    model: values.model.trim(),
    yearFabrication: Number(values.yearFabrication),
    yearModel: Number(values.yearModel),
    renavam: optional(values.renavam),
    chassi: optional(values.chassi),
    color: optional(values.color),
    fuelType: optional(values.fuelType),
    category: optional(values.category),
    nickname: optional(values.nickname),
  };
}
