import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { WorkspaceService, ChatMessage, TeamMember, WorkSubmission } from '../../frontoffice/services/workspace.service';
import { MilestonesService } from '../../frontoffice/services/milestones.service';
import { CompanyProjectsService } from '../../frontoffice/services/company-projects.service';
import { AuthService } from '../../frontoffice/services/auth.service';
import { ProjectMilestone } from '../../frontoffice/models/milestone.model';
import { CompanyProject } from '../../frontoffice/models/project.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-workspace-manager',
  templateUrl: './workspace-manager.component.html',
  styleUrls: ['./workspace-manager.component.scss']
})
export class WorkspaceManagerComponent implements OnInit, OnDestroy {
  projects: CompanyProject[] = [];
  milestones: ProjectMilestone[] = [];
  filteredMilestones: ProjectMilestone[] = [];
  selectedProject?: CompanyProject;
  selectedMilestone?: ProjectMilestone;
  
  activeTab: 'chat' | 'submissions' = 'chat';
  
  // Chat
  chatMessages: ChatMessage[] = [];
  newMessage = '';
  teamMembers: TeamMember[] = [];
  private chatSubscription?: Subscription;
  
  // Submissions
  submissions: WorkSubmission[] = [];
  showReviewModal = false;
  selectedSubmission?: WorkSubmission;
  reviewForm = {
    status: 'pending',
    feedback: '',
    rating: 0
  };
  hoveredRating = 0;

  constructor(
    private workspaceService: WorkspaceService,
    private milestonesService: MilestonesService,
    private projectsService: CompanyProjectsService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  loadProjects(): void {
    this.projectsService.getProjects().subscribe(projects => {
      this.projects = projects;
    });

    this.milestonesService.getAllMilestones().subscribe(milestones => {
      this.milestones = milestones.filter(m => m.status === 'assigned' || m.status === 'in_progress');
      this.filteredMilestones = this.milestones;
    });
  }

  filterByProject(projectId: number): void {
    if (projectId === 0) {
      this.filteredMilestones = this.milestones;
      this.selectedProject = undefined;
    } else {
      this.filteredMilestones = this.milestones.filter(m => m.projectId === projectId);
      this.selectedProject = this.projects.find(p => p.id === projectId);
    }
  }

  selectMilestone(milestone: ProjectMilestone): void {
    this.selectedMilestone = milestone;
    this.activeTab = 'chat';
    this.loadMilestoneData();
  }

  loadMilestoneData(): void {
    if (!this.selectedMilestone) return;

    // Load team members
    this.workspaceService.getTeamMembers(this.selectedMilestone.id).subscribe(team => {
      this.teamMembers = team;
      console.log('Team members loaded:', team.length);
    });

    // Load submissions
    this.workspaceService.getSubmissions(this.selectedMilestone.id).subscribe(submissions => {
      this.submissions = submissions;
      console.log('Submissions loaded:', submissions.length, submissions);
    });

    // Load chat if on chat tab
    if (this.activeTab === 'chat') {
      this.loadChat();
    }
  }

  switchTab(tab: 'chat' | 'submissions'): void {
    this.activeTab = tab;
    if (tab === 'chat' && this.selectedMilestone) {
      this.loadChat();
    }
  }

  loadChat(): void {
    if (!this.selectedMilestone) return;

    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }

    this.chatSubscription = this.workspaceService.pollChatMessages(this.selectedMilestone.id)
      .subscribe(messages => {
        this.chatMessages = messages;
        setTimeout(() => this.scrollChatToBottom(), 100);
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedMilestone || !this.authService.currentUser) return;

    this.workspaceService.sendMessage(
      this.selectedMilestone.id,
      this.authService.currentUser.id,
      this.authService.currentUser.name,
      'company',
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

  openReviewModal(submission: WorkSubmission): void {
    this.selectedSubmission = submission;
    this.reviewForm = {
      status: submission.status,
      feedback: submission.feedback || '',
      rating: 0
    };
    this.hoveredRating = 0;
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedSubmission = undefined;
    this.hoveredRating = 0;
  }

  setRating(rating: number): void {
    this.reviewForm.rating = rating;
  }

  setHoveredRating(rating: number): void {
    this.hoveredRating = rating;
  }

  clearHoveredRating(): void {
    this.hoveredRating = 0;
  }

  submitReview(): void {
    if (!this.selectedSubmission) return;

    if (this.reviewForm.status !== 'pending' && !this.reviewForm.feedback.trim()) {
      alert('Please provide feedback for your decision');
      return;
    }

    if (this.reviewForm.status === 'approved' && this.reviewForm.rating === 0) {
      alert('Please provide a rating when approving work');
      return;
    }

    this.workspaceService.updateSubmissionStatus(
      this.selectedSubmission.id,
      this.reviewForm.status,
      this.reviewForm.feedback,
      this.reviewForm.rating
    ).subscribe(() => {
      alert('Review submitted successfully!');
      this.closeReviewModal();
      this.loadMilestoneData();
    });
  }

  getProject(projectId: number): CompanyProject | undefined {
    return this.projects.find(p => p.id === projectId);
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

  getFeedbackPlaceholder(): string {
    switch (this.reviewForm.status) {
      case 'approved':
        return 'Great work! The implementation meets all requirements...';
      case 'revision_requested':
        return 'Please revise the following aspects...';
      case 'rejected':
        return 'Unfortunately, this work does not meet the requirements because...';
      default:
        return 'Provide detailed feedback for the freelancer...';
    }
  }
}
