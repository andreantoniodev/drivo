'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/shared/auth/AuthContext';
import { Alert, Button, DrivoLogo, Field } from '@/shared/design-system';
import { getApiErrorMessage, getApiErrorStatus } from '@/shared/services/errors';
import { LoginFormData, loginSchema } from '../schemas/login.schema';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data.email, data.password);
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 429) {
        setApiError(
          'Muitas tentativas consecutivas. Por segurança, aguarde alguns instantes antes de tentar novamente.',
        );
      } else if (status === 401) {
        setApiError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else {
        setApiError(getApiErrorMessage(error, 'Falha ao autenticar. Tente novamente mais tarde.'));
      }
    }
  };

  return (
    <div className="w-full max-w-[360px] flex flex-col items-center gap-8">
      <DrivoLogo width={89} height={28} />

      <div className="flex flex-col items-center gap-2 w-full text-center">
        <h1 className="text-[32px] font-bold tracking-[-0.8px] text-fg">Entrar no Drivo</h1>
        <p className="text-[15px] leading-[1.4] text-fg-muted">
          Seus veículos, documentos e dados em um só lugar.
        </p>
      </div>

      {apiError && <Alert className="w-full">{apiError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-8" noValidate>
        <div className="flex flex-col gap-4">
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full">
          Entrar
        </Button>
      </form>
    </div>
  );
};
