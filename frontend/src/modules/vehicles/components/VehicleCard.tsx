import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PlateBadge } from './PlateBadge';
import { cn } from '@/lib/utils';
import { DrivoLogo } from '@/shared/design-system';
import { useAuthedImage } from '@/shared/hooks/useAuthedImage';
import { Vehicle } from '../types';

export interface VehicleCardProps {
  vehicle: Vehicle;
  className?: string;
}

const SWATCHES: Record<string, string> = {
  prata: '#c0c0c6',
  preto: '#000000',
  branco: '#f5f5f7',
  cinza: '#8e8e93',
  azul: '#2563eb',
  vermelho: '#ff453a',
  verde: '#30d158',
  amarelo: '#ffd60a',
  laranja: '#ff9f0a',
  marrom: '#8b5a2b',
  bege: '#d9c7a3',
  dourado: '#d4af37',
  vinho: '#7b1e3a',
};

const swatchColor = (color?: string | null) => {
  const key = (color ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  return SWATCHES[key] ?? '#6e6e73';
};

const maskChassi = (chassi?: string | null) => {
  if (!chassi) return '—';
  if (chassi.length <= 7) return chassi;
  return `${chassi.slice(0, 3)}•••••••${chassi.slice(-4)}`;
};

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, className }) => {
  const { src: photoSrc, isLoading: isPhotoLoading } = useAuthedImage(vehicle.imageUrl);

  const meta = [
    vehicle.color,
    `${vehicle.yearFabrication}/${vehicle.yearModel}`,
    vehicle.fuelType,
  ].filter(Boolean);

  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className={cn(
        'group flex flex-col bg-surface rounded-[22px] overflow-hidden select-none',
        'focus-visible:outline-2 focus-visible:outline-accent',
        className,
      )}
    >
      <div className="relative h-[216px] w-full bg-surface-2 overflow-hidden">
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              isPhotoLoading && 'animate-pulse',
            )}
          >
            <DrivoLogo width={140} height={44} alt="" className="opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-transparent to-40% pointer-events-none" />
      </div>

      <div className="flex flex-col gap-5 pt-[22px] pb-6 px-6">
        <div className="flex flex-col gap-[3px]">
          <span className="text-xs font-semibold tracking-[1.2px] uppercase text-fg-subtle">
            {vehicle.brand}
          </span>

          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[22px] font-semibold tracking-[-0.4px] text-fg truncate">
              {vehicle.model}
            </h3>
            <PlateBadge plate={vehicle.plate} className="shrink-0" />
          </div>

          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <span
              aria-hidden
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-surface-4"
              style={{ backgroundColor: swatchColor(vehicle.color) }}
            />
            <span className="truncate">{meta.join(' · ')}</span>
          </div>
        </div>

        <div className="flex items-end gap-6 pt-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-[0.8px] text-fg-subtle">
              RENAVAM
            </span>
            <span className="font-mono text-[13px] font-medium text-fg truncate">
              {vehicle.renavam || '—'}
            </span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-[0.8px] text-fg-subtle">
              CHASSI
            </span>
            <span className="font-mono text-[13px] font-medium text-fg truncate">
              {maskChassi(vehicle.chassi)}
            </span>
          </div>
          <span className="w-8 h-8 rounded-full bg-surface-2 group-hover:bg-accent text-fg flex items-center justify-center transition-colors shrink-0">
            <ArrowRight className="w-4 h-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
};
