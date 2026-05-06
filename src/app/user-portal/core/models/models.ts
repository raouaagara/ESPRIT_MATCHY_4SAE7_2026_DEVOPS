export interface User {
  id?: string | number;  // string | number pour compatibilité avec les Long Java
  firstName?: string;
  lastName?: string;
  name: string; // computed: firstName + lastName
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'FREELANCER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatar?: string;
  bio?: string;
  skills?: string;
  location?: string;
  city?: string;
  rating?: number;
  projectsCount?: number;
  projects?: number;
  verified?: boolean;
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id?: number;
  title: string;
  description: string;
  clientId?: number;
  clientName?: string;
  clientEmail?: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DRAFT';
  budget?: number;
  budgetType?: string;
  currency?: string;
  requiredSkills?: string[];
  deadline?: string;
  proposalsCount?: number;
  applications?: number;
  duration?: string;
  experienceLevel?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
  deliveryLink?:    string;
deliveryMessage?: string;
clientFeedback?:  string;
acceptedProposalId?: number;
}

export interface Proposal {
  id?: number;
  projectId: number;
  projectTitle?: string;
  clientId?: number;
  clientEmail?: string;
  freelancerId?: string | number;
  freelancerName?: string;
  freelancerEmail?: string;
  coverLetter?: string;
  proposedBudget?: number;
  deliveryTime?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'COMPLETED';
  clientFeedback?: string;
  createdAt?: string;
}

export interface ProposalCategoryAnalytics {
  category: string;
  total: number;
  accepted: number;
  acceptanceRate: number;
}

export interface ProposalPerformanceAnalytics {
  totalProposals: number;
  acceptedProposals: number;
  globalAcceptanceRate: number;
  acceptanceByCategory: ProposalCategoryAnalytics[];
  averageClientResponseHours: number;
  bestSubmitWindow: {
    day: string;
    hour: number;
    sampleSize: number;
    basedOnAcceptedOnly: boolean;
  };
}

export interface ProposalOptimizerResult {
  totalScore: number;
  breakdown: {
    clarity: number;
    personalization: number;
    budgetCoherence: number;
    cta: number;
  };
  suggestions: string[];
}

export interface Notification {
  id?: number;
  recipientId: string | number;
  recipientEmail?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalFreelancers: number;
  totalAdmins: number;
  activeUsers: number;
  verifiedFreelancers: number;
  openProjects: number;
  completedProjects: number;
  totalProjects: number;
  verificationRate: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
export interface Wallet {
  id: number;
  userId: number;
  solde: number;
  soldeBloque: number;
  devise: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  sender: any;
  receiver: any;
  project: any;
  montant: number;
  commission: number;
  montantNet: number;
  type: 'ESCROW' | 'PAIEMENT' | 'REMBOURSEMENT' | 'COMMISSION';
  statut: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  description: string;
  createdAt: string;
}
export interface CompletenessResult {
  score: number;
  missing: string[];
}

export interface ReactivityResult {
  score: number;
  label: string;
  totalProposals: number;
  acceptedProposals: number;
}

export interface OverloadResult {
  activeProjects: number;
  threshold: number;
  overloaded: boolean;
}

export interface MarketStat {
  category: string;
  projectCount: number;
  candidateCount: number;
}

export interface AvailabilityResult {
  status: 'AVAILABLE' | 'PARTIAL' | 'BUSY';
  occupiedSlots: number;
  maxSlots: number;
  availableFrom: string;
}
