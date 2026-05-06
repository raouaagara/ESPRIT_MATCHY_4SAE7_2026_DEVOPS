export interface Evenement {
  id?: number;
  title: string;
  description?: string;
  date: Date | string;
  location?: string;
  type: EvenementType;
  maxParticipants?: number;
  currentParticipants?: number;
  status?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export enum EvenementType {
  CERTIFICATION = 'CERTIFICATION',
  RECOMMENDATION = 'RECOMMENDATION',
  FREELANCE_OPPORTUNITY = 'FREELANCE_OPPORTUNITY',
  WORKSHOP = 'WORKSHOP',
  NETWORKING = 'NETWORKING',
  TRAINING = 'TRAINING'
}

export interface EvenementCreateDTO {
  title: string;
  description?: string;
  date: Date | string;
  location?: string;
  type: EvenementType;
  maxParticipants?: number;
}
