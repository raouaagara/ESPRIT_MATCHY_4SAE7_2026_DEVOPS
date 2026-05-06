// ============================================
// MATCHY - Core Models
// ============================================

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client' | 'freelancer';
  avatar?: string;
  rating?: number;
  status: 'active' | 'inactive' | 'banned';
  verified: boolean;
  city?: string;
  projects?: number;
  badge?: string;
  createdAt: Date;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  budget: number;
  currency: string;
  status: 'open' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';
  clientId: number;
  freelancerId?: number;
  category: string;
  applications: number;
  rating?: number;
  createdAt: Date;
  deadline?: Date;
}

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalFreelancers: number;
  verifiedFreelancers: number;
  openProjects: number;
  completedProjects: number;
  totalProjects: number;
  verificationRate: number;
}

export interface KpiDataPoint {
  label: string;
  value: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  total?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
