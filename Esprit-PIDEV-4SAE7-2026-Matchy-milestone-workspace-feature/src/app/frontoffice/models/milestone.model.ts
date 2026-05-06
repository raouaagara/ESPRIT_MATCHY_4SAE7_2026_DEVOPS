export interface ProjectMilestone {
  id: number;
  projectId: number;
  title: string;
  description: string;
  skills: string[];
  budget?: number;
  currency?: string;
  duration?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed';
  assignedFreelancerId?: number;
  applicationsCount: number;
  createdAt: Date;
}

export interface MilestoneApplication {
  id: number;
  milestoneId: number;
  projectId: number;
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
  cvUrl?: string;
  motivationLetter: string;
  yearsOfExperience: number;
  proposedBudget?: number;
  status: 'pending' | 'interview_scheduled' | 'interview_confirmed' | 'accepted' | 'rejected';
  appliedAt: Date;
  interview?: InterviewSchedule;
}

export interface InterviewSchedule {
  meetLink: string;
  date: Date;
  time: string;
  notes?: string;
  confirmedByFreelancer: boolean;
  scheduledAt: Date;
}
