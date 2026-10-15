import React from 'react';
import { AuthShell } from '../components/AuthShell';
import { LoginForm } from '../components/LoginForm';

export const LoginView: React.FC = () => {
  return (
    <AuthShell
      hero={{
        image: '/images/auth/login-hero.jpg',
        imageAlt: 'Aston Martin Vantage',
        title: ['Sua garagem,', 'sempre à mão.'],
        description: 'Placa, Renavam e licenciamento de todos os seus veículos em um só lugar.',
      }}
      footer={{
        question: 'Ainda não tem conta?',
        linkLabel: 'Criar conta',
        href: '/register',
      }}
    >
      <LoginForm />
    </AuthShell>
  );
};
