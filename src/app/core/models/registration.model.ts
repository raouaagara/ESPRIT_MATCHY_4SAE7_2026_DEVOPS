export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Registration {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userId: number;
  evenementId: number;
  evenementTitle: string;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationCreate {
  firstName: string;
  lastName: string;
  email: string;
  userId?: number;
  evenementId: number;
}
