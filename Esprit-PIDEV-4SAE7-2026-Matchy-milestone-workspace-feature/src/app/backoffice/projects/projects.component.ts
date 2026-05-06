import { Component, OnInit } from '@angular/core';
import { Project } from '../../frontoffice/models/models';
import { CompanyProjectsService } from '../../frontoffice/services/company-projects.service';
import { CompanyProject } from '../../frontoffice/models/project.model';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchTerm = '';
  selectedStatus: string = 'all';
  isLoading = false;
  errorMessage = '';

  constructor(private readonly projectsService: CompanyProjectsService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projectsService.getProjects().subscribe({
      next: (list) => {
        this.projects = (list || []).map(p => this.toProject(p));
        this.filteredProjects = [...this.projects];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[BO projects] failed to load', err);
        this.errorMessage = 'Failed to load projects.';
        this.projects = [];
        this.filteredProjects = [];
        this.isLoading = false;
      }
    });
  }

  private toProject(p: CompanyProject): Project {
    const rawStatus = (p.status || 'open').toLowerCase();
    const allowed = ['open', 'in_progress', 'delivered', 'completed', 'cancelled'] as const;
    const status = (allowed as readonly string[]).includes(rawStatus)
      ? (rawStatus as Project['status'])
      : 'open';
    return {
      id: p.id as number,
      title: p.projectTitle || p.companyName || 'Untitled project',
      description: p.description || '',
      budget: Number(p.budget) || 0,
      currency: p.currency || 'TND',
      status,
      clientId: 0,
      category: p.category || '—',
      applications: Number((p as any).numberOfApplications ?? (p as any).applications ?? 0),
      rating: (p as any).rating != null ? Number((p as any).rating) : undefined,
      createdAt: (p as any).createdAt ? new Date((p as any).createdAt) : new Date(),
      deadline: p.deadline ? new Date(p.deadline) : undefined
    };
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projects.filter(p => {
      const matchSearch = !term ||
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);
      const matchStatus = this.selectedStatus === 'all' || p.status === this.selectedStatus;
      return matchSearch && matchStatus;
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      open: 'success',
      in_progress: 'primary',
      delivered: 'warning',
      completed: 'success',
      cancelled: 'danger'
    };
    return map[status] || 'primary';
  }
}
