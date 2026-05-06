import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { environment } from '../../_env/environment';

interface DeliveredProject {
  projectId: number;
  projectTitle: string;
  freelancerEmail: string;
  freelancerId: number;
  proposalId: number;
  deliveryLink: string;
  deliveryMessage: string;
  budget: number;
  status: string;
}

@Component({
  selector: 'app-client-deliveries',
  standalone: false,
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">📦 Deliveries</h1>
          <p class="page-sub">Review and confirm freelancer deliveries</p>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div><span>Loading deliveries...</span>
      </div>

      <!-- Empty -->
      <div class="empty" *ngIf="!isLoading && projects.length === 0">
        <span class="empty-icon">📭</span>
        <p>No deliveries awaiting confirmation.</p>
      </div>

      <!-- Cards -->
      <div class="proposals-list" *ngIf="!isLoading && projects.length > 0">
        <div class="proposal-card card-delivered"
          *ngFor="let p of projects; let i = index"
          [style.animation-delay]="(i * 0.05) + 's'">

          <!-- Card Header -->
          <div class="proposal-header">
            <div class="header-left">
              <h3 class="project-title">{{ p.projectTitle || 'Project #' + p.projectId }}</h3>
              <span class="client-info" *ngIf="p.freelancerEmail">
                Freelancer: {{ p.freelancerEmail }}
              </span>
            </div>
            <span class="badge status-deliver">DELIVERED</span>
          </div>

          <!-- Delivery link -->
          <div class="delivery-link-box" *ngIf="p.deliveryLink">
            <span class="link-label">🔗 Delivery link:</span>
            <a [href]="p.deliveryLink" target="_blank" class="link-url">
              {{ p.deliveryLink }}
            </a>
          </div>

          <!-- Delivery message -->
          <p class="cover-letter" *ngIf="p.deliveryMessage">
            {{ p.deliveryMessage }}
          </p>

          <!-- Budget -->
          <div class="proposal-meta">
            <span>💰 Budget: {{ p.budget }} TND</span>
            <span class="commission-info">
              (Freelancer reçoit {{ p.budget * 0.90 | number:'1.2-2' }} TND après 10% commission)
            </span>
          </div>

          <!-- Actions -->
          <div class="delivery-section">
            <div class="delivery-cta">

              <!-- Confirm & Pay -->
              <button class="btn-deliver"
                (click)="openConfirmModal(p)"
                [disabled]="loadingId === p.projectId">
                <span *ngIf="loadingId !== p.projectId">✅ Confirm & Pay</span>
                <span *ngIf="loadingId === p.projectId" class="btn-dots">
                  <span></span><span></span><span></span>
                </span>
              </button>

              <!-- Request Revision -->
              <button class="btn-withdraw"
                (click)="openRevisionModal(p)"
                [disabled]="loadingId === p.projectId">
                🔄 Request Revision
              </button>

            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- ══ CONFIRM & PAY MODAL ══ -->
    <div class="modal-overlay" *ngIf="confirmModal" (click)="closeConfirmModal()">
      <div class="modal" (click)="$event.stopPropagation()" *ngIf="selectedProject as proj">

        <div class="modal-header">
          <div class="modal-header-inner">
            <div>
              <div class="modal-eyebrow">Payment confirmation</div>
              <div class="modal-title">✅ Confirm & Pay</div>
            </div>
            <button class="modal-close" (click)="closeConfirmModal()">✕</button>
          </div>
        </div>

        <div class="modal-body">

          <div class="project-info-box">
            <span class="proj-icon">🚀</span>
            <div>
              <div class="proj-name">{{ proj.projectTitle }}</div>
              <div class="proj-client">Freelancer: {{ proj.freelancerEmail }}</div>
            </div>
          </div>

          <!-- Payment breakdown -->
          <div class="payment-breakdown">
            <div class="breakdown-row">
              <span>Montant total</span>
              <span class="fw-bold">{{ proj.budget }} TND</span>
            </div>
            <div class="breakdown-row text-danger">
              <span>Commission plateforme (10%)</span>
              <span>- {{ proj.budget * 0.10 | number:'1.2-2' }} TND</span>
            </div>
            <div class="breakdown-row breakdown-total">
              <span>Freelancer reçoit</span>
              <span class="text-success">{{ proj.budget * 0.90 | number:'1.2-2' }} TND</span>
            </div>
          </div>

          <div class="info-note">
            💡 Le montant sera prélevé de votre solde bloqué (Escrow).
          </div>

          <div class="form-error" *ngIf="errorMessage">⚠️ {{ errorMessage }}</div>
        </div>

        <div class="modal-footer">
          <div class="footer-hint">🔒 Transaction sécurisée via Escrow</div>
          <div class="footer-btns">
            <button class="btn-cancel" (click)="closeConfirmModal()">Cancel</button>
            <button class="btn-submit"
              (click)="confirmerEtPayer()"
              [disabled]="isSubmitting">
              <span *ngIf="!isSubmitting">✅ Confirm & Pay {{ proj.budget }} TND</span>
              <span *ngIf="isSubmitting" class="btn-dots">
                <span></span><span></span><span></span>
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ══ REVISION MODAL ══ -->
    <div class="modal-overlay" *ngIf="revisionModal" (click)="closeRevisionModal()">
      <div class="modal" (click)="$event.stopPropagation()" *ngIf="selectedProject as proj">

        <div class="modal-header">
          <div class="modal-header-inner">
            <div>
              <div class="modal-eyebrow">Request revision</div>
              <div class="modal-title">🔄 Request Revision</div>
            </div>
            <button class="modal-close" (click)="closeRevisionModal()">✕</button>
          </div>
        </div>

        <div class="modal-body">
          <div class="project-info-box">
            <span class="proj-icon">📝</span>
            <div>
              <div class="proj-name">{{ proj.projectTitle }}</div>
              <div class="proj-client">Freelancer: {{ proj.freelancerEmail }}</div>
            </div>
          </div>

          <div class="form-group">
            <label class="field-label">Revision details</label>
            <textarea class="form-input form-textarea"
              placeholder="Explain what needs to be revised..."
              [(ngModel)]="revisionMessage"
              maxlength="500">
            </textarea>
            <div class="char-count">{{ revisionMessage.length }} / 500</div>
          </div>

          <div class="form-error" *ngIf="errorMessage">⚠️ {{ errorMessage }}</div>
        </div>

        <div class="modal-footer">
          <div class="footer-hint">📧 Freelancer will be notified</div>
          <div class="footer-btns">
            <button class="btn-cancel" (click)="closeRevisionModal()">Cancel</button>
            <button class="btn-submit"
              (click)="demanderRevision()"
              [disabled]="isSubmitting">
              <span *ngIf="!isSubmitting">🔄 Send Revision Request</span>
              <span *ngIf="isSubmitting" class="btn-dots">
                <span></span><span></span><span></span>
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./client-deliveries.component.scss']
})
export class ClientDeliveriesComponent implements OnInit {

  projects: DeliveredProject[] = [];
  isLoading = false;
  isSubmitting = false;
  loadingId: number | null = null;
  errorMessage = '';

  // Modals
  confirmModal = false;
  revisionModal = false;
  selectedProject: DeliveredProject | null = null;
  revisionMessage = '';

  private api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    const clientId = this.authService.currentUser?.id;
    this.http.get<DeliveredProject[]>(`${this.api}/projects/delivered?clientId=${clientId}`)
      .subscribe({
        next: (data) => { this.projects = data; this.isLoading = false; },
        error: () => { this.isLoading = false; }
      });
  }

  // ── Confirm & Pay ──
  openConfirmModal(p: DeliveredProject): void {
    this.selectedProject = p;
    this.errorMessage = '';
    this.confirmModal = true;
  }

  closeConfirmModal(): void {
    this.confirmModal = false;
    this.selectedProject = null;
    this.errorMessage = '';
  }

  confirmerEtPayer(): void {
    if (!this.selectedProject) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const clientId = this.authService.currentUser?.id!;
    const { freelancerId, projectId, budget } = this.selectedProject;

    // Déclencher paiement wallet
    this.walletService.payerFreelancer(clientId, freelancerId, projectId, budget)
      .subscribe({
        next: () => {
          // Mettre à jour statut projet → COMPLETED
          this.http.patch(`${this.api}/projects/${projectId}/complete`, {
            clientId,
            proposalId: this.selectedProject!.proposalId
          }).subscribe({
            next: () => {
              this.isSubmitting = false;
              this.closeConfirmModal();
              this.load();
            },
            error: (err) => {
              this.errorMessage = err.error?.message || 'Erreur mise à jour statut';
              this.isSubmitting = false;
            }
          });
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur paiement. Vérifiez votre solde.';
          this.isSubmitting = false;
        }
      });
  }

  // ── Revision ──
  openRevisionModal(p: DeliveredProject): void {
    this.selectedProject = p;
    this.revisionMessage = '';
    this.errorMessage = '';
    this.revisionModal = true;
  }

  closeRevisionModal(): void {
    this.revisionModal = false;
    this.selectedProject = null;
    this.errorMessage = '';
  }

  demanderRevision(): void {
    if (!this.revisionMessage.trim()) {
      this.errorMessage = 'Please describe what needs to be revised.';
      return;
    }
    if (!this.selectedProject) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.http.patch(`${this.api}/projects/${this.selectedProject.projectId}/revision`, {
      revisionMessage: this.revisionMessage,
      clientId: this.authService.currentUser?.id,
      proposalId: this.selectedProject.proposalId
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeRevisionModal();
        this.load();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error sending revision request.';
        this.isSubmitting = false;
      }
    });
  }
}