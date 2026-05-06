import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MilestoneApplication, ProjectMilestone } from '../models/milestone.model';
import { CompanyProject } from '../models/project.model';
import { MilestonesService } from '../services/milestones.service';
import { CompanyProjectsService } from '../services/company-projects.service';
import { AuthService } from '../services/auth.service';
import { WorkspaceService, ChatMessage, TeamMember, WorkSubmission } from '../services/workspace.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-applications',
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit, OnDestroy {
  applications: MilestoneApplication[] = [];
  filteredApplications: MilestoneApplication[] = [];
  selectedStatus = 'all';
  milestones: Map<number, ProjectMilestone> = new Map();
  projects: Map<number, CompanyProject> = new Map();

  // Workspace features
  selectedApplication?: MilestoneApplication;
  showWorkspace = false;
  activeTab: 'overview' | 'chat' | 'submit' | 'submissions' = 'overview';
  
  // Chat
  chatMessages: ChatMessage[] = [];
  newMessage = '';
  teamMembers: TeamMember[] = [];
  private chatSubscription?: Subscription;

  // Work submission
  submissionForm = {
    title: '',
    description: '',
    file_url: '',
    file_name: '',
    file_type: ''
  };
  mySubmissions: WorkSubmission[] = [];

  constructor(
    private milestonesService: MilestonesService,
    private projectsService: CompanyProjectsService,
    public authService: AuthService,
    private workspaceService: WorkspaceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated || !this.authService.currentUser) {
      this.router.navigate(['/backoffice/login']);
      return;
    }

    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  loadData(): void {
    if (this.authService.currentUser) {
      this.projectsService.getProjects().subscribe(projects => {
        projects.forEach(p => this.projects.set(p.id, p));
      });

      this.milestonesService.getAllMilestones().subscribe(milestones => {
        milestones.forEach(m => this.milestones.set(m.id, m));
      });

      this.milestonesService.getApplicationsByFreelancer(this.authService.currentUser.id).subscribe(applications => {
        this.applications = applications;
        this.applyFilters();
      });
    }
  }

  applyFilters(): void {
    this.filteredApplications = this.applications.filter(app => {
      const matchStatus = this.selectedStatus === 'all' || app.status === this.selectedStatus;
      return matchStatus;
    });
  }

  getMilestone(milestoneId: number): ProjectMilestone | undefined {
    return this.milestones.get(milestoneId);
  }

  getProject(projectId: number): CompanyProject | undefined {
    return this.projects.get(projectId);
  }

  confirmInterview(applicationId: number): void {
    if (confirm('Are you sure you want to confirm your attendance for this interview?')) {
      this.milestonesService.confirmInterview(applicationId).subscribe(() => {
        this.loadData();
        alert('Interview confirmed! The company has been notified.');
      });
    }
  }

  openWorkspace(application: MilestoneApplication): void {
    if (application.status !== 'accepted') {
      alert('Workspace is only available for accepted applications');
      return;
    }

    this.selectedApplication = application;
    this.showWorkspace = true;
    this.activeTab = 'overview';
    this.loadWorkspaceData();
  }

  closeWorkspace(): void {
    this.showWorkspace = false;
    this.selectedApplication = undefined;
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  loadWorkspaceData(): void {
    if (!this.selectedApplication) return;

    // Load team members
    this.workspaceService.getTeamMembers(this.selectedApplication.milestoneId).subscribe(team => {
      this.teamMembers = team;
    });

    // Load my submissions
    if (this.authService.currentUser) {
      this.workspaceService.getMySubmissions(this.authService.currentUser.id).subscribe(submissions => {
        this.mySubmissions = submissions.filter(s => s.milestone_id === this.selectedApplication?.milestoneId);
      });
    }
  }

  switchTab(tab: 'overview' | 'chat' | 'submit' | 'submissions'): void {
    this.activeTab = tab;

    if (tab === 'chat' && this.selectedApplication) {
      this.loadChat();
    }
  }

  loadChat(): void {
    if (!this.selectedApplication) return;

    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }

    this.chatSubscription = this.workspaceService.pollChatMessages(this.selectedApplication.milestoneId)
      .subscribe(messages => {
        this.chatMessages = messages;
        setTimeout(() => this.scrollChatToBottom(), 100);
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedApplication || !this.authService.currentUser) return;

    this.workspaceService.sendMessage(
      this.selectedApplication.milestoneId,
      this.authService.currentUser.id,
      this.authService.currentUser.name,
      'freelancer',
      this.newMessage
    ).subscribe(() => {
      this.newMessage = '';
    });
  }

  scrollChatToBottom(): void {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  submitWork(): void {
    if (!this.submissionForm.title || !this.selectedApplication || !this.authService.currentUser) {
      alert('Please fill in all required fields');
      return;
    }

    const submission = {
      application_id: this.selectedApplication.id,
      milestone_id: this.selectedApplication.milestoneId,
      freelancer_id: this.authService.currentUser.id,
      ...this.submissionForm
    };

    this.workspaceService.submitWork(submission).subscribe(() => {
      alert('Work submitted successfully!');
      this.submissionForm = {
        title: '',
        description: '',
        file_url: '',
        file_name: '',
        file_type: ''
      };
      this.loadWorkspaceData();
      this.activeTab = 'submissions';
    });
  }

  getStatusClass(status: string): string {
    return status;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Under Review',
      'interview_scheduled': 'Interview Scheduled',
      'interview_confirmed': 'Interview Confirmed',
      'accepted': 'Accepted',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  }

  getSubmissionStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending Review',
      'approved': 'Approved',
      'revision_requested': 'Revision Requested',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  }

  getPendingCount(): number {
    return this.applications.filter(a => a.status === 'pending').length;
  }

  getInterviewCount(): number {
    return this.applications.filter(a => a.status === 'interview_scheduled' || a.status === 'interview_confirmed').length;
  }

  getAcceptedCount(): number {
    return this.applications.filter(a => a.status === 'accepted').length;
  }

  getRejectedCount(): number {
    return this.applications.filter(a => a.status === 'rejected').length;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
