'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiErrorStatus } from '@/shared/services/errors';
import { vehiclesService } from '../services/vehicles.service';
import { Vehicle } from '../types';

type VehicleState =
  | { status: 'loading'; vehicle: null }
  | { status: 'ready'; vehicle: Vehicle }
  | { status: 'not-found' | 'error'; vehicle: null };

export function useVehicle(id: string) {
  const [state, setState] = useState<VehicleState>({
    status: 'loading',
    vehicle: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    vehiclesService
      .getById(id)
      .then((vehicle) => {
        if (!cancelled) setState({ status: 'ready', vehicle });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          status: getApiErrorStatus(error) === 404 ? 'not-found' : 'error',
          vehicle: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const reload = useCallback(() => {
    setState({ status: 'loading', vehicle: null });
    setReloadKey((key) => key + 1);
  }, []);

  return { ...state, reload };
}
