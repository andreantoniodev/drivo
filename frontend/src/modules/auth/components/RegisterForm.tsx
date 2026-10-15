'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/shared/auth/AuthContext';
import { Alert, Button, DrivoLogo, Field } from '@/shared/design-system';
import { getApiErrorMessage, getApiErrorStatus } from '@/shared/services/errors';
import { RegisterFormData, registerSchema } from '../schemas/register.schema';

export const RegisterForm: React.FC = () => {
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ name, email, password }: RegisterFormData) => {
    setApiError(null);
    try {
      await registerUser(name, email, password);
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 409) {
        setApiError('Este e-mail já está cadastrado. Tente entrar na sua conta.');
      } else if (status === 429) {
        setApiError(
          'Muitas tentativas consecutivas. Por segurança, aguarde alguns instantes antes de tentar novamente.',
        );
      } else {
        setApiError(
          getApiErrorMessage(error, 'Falha ao criar a conta. Tente novamente mais tarde.'),
        );
      }
    }
  };

  return (
    <div className="w-full max-w-[360px] flex flex-col items-center gap-8">
      <DrivoLogo width={89} height={28} />

      <div className="flex flex-col items-center gap-2 w-full text-center">
        <h1 className="text-[32px] font-bold tracking-[-0.8px] text-fg">Criar sua conta</h1>
        <p className="text-[15px] leading-[1.4] text-fg-muted">
          Leva menos de um minuto. Depois é só adicionar seus veículos.
        </p>
      </div>

      {apiError && <Alert className="w-full">{apiError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-8" noValidate>
        <div className="flex flex-col gap-4">
          <Field
            label="Nome completo"
            placeholder="Mariana Costa"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
          <Field
            label="E-mail"
            type="email"
            placeholder="mariana.costa@email.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Field
            label="Senha"
            fieldVariant="password"
            placeholder="••••••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Field
            label="Confirmar senha"
            fieldVariant="password"
            placeholder="••••••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full">
          Criar conta
        </Button>
      </form>
    </div>
  );
};
