import { Metadata } from 'next';
import { RegisterView } from '@/modules/auth/views/RegisterView';

export const metadata: Metadata = {
  title: 'Criar conta — DRIVO',
  description:
    'Crie sua conta para montar sua garagem e importar CRLVs com Inteligência Artificial.',
};

export default function RegisterPage() {
  return <RegisterView />;
}
