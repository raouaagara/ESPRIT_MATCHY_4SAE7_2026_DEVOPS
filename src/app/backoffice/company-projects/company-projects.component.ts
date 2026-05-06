import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyProject } from '../../frontoffice/models/project.model';
import { CompanyProjectsService } from '../../frontoffice/services/company-projects.service';

@Component({
  selector: 'app-company-projects',
  templateUrl: './company-projects.component.html',
  styleUrls: ['./company-projects.component.scss']
})
export class CompanyProjectsComponent implements OnInit {
  projects: CompanyProject[] = [];
  filteredProjects: CompanyProject[] = [];
  searchTerm = '';
  selectedStatus = 'all';
  selectedCategory = 'all';

  showModal = false;
  isEditMode = false;
  currentProject: Partial<CompanyProject> = {};

  categories = ['Web Development', 'Mobile Development', 'Design', 'Data Science', 'Marketing', 'Other'];

  constructor(private projectsService: CompanyProjectsService, private router: Router) {}

  ngOnInit(): void {
    this.projectsService.getProjects().subscribe(projects => {
      this.projects = projects;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.filteredProjects = this.projects.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.projectTitle.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.companyName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = this.selectedStatus === 'all' || p.status === this.selectedStatus;
      const matchCategory = this.selectedCategory === 'all' || p.category === this.selectedCategory;
      return matchSearch && matchStatus && matchCategory;
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentProject = {
      companyName: '',
      projectTitle: '',
      description: '',
      detailsOfWork: '',
      numberOfPeopleDemanded: 1,
      budget: 0,
      currency: 'TND',
      category: 'Web Development',
      status: 'open',
      skills: [],
      location: ''
    };
    this.showModal = true;
  }

  openEditModal(project: CompanyProject): void {
    this.isEditMode = true;
    this.currentProject = { ...project };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentProject = {};
  }

  saveProject(): void {
    if (this.isEditMode && this.currentProject.id) {
      this.projectsService.updateProject(this.currentProject.id, this.currentProject).subscribe(() => {
        this.loadProjects();
        this.closeModal();
      });
    } else {
      this.projectsService.addProject(this.currentProject).subscribe(() => {
        this.loadProjects();
        this.closeModal();
      });
    }
  }

  deleteProject(id: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectsService.deleteProject(id).subscribe(() => {
        this.loadProjects();
      });
    }
  }

  private loadProjects(): void {
    this.projectsService.getProjects().subscribe(projects => {
      this.projects = projects;
      this.applyFilters();
    });
  }

  getStatusClass(status: string): string {
    return status;
  }

  parseSkills(skillsString: string): string[] {
    return skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  getSkillsString(skills?: string[]): string {
    return skills ? skills.join(', ') : '';
  }

  reviewApplications(projectId: number): void {
    this.router.navigate(['/backoffice/company-projects', projectId, 'review']);
  }

  getTotalViews(): number {
    return this.projects.reduce((sum, p) => sum + p.clickCount, 0);
  }

  getTotalApplications(): number {
    return this.projects.reduce((sum, p) => sum + p.applicationsCount, 0);
  }

  getOpenProjectsCount(): number {
    return this.projects.filter(p => p.status === 'open').length;
  }
}
