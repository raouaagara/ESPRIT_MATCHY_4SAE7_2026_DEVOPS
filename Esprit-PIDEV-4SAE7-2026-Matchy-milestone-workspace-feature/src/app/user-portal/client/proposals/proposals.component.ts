import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProposalService } from '../../core/services/proposal.service';
import { ProjectService } from '../../core/services/project.service';
import { Proposal, Project } from '../../core/models/models';

@Component({
  selector: 'app-cl-proposals',
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">Proposals</h1><p class="page-sub">Review freelancer applications</p></div>
      </div>

      <!-- Project Filter -->
      <div class="project-filter" *ngIf="projects.length > 0">
        <label>Filter by project:</label>
        <select class="form-input" [(ngModel)]="selectedProjectId" (change)="filterByProject()">
          <option [ngValue]="null">All projects</option>
          <option *ngFor="let p of projects" [ngValue]="p.id">{{ p.title }}</option>
        </select>
      </div>

      <div class="loading-state" *ngIf="isLoading"><div class="spinner"></div><span>Loading proposals...</span></div>

      <div class="proposals-list" *ngIf="!isLoading">
        <div class="empty" *ngIf="filtered.length === 0">No proposals yet on your projects.</div>

        <div class="proposal-card" *ngFor="let p of filtered">
          <div class="proposal-header">
            <div class="freelancer-info">
              <div class="avatar">{{ getInitials(p.freelancerName || '?') }}</div>
              <div>
                <span class="freelancer-name">{{ p.freelancerName || p.freelancerEmail }}</span>
                <span class="project-ref">Project: {{ p.projectTitle }}</span>
              </div>
            </div>
            <span class="badge" [class]="getStatusClass(p.status)">{{ p.status }}</span>
          </div>
          <p class="cover-letter" *ngIf="p.coverLetter">{{ p.coverLetter }}</p>
          <div class="proposal-meta">
            <span *ngIf="p.proposedBudget">💰 {{ p.proposedBudget }} TND</span>
            <span *ngIf="p.deliveryTime">⏱ {{ p.deliveryTime }}</span>
            <span>📅 {{ p.createdAt | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="proposal-actions" *ngIf="p.status === 'PENDING'">
            <button class="btn-accept" (click)="updateStatus(p.id!, 'ACCEPTED')">✅ Accept</button>
            <button class="btn-reject" (click)="updateStatus(p.id!, 'REJECTED')">❌ Reject</button>
          </div>
          <div class="feedback" *ngIf="p.clientFeedback">
            <strong>Feedback:</strong> {{ p.clientFeedback }}
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./proposals.component.scss']
})
export class ClProposalsComponent implements OnInit {
  proposals: Proposal[] = [];
  filtered: Proposal[] = [];
  projects: Project[] = [];
  selectedProjectId: number | null = null;
  isLoading = true;

  constructor(
    public authService: AuthService,
    private proposalService: ProposalService,
    private projectService: ProjectService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const qpId = this.route.snapshot.queryParamMap.get('projectId');
    if (qpId) this.selectedProjectId = +qpId;

    const userId = this.authService.currentUser?.id;
    this.projectService.getAll(undefined, userId).subscribe(projects => {
      this.projects = projects;
      this.loadProposals();
    });
  }

  loadProposals(): void {
    const projectId = this.selectedProjectId || undefined;
    this.proposalService.getAll(projectId).subscribe({
      next: p => { this.proposals = p; this.filterByProject(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  filterByProject(): void {
    this.filtered = this.selectedProjectId
      ? this.proposals.filter(p => p.projectId === this.selectedProjectId)
      : this.proposals;
  }

  updateStatus(id: number, status: string): void {
    const feedback = status === 'REJECTED' ? prompt('Feedback (optional):') || '' : '';
    this.proposalService.updateStatus(id, status, feedback).subscribe(() => this.loadProposals());
  }

  getInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); }
  getStatusClass(s: string): string {
    const m: any = { PENDING: 'status-pending', ACCEPTED: 'status-accept', REJECTED: 'status-reject', WITHDRAWN: 'status-cancel' };
    return m[s] || '';
  }
}
