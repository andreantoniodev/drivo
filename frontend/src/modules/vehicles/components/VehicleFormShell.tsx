import React from 'react';
import Link from 'next/link';
import { Alert, Button } from '@/shared/design-system';

export interface VehicleFormShellProps {
  title: string;
  summary: string;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  apiError?: string | null;
  aside: React.ReactNode;
  children: React.ReactNode;
}

export const VehicleFormShell: React.FC<VehicleFormShellProps> = ({
  title,
  summary,
  submitLabel,
  isSubmitting,
  onSubmit,
  apiError,
  aside,
  children,
}) => (
  <form onSubmit={onSubmit} noValidate>
    <main className="flex flex-col gap-8 px-6 md:px-20 pt-10 pb-36">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="text-sm text-accent hover:text-accent-hover w-fit transition-colors"
        >
          Voltar
        </Link>
        <h1 className="text-[40px] font-bold tracking-[-1.2px] text-fg">{title}</h1>
      </div>

      {apiError && <Alert>{apiError}</Alert>}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full flex-1 min-w-0 flex flex-col gap-6">{children}</div>
        <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">{aside}</aside>
      </div>
    </main>

    <div className="fixed bottom-0 inset-x-0 z-30 bg-surface/80 backdrop-blur-[12px] px-6 md:px-20 py-4 flex items-center justify-between gap-4">
      <p className="text-sm text-fg-muted truncate">{summary}</p>
      <div className="flex gap-3 shrink-0">
        <Link href="/">
          <Button type="button" variant="secondary" className="w-[140px] sm:w-[180px]">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" isLoading={isSubmitting} className="w-[160px] sm:w-[180px]">
          {submitLabel}
        </Button>
      </div>
    </div>
  </form>
);
