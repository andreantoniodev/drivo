export interface CrlvDocument {
  id: string;
  vehicleId: string;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  numeroCrLV?: string | null;
  codigoSeguranca?: string | null;
  exercicio?: number | null;
  dataEmissao?: string | null;
  nomeProprietario?: string | null;
  cpfCnpjProprietario?: string | null;
  localRegistro?: string | null;
  scannedAt?: string;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  plate: string;
  renavam?: string | null;
  chassi?: string | null;
  yearFabrication: number;
  yearModel: number;
  color?: string | null;
  fuelType?: string | null;
  category?: string | null;
  mileage?: number | null;
  nickname?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  crlv?: CrlvDocument | null;
}

export interface CreateVehicleInput {
  brand: string;
  model: string;
  plate: string;
  renavam?: string | null;
  chassi?: string | null;
  yearFabrication: number;
  yearModel: number;
  color?: string | null;
  fuelType?: string | null;
  category?: string | null;
  mileage?: number | null;
  nickname?: string | null;
  imageUrl?: string | null;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export interface CrlvExtractionResponse {
  vehicle: {
    brand: string;
    model: string;
    plate: string;
    renavam?: string | null;
    chassi?: string | null;
    yearFabrication?: number | null;
    yearModel?: number | null;
    color?: string | null;
    fuelType?: string | null;
    category?: string | null;
  };
  document: {
    numeroCrLV?: string | null;
    codigoSeguranca?: string | null;
    exercicio?: number | null;
    dataEmissao?: string | null;
    nomeProprietario?: string | null;
    cpfCnpjProprietario?: string | null;
    localRegistro?: string | null;
  };
  fileName: string;
  fileType: string;
  fileSize: number;
  isMock: boolean;
}
