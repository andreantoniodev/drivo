import React from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field } from '@/shared/design-system';
import { VehicleFormValues } from '../schemas/vehicle.schema';

const FUEL_OPTIONS = ['Gasolina', 'Etanol', 'Flex', 'Diesel', 'Híbrido', 'Elétrico', 'GNV'];
const CATEGORY_OPTIONS = [
  'Automóvel',
  'Motocicleta',
  'Caminhonete',
  'Camioneta',
  'Utilitário',
  'Caminhão',
];

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, children }) => (
  <section className="bg-surface rounded-[20px] p-7 flex flex-col gap-6">
    <div className="flex flex-col gap-1">
      <h2 className="text-[19px] font-semibold tracking-[-0.3px] text-fg">{title}</h2>
      <p className="text-[13px] text-fg-muted">{description}</p>
    </div>
    {children}
  </section>
);

export interface VehicleFormFieldsProps {
  register: UseFormRegister<VehicleFormValues>;
  errors: FieldErrors<VehicleFormValues>;
}

export const VehicleFormFields: React.FC<VehicleFormFieldsProps> = ({ register, errors }) => (
  <>
    <Section title="Identificação" description="Dados oficiais do veículo, conforme o documento.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Placa"
          placeholder="RTX4B21"
          autoComplete="off"
          maxLength={8}
          error={errors.plate?.message}
          className="uppercase"
          {...register('plate')}
        />
        <Field
          label="Renavam"
          placeholder="01234567890"
          inputMode="numeric"
          autoComplete="off"
          error={errors.renavam?.message}
          {...register('renavam')}
        />
      </div>
      <Field
        label="Chassi"
        placeholder="9BRBC3E31P4821"
        autoComplete="off"
        error={errors.chassi?.message}
        className="uppercase"
        {...register('chassi')}
      />
    </Section>

    <Section title="Características" description="Como o veículo aparece na sua garagem.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Marca"
          placeholder="Toyota"
          error={errors.brand?.message}
          {...register('brand')}
        />
        <Field
          label="Modelo"
          placeholder="Corolla Altis Hybrid"
          error={errors.model?.message}
          {...register('model')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field
          label="Ano de fabricação"
          placeholder="2022"
          inputMode="numeric"
          maxLength={4}
          error={errors.yearFabrication?.message}
          {...register('yearFabrication')}
        />
        <Field
          label="Ano do modelo"
          placeholder="2023"
          inputMode="numeric"
          maxLength={4}
          error={errors.yearModel?.message}
          {...register('yearModel')}
        />
        <Field
          label="Cor"
          placeholder="Prata"
          error={errors.color?.message}
          {...register('color')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field
          label="Combustível"
          placeholder="Híbrido"
          list="vehicle-fuel-options"
          error={errors.fuelType?.message}
          {...register('fuelType')}
        />
        <Field
          label="Tipo"
          placeholder="Automóvel"
          list="vehicle-category-options"
          error={errors.category?.message}
          {...register('category')}
        />
        <Field
          label="Apelido (opcional)"
          placeholder="Ex.: Carro da família"
          error={errors.nickname?.message}
          {...register('nickname')}
        />
      </div>

      <datalist id="vehicle-fuel-options">
        {FUEL_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="vehicle-category-options">
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </Section>
  </>
);
