export interface CompanyProject {
  id: number;
  companyName: string;
  projectTitle: string;
  description: string;
  detailsOfWork: string;
  numberOfPeopleDemanded: number;
  budget?: number;
  currency?: string;
  category: string;
  status: 'open' | 'in_progress' | 'closed';
  clickCount: number;
  applicationsCount: number;
  createdAt: Date;
  deadline?: Date;
  skills?: string[];
  location?: string;
}
