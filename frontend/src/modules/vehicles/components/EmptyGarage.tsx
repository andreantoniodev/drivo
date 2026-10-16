import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/design-system';

export const EmptyGarage: React.FC = () => (
  <div className="flex-1 flex items-center justify-center px-6 pb-16">
    <div className="w-full max-w-[440px] flex flex-col items-center gap-7 text-center">
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="text-[28px] font-bold tracking-[-0.6px] text-fg">Sua garagem está vazia</h1>
        <p className="text-[15px] leading-[1.45] text-fg-muted">
          Adicione seu primeiro veículo. Com o CRLV em mãos, a maior parte dos dados é preenchida
          automaticamente.
        </p>
      </div>
      <Link href="/vehicles/new?import=crlv">
        <Button>Importar CRLV</Button>
      </Link>
    </div>
  </div>
);
