'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { vehiclesService } from '../services/vehicles.service';
import { Vehicle } from '@/modules/vehicles/types';

export type VehiclesStatus = 'loading' | 'success' | 'error';

export function useVehicles(search: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [status, setStatus] = useState<VehiclesStatus>('loading');
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const current = ++requestId.current;
    const key = `${search}|${reloadKey}`;

    vehiclesService
      .getAll(search || undefined)
      .then((data) => {
        if (current !== requestId.current) return;
        setVehicles(data);
        if (!search) setTotal(data.length);
        setStatus('success');
        setSettledKey(key);
      })
      .catch(() => {
        if (current !== requestId.current) return;
        setStatus('error');
        setSettledKey(key);
      });
  }, [search, reloadKey]);

  const reload = useCallback(() => {
    setStatus('loading');
    setReloadKey((key) => key + 1);
  }, []);

  const isRefreshing = settledKey !== `${search}|${reloadKey}`;

  return {
    vehicles,
    total: total ?? vehicles.length,
    status,
    isRefreshing,
    reload,
  };
}
