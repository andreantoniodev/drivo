'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field } from '@/shared/design-system';
import { useAuth } from '@/shared/auth/AuthContext';
import { getApiErrorStatus } from '@/shared/services/errors';
import { profileService } from '../services/profile.service';
import { joinName, ProfileFormValues, profileSchema, splitName } from '../schemas/profile.schema';
import { FormFeedback } from './FormFeedback';
import { SettingsCardFooter } from './SettingsSection';

export const ProfileForm: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { ...splitName(user?.name ?? ''), email: user?.email ?? '' },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setFeedback(null);
    const name = joinName(values.firstName, values.lastName);

    if (name.length < 2) {
      setError('firstName', {
        message: 'O nome deve ter no mínimo 2 caracteres',
      });
      return;
    }

    try {
      const updated = await profileService.updateProfile({
        name,
        email: values.email,
      });
      await refreshUser();
      reset({ ...splitName(updated.name), email: updated.email });
      setFeedback({ kind: 'success', text: 'Alterações salvas.' });
    } catch (error) {
      if (getApiErrorStatus(error) === 409) {
        setError('email', {
          message: 'Este e-mail já está em uso por outra conta',
        });
      } else {
        setFeedback({
          kind: 'error',
          text: 'Não foi possível salvar. Tente novamente.',
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="p-6 flex flex-col gap-[18px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Nome"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Field
            label="Sobrenome"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <SettingsCardFooter
        message={
          <FormFeedback feedback={feedback} hint="Alterações salvas ficam visíveis na hora." />
        }
        action={
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Salvar
          </Button>
        }
      />
    </form>
  );
};
