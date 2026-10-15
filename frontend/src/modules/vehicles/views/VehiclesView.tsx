'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Plus } from 'lucide-react';
import { Button, SearchInput } from '@/shared/design-system';
import { useVehicles } from '../hooks/useVehicles';
import { AddVehicleCard } from '../components/AddVehicleCard';
import { EmptyGarage } from '../components/EmptyGarage';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleGridSkeleton } from '../components/VehicleGridSkeleton';

const SEARCH_DEBOUNCE_MS = 300;

export const VehiclesView: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const { vehicles, total, status, isRefreshing, reload } = useVehicles(search);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  if (status === 'success' && total === 0 && !search) {
    return <EmptyGarage />;
  }

  return (
    <main className="flex flex-col gap-8 px-6 md:px-20 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-4">
            <h1 className="text-[40px] font-bold tracking-[-1.2px] text-fg">Meus veículos</h1>
            <Link
              href="/veiculos/novo"
              aria-label="Adicionar veículo"
              className="w-10 h-10 rounded-full bg-accent hover:bg-accent-hover active:bg-accent-pressed flex items-center justify-center text-white transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <p className="text-[15px] text-fg-muted">
            {status === 'loading'
              ? 'Carregando veículos…'
              : `${total} ${total === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}`}
          </p>
        </div>

        <SearchInput
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por placa ou modelo"
          aria-label="Buscar veículo por placa ou modelo"
          className="md:w-[320px]"
        />
      </div>

      {status === 'error' ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 py-16 text-center text-fg-muted"
        >
          <AlertCircle className="w-8 h-8 text-danger" aria-hidden />
          <p className="text-[15px]">Não foi possível carregar seus veículos.</p>
          <Button type="button" variant="secondary" onClick={reload}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div
          aria-busy={status === 'loading' || isRefreshing}
          className={`grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 transition-opacity ${
            isRefreshing && status === 'success' ? 'opacity-60' : ''
          }`}
        >
          {status === 'loading' ? (
            <VehicleGridSkeleton />
          ) : vehicles.length === 0 ? (
            <p className="col-span-full py-16 text-center text-[15px] text-fg-muted">
              Nenhum veículo encontrado para “{search}”.
            </p>
          ) : (
            <>
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
              {!search && <AddVehicleCard />}
            </>
          )}
        </div>
      )}
    </main>
  );
};
