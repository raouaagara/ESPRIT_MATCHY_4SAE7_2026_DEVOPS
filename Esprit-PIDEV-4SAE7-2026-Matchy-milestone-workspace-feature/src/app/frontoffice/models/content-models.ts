export interface User {
  userId?: number;
  id?: number;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  role: "ADMIN" | "CLIENT" | "FREELANCER" | string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;
  avatar?: string;
  bio?: string;
  skills?: string;
  location?: string;
  city?: string;
  plan?: string;
  verified?: boolean;
  rating?: number;
  projectsCount?: number;
  projects?: number;
  badge?: string;
  badges?: string[];
  createdAt?: string;
  updatedAt?: string;
  joined?: string;
}

export interface Project {
  projectId?: number;
  name: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  budget?: number;
  currency?: string;
  applications?: number;
  rating?: number;
  createdAt?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalAssessments: number;
  completedAssessments: number;
  totalClients: number;
  totalFreelancers: number;
  verifiedFreelancers: number;
  openProjects: number;
  completedProjects: number;
  totalProjects: number;
  verificationRate: number;
}

export interface Content {
  contentId?: number;
  title: string;
  description: string;
  type: "COURS" | "ARTICLE" | "VIDEO";
  level: "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE";
  createdAt?: string;
  updatedAt?: string;
  authorId?: number;
  assessment?: Assessment;
}

export interface Assessment {
  assessmentId?: number;
  questions: string; // JSON string avec format Question[]
  passingScore: number;
  duration: number;
  contentId?: number;
  content?: { contentId?: number; title?: string };
  contentTitle?: string;
}

// Nouveaux interfaces pour le système de questions
export interface Question {
  question: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface AssessmentResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  passed: boolean;
  passingScore: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Proposal {
  id?: number;
  projectId: number;
  projectTitle?: string;
  clientId?: number;
  clientEmail?: string;
  freelancerId?: number;
  freelancerName?: string;
  freelancerEmail?: string;
  coverLetter?: string;
  proposedBudget?: number;
  deliveryTime?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  clientFeedback?: string;
  createdAt?: string;
}

export interface Notification {
  id?: number;
  recipientId: number;
  recipientEmail?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
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
  type: "ESCROW" | "PAIEMENT" | "REMBOURSEMENT" | "COMMISSION";
  statut: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  description: string;
  createdAt: string;
}

export * from "./favorite.model";
