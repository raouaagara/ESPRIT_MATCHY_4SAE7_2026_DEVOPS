export interface CashOffice {
  id: string;
  label: string;
  address: string;
}

export const CASH_OFFICES: CashOffice[] = [
  { id: 'tunis-hb', label: 'Tunis — Av. Habib Bourguiba', address: 'Tunis, 1000' },
  { id: 'sfax', label: 'Sfax — Route de l’Aéroport', address: 'Sfax, 3000' },
  { id: 'sousse', label: 'Sousse — Port El Kantaoui', address: 'Sousse, 4000' },
  { id: 'bizerte', label: 'Bizerte — Centre-ville', address: 'Bizerte, 7000' }
];
