import { Metadata } from 'next';
import { ProfileView } from '@/modules/profile/views/ProfileView';

export const metadata: Metadata = {
  title: 'Perfil — DRIVO',
};

export default function ProfilePage() {
  return <ProfileView />;
}
