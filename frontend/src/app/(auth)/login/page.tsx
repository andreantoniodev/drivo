import { Metadata } from 'next';
import { LoginView } from '@/modules/auth/views/LoginView';

export const metadata: Metadata = {
  title: 'Acesse sua conta — DRIVO',
  description:
    'Faça login para gerenciar seus veículos e escanear CRLVs com Inteligência Artificial.',
};

export default function LoginPage() {
  return <LoginView />;
}
