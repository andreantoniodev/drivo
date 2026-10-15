import { api } from '@/shared/services/api';
import { CrlvDocument, CrlvExtractionResponse } from '../types';

export const crlvService = {
  async scan(file: File): Promise<CrlvExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<CrlvExtractionResponse>('/crlv/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },

  async attach(
    vehicleId: string,
    file?: File | null,
    metadata?: Partial<CrlvDocument>,
  ): Promise<CrlvDocument> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }

    const { data } = await api.post<CrlvDocument>(`/crlv/attach/${vehicleId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },

  async getByVehicle(vehicleId: string): Promise<CrlvDocument> {
    const { data } = await api.get<CrlvDocument>(`/crlv/${vehicleId}`);
    return data;
  },

  async download(vehicleId: string, fileName = 'CRLV_Documento.pdf'): Promise<void> {
    const response = await api.get(`/crlv/${vehicleId}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async remove(vehicleId: string): Promise<void> {
    await api.delete(`/crlv/${vehicleId}`);
  },
};
