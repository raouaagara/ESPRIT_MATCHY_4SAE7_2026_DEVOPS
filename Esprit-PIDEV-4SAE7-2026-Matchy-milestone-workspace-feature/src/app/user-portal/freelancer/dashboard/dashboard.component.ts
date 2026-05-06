import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { ProposalService } from '../../core/services/proposal.service';
import { NotificationService } from '../../core/services/notification.service';
import { Project, Proposal, Notification, ProposalPerformanceAnalytics } from '../../core/models/models';
import { environment } from '../../_env/environment';
import { FreelancerStatsService } from '../../core/services/freelancer-stats.service';
import { MarketStat, AvailabilityResult } from '../../core/models/models';

@Component({
  selector: 'app-fl-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class FlDashboardComponent implements OnInit {
  openProjects:        Project[]      = [];
  myProposals:         Proposal[]     = [];
  inProgressProposals: Proposal[]     = [];
  notifications:       Notification[] = [];
  isLoading    = true;
  isSubmitting = false;
  isDark       = false;
  stats = {
    openProjects: 0,
    myProposals:  0,
    accepted:     0,
    inProgress:   0,
    pending:      0,
    unreadNotifs: 0
  };
  reactivity = { score: 0, label: '' };
  overload   = { overloaded: false, activeProjects: 0, threshold: 5 };
  completeness = {
    score: 0,
    missing: [] as string[]
  };
  availability: AvailabilityResult = {
    status: 'AVAILABLE',
    occupiedSlots: 0,
    maxSlots: 5,
    availableFrom: ''
  };
  marketStats: MarketStat[] = [];
  proposalAnalytics: ProposalPerformanceAnalytics = {
    totalProposals: 0,
    acceptedProposals: 0,
    globalAcceptanceRate: 0,
    acceptanceByCategory: [],
    averageClientResponseHours: 0,
    bestSubmitWindow: {
      day: 'MONDAY',
      hour: 10,
      sampleSize: 0,
      basedOnAcceptedOnly: false
    }
  };
  deliveryModal     = false;
  selectedProposal: Proposal | null = null;
  deliveryError     = '';
  deliveryForm      = { link: '', message: '' };
  private api = environment.apiUrl;

  constructor(
    public  authService:     AuthService,
    private projectService:  ProjectService,
    private proposalService: ProposalService,
    private notifService:    NotificationService,
    private http:            HttpClient,
    private statsService:    FreelancerStatsService
  ) {}

  ngOnInit(): void {
    this.isDark = localStorage.getItem('theme') === 'dark'
               || document.body.classList.contains('dark');
    this.authService.checkAuth();
    this.loadAll();
    this.computeCompleteness();
    const observer = new MutationObserver(() => {
      this.isDark = document.body.classList.contains('dark');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  computeCompleteness(): void {
    const user = this.authService.currentUser;
    if (!user) return;
    const fields: { key: keyof typeof user; label: string }[] = [
      { key: 'firstName', label: 'First name' },
      { key: 'email',     label: 'Email' },
    ];
    const missing: string[] = [];
    let filled = 0;
    for (const f of fields) {
      if (user[f.key]) { filled++; } else { missing.push(f.label); }
    }
    this.completeness = {
      score:   Math.round((filled / fields.length) * 100),
      missing
    };
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }

  loadAll(): void {
    const userId = this.authService.currentUser?.id
      ? String(this.authService.currentUser.id)
      : null;
    this.projectService.getOpen().subscribe(projects => {
      this.openProjects       = projects.slice(0, 5);
      this.stats.openProjects = projects.length;
    });
    if (userId) {
      this.proposalService.getAll(undefined, userId).subscribe({
        next: proposals => {
          this.inProgressProposals = proposals.filter(p =>
            (p.status as string) === 'ACCEPTED' || (p.status as string) === 'DELIVERED'
          );
          this.myProposals       = proposals.slice(0, 5);
          this.stats.myProposals = proposals.length;
          this.stats.accepted    = proposals.filter(p => (p.status as string) === 'ACCEPTED').length;
          this.stats.inProgress  = this.inProgressProposals.length;
          this.stats.pending     = proposals.filter(p => (p.status as string) === 'PENDING').length;
          this.isLoading = false;
          // Gamification
          const accepted = this.stats.accepted;
          const total    = proposals.length;
          fetch('http://localhost:8080/api/badges/freelancer/proposal-submitted', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ freelancerId: Number(userId), totalSubmitted: total })
          }).catch(() => {});
          if (accepted > 0) {
            fetch('http://localhost:8080/api/badges/freelancer/proposal-accepted', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ freelancerId: Number(userId), accepted, total })
            }).catch(() => {});
          }
        },
        error: () => { this.isLoading = false; }
      });
      this.statsService.getAvailability(userId).subscribe({
        next: a => { this.availability = a; },
        error: () => {}
      });
      this.statsService.getMarketHeatmap().subscribe({
        next: m => { this.marketStats = m; },
        error: () => {}
      });
      this.http.get<ProposalPerformanceAnalytics>(`${this.api}/proposals/analytics/${userId}`).subscribe({
        next: data => { this.proposalAnalytics = data; },
        error: () => {}
      });
      this.notifService.getUnread(userId).subscribe({
        next: n => { this.notifications = n.slice(0, 5); this.stats.unreadNotifs = n.length; },
        error: () => {}
      });
    } else {
      this.isLoading = false;
    }
  }

  getProposalStatusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING:   'status-pending',
      ACCEPTED:  'status-accept',
      DELIVERED: 'status-deliver',
      COMPLETED: 'status-complete',
      REJECTED:  'status-reject',
      WITHDRAWN: 'status-cancel'
    };
    return m[s] ?? '';
  }

  getAvailabilityClass(): string { return 'status-active'; }
  getAvailabilityLabel(): string { return 'Available'; }

  getMarketBarWidth(count: number): number {
    const max = Math.max(...this.marketStats.map(m => m.projectCount), 1);
    return Math.round((count / max) * 100);
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  getBestSubmitHourRange(): string {
    const h = this.proposalAnalytics.bestSubmitWindow?.hour ?? 10;
    const next = (h + 1) % 24;
    return `${String(h).padStart(2, '0')}:00 - ${String(next).padStart(2, '0')}:00`;
  }

  getAvgClientResponseLabel(): string {
    const hours = this.proposalAnalytics.averageClientResponseHours ?? 0;
    if (hours <= 0) return '0 min';
    if (hours < 1) {
      const minutes = Math.max(1, Math.round(hours * 60));
      return `${minutes} min`;
    }
    return `${hours.toFixed(1)}h`;
  }

  openDeliveryModal(p: Proposal): void {
    this.selectedProposal = p;
    this.deliveryForm     = { link: '', message: '' };
    this.deliveryError    = '';
    this.deliveryModal    = true;
  }

  closeDeliveryModal(): void {
    this.deliveryModal    = false;
    this.selectedProposal = null;
    this.deliveryError    = '';
  }

  submitDelivery(): void {
    if (!this.deliveryForm.link.trim()) {
      this.deliveryError = 'Please provide a delivery link.';
      return;
    }
    if (!this.selectedProposal?.projectId) return;
    this.isSubmitting  = true;
    this.deliveryError = '';
    this.http.patch(`${this.api}/projects/${this.selectedProposal.projectId}/deliver`, {
      deliveryLink:    this.deliveryForm.link,
      deliveryMessage: this.deliveryForm.message,
      freelancerId:    String(this.authService.currentUser?.id),
      proposalId:      this.selectedProposal.id
    }).subscribe({
      next: () => { this.isSubmitting = false; this.closeDeliveryModal(); this.loadAll(); },
      error: (err) => {
        this.deliveryError = err?.error?.error || 'Failed to submit.';
        this.isSubmitting  = false;
      }
    });
  }
}

