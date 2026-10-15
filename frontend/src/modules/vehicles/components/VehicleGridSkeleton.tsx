import React from 'react';

export const VehicleGridSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        aria-hidden
        className="h-[408px] rounded-[22px] bg-surface overflow-hidden animate-pulse"
      >
        <div className="h-[216px] bg-surface-2" />
        <div className="p-6 pt-[22px] space-y-3">
          <div className="h-3 w-20 rounded bg-surface-2" />
          <div className="h-6 w-2/3 rounded bg-surface-2" />
          <div className="h-4 w-1/2 rounded bg-surface-2" />
        </div>
      </div>
    ))}
  </>
);
