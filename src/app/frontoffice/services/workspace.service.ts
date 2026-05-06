import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TeamMember {
  freelancer_id: number;
  freelancer_name: string;
  freelancer_email: string;
  applied_at: Date;
}

export interface ChatMessage {
  id: number;
  milestone_id: number;
  user_id: number;
  user_name: string;
  user_type: 'company' | 'freelancer';
  message: string;
  created_at: Date;
}

export interface WorkSubmission {
  id: number;
  application_id: number;
  milestone_id: number;
  freelancer_id: number;
  freelancer_name?: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  status: 'pending' | 'approved' | 'revision_requested' | 'rejected';
  feedback?: string;
  submitted_at: Date;
  reviewed_at?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private apiUrl = environment.paymentsAdminBaseUrl;

  constructor(private http: HttpClient) {}

  // Team Members
  getTeamMembers(milestoneId: number): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.apiUrl}/milestones/${milestoneId}/team`);
  }

  // Chat
  getChatMessages(milestoneId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/milestones/${milestoneId}/chat`);
  }

  // Poll chat messages every 5 seconds
  pollChatMessages(milestoneId: number): Observable<ChatMessage[]> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() => this.getChatMessages(milestoneId))
    );
  }

  sendMessage(milestoneId: number, userId: number, userName: string, userType: 'company' | 'freelancer', message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/milestones/${milestoneId}/chat`, {
      user_id: userId,
      user_name: userName,
      user_type: userType,
      message
    });
  }

  // Work Submissions
  getSubmissions(milestoneId: number): Observable<WorkSubmission[]> {
    return this.http.get<WorkSubmission[]>(`${this.apiUrl}/milestones/${milestoneId}/submissions`);
  }

  getMySubmissions(freelancerId: number): Observable<WorkSubmission[]> {
    return this.http.get<WorkSubmission[]>(`${this.apiUrl}/freelancers/${freelancerId}/submissions`);
  }

  submitWork(submission: Partial<WorkSubmission>): Observable<any> {
    return this.http.post(`${this.apiUrl}/submissions`, submission);
  }

  updateSubmissionStatus(submissionId: number, status: string, feedback?: string, rating?: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/submissions/${submissionId}/status`, { status, feedback, rating });
  }
}
