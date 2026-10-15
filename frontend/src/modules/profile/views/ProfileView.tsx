'use client';

import React from 'react';
import { useAuth } from '@/shared/auth/AuthContext';
import { getInitials } from '@/shared/utils/initials';
import { PasswordForm } from '../components/PasswordForm';
import { ProfileForm } from '../components/ProfileForm';
import { SettingsSection } from '../components/SettingsSection';

const formatMemberSince = (iso?: string) => {
  if (!iso) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
};

export const ProfileView: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const memberSince = formatMemberSince(user.createdAt);

  return (
    <main className="w-full max-w-[960px] mx-auto px-6 py-12">
      <div className="flex items-center gap-6 pb-10">
        <span
          aria-hidden
          className="w-[88px] h-[88px] rounded-full shrink-0 flex items-center justify-center text-[32px] font-semibold text-white bg-gradient-to-tr from-avatar from-[15%] to-[#7d7aff] to-[85%]"
        >
          {getInitials(user.name)}
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-[34px] font-bold tracking-[-0.9px] text-fg truncate">{user.name}</h1>
          <p className="text-[15px] text-fg-muted truncate">
            {user.email}
            {memberSince && ` · Membro desde ${memberSince}`}
          </p>
        </div>
      </div>

      <SettingsSection
        title="Informações pessoais"
        description="Seu nome aparece no app. O e-mail é usado para entrar e receber avisos."
      >
        <ProfileForm />
      </SettingsSection>

      <SettingsSection
        title="Senha"
        description="Use ao menos 8 caracteres, combinando letras e números. Você continuará conectado neste dispositivo."
      >
        <PasswordForm />
      </SettingsSection>

      <SettingsSection
        title="Conta"
        description="Encerre a sessão neste dispositivo quando terminar de usar o Drivo."
      >
        <button
          type="button"
          onClick={logout}
          className="w-full px-6 py-[18px] flex items-center gap-3.5 text-left hover:bg-white/[0.03] transition-colors"
        >
          <span className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-[15px] font-medium text-fg">Sair da conta</span>
            <span className="text-[13px] text-fg-muted">Encerra a sessão neste dispositivo</span>
          </span>
          <span className="text-sm font-medium text-accent">Sair</span>
        </button>
      </SettingsSection>
    </main>
  );
};
