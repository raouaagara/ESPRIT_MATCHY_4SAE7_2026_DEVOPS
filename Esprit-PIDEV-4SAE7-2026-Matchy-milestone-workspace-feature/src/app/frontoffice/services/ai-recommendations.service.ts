import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FreelancerRecommendation {
  freelancer_id: number;
  freelancer_name: string;
  freelancer_email: string;
  skills: string[];
  experience_years: number;
  hourly_rate: number;
  location: string;
  average_rating: number;
  success_rate: number;
  completed_projects: number;
  availability: string;
  match_score: number;
  matching_skills: string[];
  score_breakdown: {
    skills: number;
    experience: number;
    rating: number;
    successRate: number;
    availability: number;
  };
}

export interface ProjectRecommendation {
  id: number;
  company_name: string;
  project_title: string;
  description: string;
  budget: number;
  currency: string;
  category: string;
  skills: string[];
  location: string;
  deadline: string;
  match_score: number;
  matching_skills: string[];
  score_breakdown: {
    skills: number;
    experience: number;
    rating: number;
    successRate: number;
    availability: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiRecommendationsService {
  private apiUrl = environment.paymentsAdminBaseUrl;

  constructor(private http: HttpClient) {}

  getRecommendedFreelancers(projectId: number, limit: number = 10): Observable<FreelancerRecommendation[]> {
    return this.http.get<FreelancerRecommendation[]>(
      `${this.apiUrl}/projects/${projectId}/recommended-freelancers?limit=${limit}`
    );
  }

  getRecommendedProjects(freelancerId: number, limit: number = 10): Observable<ProjectRecommendation[]> {
    return this.http.get<ProjectRecommendation[]>(
      `${this.apiUrl}/freelancers/${freelancerId}/recommended-projects?limit=${limit}`
    );
  }
}
