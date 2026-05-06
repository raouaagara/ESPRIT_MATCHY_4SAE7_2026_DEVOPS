import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CompanyProject } from '../models/project.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyProjectsService {
  private apiUrl = environment.paymentsAdminBaseUrl;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<CompanyProject[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects`).pipe(
      map(projects => projects.map(p => this.mapProject(p)))
    );
  }

  getProjectById(id: number): Observable<CompanyProject> {
    return this.http.get<any>(`${this.apiUrl}/projects/${id}`).pipe(
      map(p => this.mapProject(p))
    );
  }

  incrementClickCount(projectId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/projects/${projectId}/increment-clicks`, {});
  }

  addProject(project: Partial<CompanyProject>): Observable<any> {
    const payload = {
      company_name: project.companyName,
      project_title: project.projectTitle,
      description: project.description,
      details_of_work: project.detailsOfWork,
      number_of_people_demanded: project.numberOfPeopleDemanded,
      budget: project.budget,
      currency: project.currency || 'TND',
      category: project.category,
      status: project.status || 'open',
      skills: project.skills || [],
      location: project.location,
      deadline: project.deadline
    };
    return this.http.post(`${this.apiUrl}/projects`, payload);
  }

  updateProject(id: number, updatedProject: Partial<CompanyProject>): Observable<any> {
    const payload: any = {};
    if (updatedProject.companyName) payload.company_name = updatedProject.companyName;
    if (updatedProject.projectTitle) payload.project_title = updatedProject.projectTitle;
    if (updatedProject.description) payload.description = updatedProject.description;
    if (updatedProject.detailsOfWork) payload.details_of_work = updatedProject.detailsOfWork;
    if (updatedProject.numberOfPeopleDemanded) payload.number_of_people_demanded = updatedProject.numberOfPeopleDemanded;
    if (updatedProject.budget !== undefined) payload.budget = updatedProject.budget;
    if (updatedProject.currency) payload.currency = updatedProject.currency;
    if (updatedProject.category) payload.category = updatedProject.category;
    if (updatedProject.status) payload.status = updatedProject.status;
    if (updatedProject.skills) payload.skills = updatedProject.skills;
    if (updatedProject.location) payload.location = updatedProject.location;
    if (updatedProject.deadline) payload.deadline = updatedProject.deadline;
    
    return this.http.put(`${this.apiUrl}/projects/${id}`, payload);
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/projects/${id}`);
  }

  private mapProject(p: any): CompanyProject {
    return {
      id: p.id,
      companyName: p.company_name,
      projectTitle: p.project_title,
      description: p.description,
      detailsOfWork: p.details_of_work,
      numberOfPeopleDemanded: p.number_of_people_demanded,
      budget: p.budget,
      currency: p.currency,
      category: p.category,
      status: p.status,
      clickCount: p.click_count || 0,
      applicationsCount: p.applicationsCount || 0,
      createdAt: new Date(p.created_at),
      deadline: p.deadline ? new Date(p.deadline) : undefined,
      skills: p.skills || [],
      location: p.location
    };
  }
}
