'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field } from '@/shared/design-system';
import { getApiErrorStatus } from '@/shared/services/errors';
import { profileService } from '../services/profile.service';
import { PasswordFormValues, passwordSchema } from '../schemas/profile.schema';
import { FormFeedback } from './FormFeedback';
import { SettingsCardFooter } from './SettingsSection';

export const PasswordForm: React.FC = () => {
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
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async ({ currentPassword, newPassword }: PasswordFormValues) => {
    setFeedback(null);
    try {
      await profileService.updatePassword({ currentPassword, newPassword });
      reset();
      setFeedback({ kind: 'success', text: 'Senha alterada com sucesso.' });
    } catch (error) {
      if (getApiErrorStatus(error) === 401) {
        setError('currentPassword', {
          message: 'A senha atual está incorreta',
        });
      } else {
        setFeedback({
          kind: 'error',
          text: 'Não foi possível alterar a senha. Tente novamente.',
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="p-6 flex flex-col gap-[18px]">
        <Field
          label="Senha atual"
          fieldVariant="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Nova senha"
            fieldVariant="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Field
            label="Confirmar nova senha"
            fieldVariant="password"
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
      </div>

      <SettingsCardFooter
        message={<FormFeedback feedback={feedback} hint="Altere sua senha com segurança" />}
        action={
          <Button type="submit" variant="tonal" size="sm" isLoading={isSubmitting}>
            Alterar senha
          </Button>
        }
      />
    </form>
  );
};
