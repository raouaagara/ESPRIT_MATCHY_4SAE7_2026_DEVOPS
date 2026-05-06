import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ProposalService } from '../../core/services/proposal.service';
import { Proposal } from '../../core/models/models';
import { environment } from '../../_env/environment';

@Component({
  selector: 'app-fl-proposals',
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">My Proposals</h1>
          <p class="page-sub">Track your job applications</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <button *ngFor="let s of statuses"
          class="filter-btn"
          [class.active]="activeFilter === s"
          (click)="setFilter(s)">
          {{ s }}
          <span class="filter-count" *ngIf="getCount(s) > 0">{{ getCount(s) }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div><span>Loading...</span>
      </div>

      <!-- List -->
      <div class="proposals-list" *ngIf="!isLoading">
        <div class="empty" *ngIf="filtered.length === 0">
          <span class="empty-icon">📋</span>
          <p>No proposals in this category.</p>
        </div>

        <div class="proposal-card"
          *ngFor="let p of filtered; let i = index"
          [class.card-accepted]="p.status === 'ACCEPTED'"
          [class.card-delivered]="p.status === 'DELIVERED'"
          [class.card-completed]="p.status === 'COMPLETED'"
          [style.animation-delay]="(i * 0.05) + 's'">

          <!-- Card Header -->
          <div class="proposal-header">
            <div class="header-left">
              <h3 class="project-title">{{ p.projectTitle || 'Project #' + p.projectId }}</h3>
              <span class="client-info" *ngIf="p.clientEmail">Client: {{ p.clientEmail }}</span>
            </div>
            <span class="badge" [class]="getStatusClass(p.status)">{{ p.status }}</span>
          </div>

          <!-- Cover Letter -->
          <p class="cover-letter" *ngIf="p.coverLetter">{{ p.coverLetter }}</p>

          <!-- Meta -->
          <div class="proposal-meta">
            <span *ngIf="p.proposedBudget">💰 {{ p.proposedBudget }} TND</span>
            <span *ngIf="p.deliveryTime">⏱ {{ p.deliveryTime }}</span>
            <span>📅 {{ p.createdAt | date:'dd/MM/yyyy' }}</span>
          </div>

          <!-- Client Feedback -->
          <div class="feedback-box" *ngIf="p.clientFeedback">
            <strong>📬 Client feedback:</strong> {{ p.clientFeedback }}
          </div>

          <!-- ── DELIVERY SECTION ── -->
          <div class="delivery-section"
            *ngIf="p.status === 'ACCEPTED' || p.status === 'DELIVERED' || p.status === 'COMPLETED'">

            <!-- ACCEPTED → CTA to submit -->
            <div class="delivery-cta" *ngIf="p.status === 'ACCEPTED'">
              <div class="delivery-cta-text">
                <span class="live-dot"></span>
                Project in progress — ready to submit?
              </div>
              <button class="btn-deliver" (click)="openDeliveryModal(p)">
                📦 Submit Delivery
              </button>
            </div>

            <!-- DELIVERED → waiting -->
            <div class="waiting-state" *ngIf="p.status === 'DELIVERED'">
              <span class="state-icon">⏳</span>
              <div class="state-text">
                <strong>Delivery submitted — awaiting client confirmation</strong>
                <span>The client will confirm or request a revision</span>
              </div>
            </div>

            <!-- COMPLETED → done -->
            <div class="completed-state" *ngIf="p.status === 'COMPLETED'">
              <span class="state-icon">✅</span>
              <div class="state-text">
                <strong>Project completed & confirmed by client</strong>
                <span>Payment has been released</span>
              </div>
            </div>
          </div>

          <!-- Withdraw (PENDING only) -->
          <div class="card-actions" *ngIf="p.status === 'PENDING'">
            <button class="btn-withdraw" (click)="withdraw(p.id!)">Withdraw</button>
          </div>

        </div>
      </div>
    </div>

    <!-- ══ DELIVERY MODAL ══════════════════════════════════════ -->
    <div class="modal-overlay" *ngIf="deliveryModal" (click)="closeDeliveryModal()">
      <div class="modal" (click)="$event.stopPropagation()" *ngIf="selectedProposal as prop">

        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-header-inner">
            <div>
              <div class="modal-eyebrow">Submit your work</div>
              <div class="modal-title">📦 Submit Delivery</div>
            </div>
            <button class="modal-close" (click)="closeDeliveryModal()">✕</button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">

          <!-- Project recap -->
          <div class="project-info-box">
            <span class="proj-icon">🚀</span>
            <div>
              <div class="proj-name">{{ prop.projectTitle || 'Project #' + prop.projectId }}</div>
              <div class="proj-client" *ngIf="prop.clientEmail">Client: {{ prop.clientEmail }}</div>
            </div>
          </div>

          <!-- Delivery link -->
          <div class="form-group">
            <label class="field-label">Delivery link / URL</label>
            <input class="form-input" type="url"
              placeholder="https://github.com/yourrepo or https://drive.google.com/..."
              [(ngModel)]="deliveryForm.link" />
          </div>

          <!-- Message -->
          <div class="form-group">
            <label class="field-label">
              Delivery message
              <span class="optional-hint">(optional)</span>
            </label>
            <textarea class="form-input form-textarea"
              placeholder="Describe what you've delivered, how to test it, any notes for the client..."
              [(ngModel)]="deliveryForm.message"
              (input)="onMessageInput()"
              maxlength="500">
            </textarea>
            <div class="char-count">{{ deliveryForm.message.length }} / 500</div>
          </div>

          <!-- Error -->
          <div class="form-error" *ngIf="deliveryError">⚠️ {{ deliveryError }}</div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <div class="footer-hint">📧 Client will be notified by email</div>
          <div class="footer-btns">
            <button class="btn-cancel" (click)="closeDeliveryModal()">Cancel</button>
            <button class="btn-submit" (click)="submitDelivery()" [disabled]="isSubmitting">
              <span *ngIf="!isSubmitting">📦 Submit Delivery</span>
              <span *ngIf="isSubmitting" class="btn-dots">
                <span></span><span></span><span></span>
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./proposals.component.scss']
})
export class FlProposalsComponent implements OnInit {

  proposals:   Proposal[] = [];
  filtered:    Proposal[] = [];
  activeFilter = 'ALL';
  isLoading    = true;
  isSubmitting = false;

  statuses = ['ALL', 'PENDING', 'ACCEPTED', 'DELIVERED', 'COMPLETED', 'REJECTED', 'WITHDRAWN'];

  // Delivery modal state
  deliveryModal    = false;
  selectedProposal: Proposal | null = null;
  deliveryError    = '';
  deliveryForm     = { link: '', message: '' };

  private api = environment.apiUrl;

  constructor(
    public  authService:    AuthService,
    private proposalService: ProposalService,
    private http:           HttpClient
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    const userId   = this.authService.currentUser?.id;
    this.proposalService.getAll(undefined, userId).subscribe({
      next:  p  => { this.proposals = p; this.applyFilter(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  setFilter(s: string): void { this.activeFilter = s; this.applyFilter(); }

  applyFilter(): void {
    this.filtered = this.activeFilter === 'ALL'
      ? this.proposals
      : this.proposals.filter(p => p.status === this.activeFilter);
  }

  getCount(status: string): number {
    if (status === 'ALL') return 0;
    return this.proposals.filter(p => p.status === status).length;
  }

  getStatusClass(s: string): string {
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

  withdraw(id: number): void {
    if (!confirm('Withdraw this proposal?')) return;
    this.proposalService.updateStatus(id, 'WITHDRAWN').subscribe(() => this.load());
  }

  // ── Delivery modal ─────────────────────────────────────────
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

  onMessageInput(): void {
    // triggers change detection for char count
  }

  submitDelivery(): void {
    if (!this.deliveryForm.link.trim()) {
      this.deliveryError = 'Please provide a delivery link.';
      return;
    }
    if (!this.selectedProposal?.projectId) return;

    this.isSubmitting  = true;
    this.deliveryError = '';

    // Call the backend deliver endpoint
    this.http.patch(`${this.api}/projects/${this.selectedProposal.projectId}/deliver`, {
      deliveryLink:    this.deliveryForm.link,
      deliveryMessage: this.deliveryForm.message,
      freelancerId:    this.authService.currentUser?.id,
      proposalId:      this.selectedProposal.id
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeDeliveryModal();
        this.load(); // refresh list — card status → DELIVERED
      },
      error: (err) => {
        this.deliveryError = err?.error?.error || 'Failed to submit delivery. Please try again.';
        this.isSubmitting  = false;
      }
    });
  }
}