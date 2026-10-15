import { api } from '@/shared/services/api';
import { CreateVehicleInput, UpdateVehicleInput, Vehicle } from '../types';

export const vehiclesService = {
  async getAll(search?: string): Promise<Vehicle[]> {
    const params = search ? { search } : {};
    const { data } = await api.get<Vehicle[]>('/vehicles', { params });
    return data;
  },

  async getById(id: string): Promise<Vehicle> {
    const { data } = await api.get<Vehicle>(`/vehicles/${id}`);
    return data;
  },

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const { data } = await api.post<Vehicle>('/vehicles', input);
    return data;
  },

  async update(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
    const { data } = await api.patch<Vehicle>(`/vehicles/${id}`, input);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },
};
