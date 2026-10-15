import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const AddVehicleCard: React.FC = () => (
  <Link
    href="/veiculos/novo"
    className="min-h-[408px] flex flex-col items-center justify-center gap-3 p-6 rounded-[20px] border-2 border-dashed border-surface hover:border-surface-3 transition-colors text-center"
  >
    <span className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-fg">
      <Plus className="w-4 h-4" aria-hidden />
    </span>
    <span className="text-base font-semibold text-fg">Adicionar veículo</span>
    <span className="text-[13px] text-fg-muted">Preencha manualmente ou importe o CRLV</span>
  </Link>
);
