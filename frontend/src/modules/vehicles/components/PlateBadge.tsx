import React from 'react';
import { cn } from '@/lib/utils';

export interface PlateBadgeProps {
  plate: string;
  className?: string;
}

export const PlateBadge: React.FC<PlateBadgeProps> = ({ plate, className }) => {
  const cleanPlate = (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  return (
    <div
      className={cn(
        'inline-flex flex-col w-[104px] bg-fg rounded-md overflow-hidden select-none',
        className,
      )}
    >
      <div className="h-[11px] bg-plate-band px-1.5 flex items-center justify-between">
        <span className="text-[6.5px] font-bold tracking-[1px] leading-none text-white">
          BRASIL
        </span>
        <span className="w-[9px] h-[6px] rounded-[1px] bg-plate-flag" />
      </div>
      <div className="flex justify-center pt-[3px] pb-1 font-mono text-[15px] font-bold tracking-[1.5px] leading-none text-[#111]">
        {cleanPlate}
      </div>
    </div>
  );
};
