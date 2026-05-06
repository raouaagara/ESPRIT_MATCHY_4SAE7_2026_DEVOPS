import { Component, OnInit } from '@angular/core';
import { CompanyProject } from '../models/project.model';
import { CompanyProjectsService } from '../services/company-projects.service';

@Component({
  selector: 'app-available-projects',
  templateUrl: './available-projects.component.html',
  styleUrls: ['./available-projects.component.scss']
})
export class AvailableProjectsComponent implements OnInit {
  projects: CompanyProject[] = [];
  filteredProjects: CompanyProject[] = [];
  searchTerm = '';
  selectedCategory = 'all';
  selectedStatus = 'open';

  categories = ['Web Development', 'Mobile Development', 'Design', 'Data Science', 'Marketing', 'Other'];

  constructor(private projectsService: CompanyProjectsService) {}

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
        p.companyName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchCategory = this.selectedCategory === 'all' || p.category === this.selectedCategory;
      const matchStatus = this.selectedStatus === 'all' || p.status === this.selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }

  onApply(project: CompanyProject): void {
    this.projectsService.incrementClickCount(project.id);
    alert(`Application submitted for: ${project.projectTitle}\n\nThe company will review your profile and contact you soon!`);
  }

  getStatusClass(status: string): string {
    return status;
  }
}
