import { Component, OnInit } from '@angular/core';

interface Milestone {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  description: string;
}

interface Project {
  id: number;
  title: string;
  client: string;
  totalBudget: number;
  currency: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  color: string;
  icon: string;
  milestones: Milestone[];
}

@Component({
  selector: 'app-projects-milestones',
  templateUrl: './projects-milestones.component.html',
  styleUrls: ['./projects-milestones.component.scss']
})
export class ProjectsMilestonesComponent implements OnInit {
  selectedProject: Project | null = null;

  projects: Project[] = [
    {
      id: 1, title: 'E-Commerce Mobile App', client: 'TechStart TN', totalBudget: 4500, currency: 'TND',
      progress: 65, status: 'active', color: '#4f6ef7', icon: '📱',
      milestones: [
        { id: 1, title: 'UI/UX Mockups', amount: 800, dueDate: '2025-02-10', status: 'completed', description: 'Design all app screens and prototype.' },
        { id: 2, title: 'Frontend Development', amount: 1500, dueDate: '2025-03-01', status: 'in_progress', description: 'Build React Native app with navigation.' },
        { id: 3, title: 'Backend & API', amount: 1200, dueDate: '2025-03-20', status: 'pending', description: 'REST API, database and auth integration.' },
        { id: 4, title: 'Testing & Launch', amount: 1000, dueDate: '2025-04-01', status: 'pending', description: 'QA testing, bug fixes, app store submission.' },
      ]
    },
    {
      id: 2, title: 'Restaurant Website', client: 'Chez Habib', totalBudget: 1800, currency: 'TND',
      progress: 100, status: 'completed', color: '#22c55e', icon: '🍽️',
      milestones: [
        { id: 1, title: 'Design & Wireframes', amount: 400, dueDate: '2025-01-10', status: 'completed', description: 'Site design and responsive mockups.' },
        { id: 2, title: 'Development', amount: 900, dueDate: '2025-01-20', status: 'completed', description: 'Full website development with CMS.' },
        { id: 3, title: 'Launch & SEO', amount: 500, dueDate: '2025-01-28', status: 'completed', description: 'Live deployment and basic SEO setup.' },
      ]
    },
  ];

  ngOnInit(): void {
    this.selectedProject = this.projects[0];
  }

  selectProject(p: Project): void {
    this.selectedProject = p;
  }

  getPaidAmount(project: Project): number {
    return project.milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.amount, 0);
  }

  getMilestoneStatusIcon(status: string): string {
    return { completed: '✅', in_progress: '🔄', pending: '⏳', overdue: '❌' }[status] || '⏳';
  }

  getMilestoneClass(status: string): string {
    return { completed: 'success', in_progress: 'primary', pending: 'muted', overdue: 'danger' }[status] || 'muted';
  }
}
