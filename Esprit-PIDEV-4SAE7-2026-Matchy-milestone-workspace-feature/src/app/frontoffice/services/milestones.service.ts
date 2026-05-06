import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProjectMilestone, MilestoneApplication, InterviewSchedule } from '../models/milestone.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MilestonesService {
  private apiUrl = environment.paymentsAdminBaseUrl;

  constructor(private http: HttpClient) {}

  getMilestonesByProjectId(projectId: number): Observable<ProjectMilestone[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects/${projectId}/milestones`).pipe(
      map(milestones => milestones.map(m => this.mapMilestone(m)))
    );
  }

  getMilestoneById(id: number): Observable<ProjectMilestone | undefined> {
    return this.http.get<any[]>(`${this.apiUrl}/milestones`).pipe(
      map(milestones => {
        const milestone = milestones.find(m => m.id === id);
        return milestone ? this.mapMilestone(milestone) : undefined;
      })
    );
  }

  getAllMilestones(): Observable<ProjectMilestone[]> {
    return this.http.get<any[]>(`${this.apiUrl}/milestones`).pipe(
      map(milestones => milestones.map(m => this.mapMilestone(m)))
    );
  }

  addMilestone(milestone: Partial<ProjectMilestone>): Observable<any> {
    const payload = {
      project_id: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      skills: milestone.skills || [],
      budget: milestone.budget,
      currency: milestone.currency || 'TND',
      duration: milestone.duration,
      status: milestone.status || 'open'
    };
    return this.http.post(`${this.apiUrl}/milestones`, payload);
  }

  updateMilestone(id: number, updatedMilestone: Partial<ProjectMilestone>): Observable<any> {
    const payload: any = {};
    if (updatedMilestone.title) payload.title = updatedMilestone.title;
    if (updatedMilestone.description) payload.description = updatedMilestone.description;
    if (updatedMilestone.skills) payload.skills = updatedMilestone.skills;
    if (updatedMilestone.budget !== undefined) payload.budget = updatedMilestone.budget;
    if (updatedMilestone.currency) payload.currency = updatedMilestone.currency;
    if (updatedMilestone.duration) payload.duration = updatedMilestone.duration;
    if (updatedMilestone.status) payload.status = updatedMilestone.status;
    
    return this.http.put(`${this.apiUrl}/milestones/${id}`, payload);
  }

  deleteMilestone(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/milestones/${id}`);
  }

  // Applications Management
  submitApplication(application: Omit<MilestoneApplication, 'id' | 'appliedAt' | 'status'>): Observable<any> {
    const payload = {
      milestone_id: application.milestoneId,
      project_id: application.projectId,
      freelancer_id: application.freelancerId,
      freelancer_name: application.freelancerName,
      freelancer_email: application.freelancerEmail,
      cv_url: application.cvUrl,
      motivation_letter: application.motivationLetter,
      years_of_experience: application.yearsOfExperience,
      proposed_budget: application.proposedBudget
    };
    return this.http.post(`${this.apiUrl}/applications`, payload);
  }

  getApplicationsByMilestone(milestoneId: number): Observable<MilestoneApplication[]> {
    return this.http.get<any[]>(`${this.apiUrl}/milestones/${milestoneId}/applications`).pipe(
      map(apps => apps.map(a => this.mapApplication(a)))
    );
  }

  getApplicationsByProject(projectId: number): Observable<MilestoneApplication[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects/${projectId}/applications`).pipe(
      map(apps => apps.map(a => this.mapApplication(a)))
    );
  }

  getApplicationsByFreelancer(freelancerId: number): Observable<MilestoneApplication[]> {
    return this.http.get<any[]>(`${this.apiUrl}/freelancers/${freelancerId}/applications`).pipe(
      map(apps => apps.map(a => this.mapApplication(a)))
    );
  }

  updateApplicationStatus(applicationId: number, status: 'pending' | 'accepted' | 'rejected'): Observable<any> {
    return this.http.put(`${this.apiUrl}/applications/${applicationId}/status`, { status });
  }

  scheduleInterview(applicationId: number, interview: Omit<InterviewSchedule, 'confirmedByFreelancer' | 'scheduledAt'>): Observable<any> {
    const payload = {
      meet_link: interview.meetLink,
      interview_date: interview.date,
      interview_time: interview.time,
      notes: interview.notes
    };
    return this.http.post(`${this.apiUrl}/applications/${applicationId}/interview`, payload);
  }

  confirmInterview(applicationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${applicationId}/confirm-interview`, {});
  }

  private mapMilestone(m: any): ProjectMilestone {
    return {
      id: m.id,
      projectId: m.project_id,
      title: m.title,
      description: m.description,
      skills: m.skills || [],
      budget: m.budget,
      currency: m.currency,
      duration: m.duration,
      status: m.status,
      assignedFreelancerId: m.assigned_freelancer_id,
      applicationsCount: m.applicationsCount || 0,
      createdAt: new Date(m.created_at)
    };
  }

  private mapApplication(a: any): MilestoneApplication {
    const app: MilestoneApplication = {
      id: a.id,
      milestoneId: a.milestone_id,
      projectId: a.project_id,
      freelancerId: a.freelancer_id,
      freelancerName: a.freelancer_name,
      freelancerEmail: a.freelancer_email,
      cvUrl: a.cv_url,
      motivationLetter: a.motivation_letter,
      yearsOfExperience: a.years_of_experience,
      proposedBudget: a.proposed_budget,
      status: a.status,
      appliedAt: new Date(a.applied_at)
    };

    if (a.interview) {
      app.interview = {
        meetLink: a.interview.meetLink,
        date: new Date(a.interview.date),
        time: a.interview.time,
        notes: a.interview.notes,
        confirmedByFreelancer: a.interview.confirmedByFreelancer,
        scheduledAt: new Date(a.interview.scheduledAt)
      };
    }

    return app;
  }
}
