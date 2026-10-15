import React from 'react';
import { AuthShell } from '../components/AuthShell';
import { RegisterForm } from '../components/RegisterForm';

export const RegisterView: React.FC = () => {
  return (
    <AuthShell
      hero={{
        image: '/images/auth/register-hero.jpg',
        imageAlt: 'Sedan escuro em uma garagem de concreto',
        title: ['Cadastre uma vez.', 'O CRLV faz o resto.'],
        description: 'Importe o documento e os dados do veículo são preenchidos automaticamente.',
      }}
      footer={{
        question: 'Já tem uma conta?',
        linkLabel: 'Entrar',
        href: '/login',
      }}
    >
      <RegisterForm />
    </AuthShell>
  );
};
