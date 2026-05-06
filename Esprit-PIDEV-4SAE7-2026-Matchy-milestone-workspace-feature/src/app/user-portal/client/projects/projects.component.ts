import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { CategoryService, CategoryModel } from '../../core/services/cat.service';
import { Project } from '../../core/models/models';
import { environment } from '../../_env/environment';

@Component({
  selector: 'app-cl-projects',
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">My Projects</h1><p class="page-sub">Manage your posted projects</p></div>
        <button class="btn-primary" (click)="showForm = !showForm">{{ showForm ? 'Cancel' : '+ New Project' }}</button>
      </div>

      <!-- Create Form -->
      <div class="form-card" *ngIf="showForm">
        <h3>Post a New Project</h3>
        <div class="form-grid">
          <input class="form-input" placeholder="Project title *" [(ngModel)]="newProject.title">
          <select class="form-input" [(ngModel)]="newProject.category">
            <option value="">-- Category --</option>
            <option *ngFor="let cat of categories" [value]="cat.name">{{ cat.name }}</option>
          </select>
          <input class="form-input" type="number" placeholder="Budget (TND)" [(ngModel)]="newProject.budget">
          <input class="form-input" type="date" [(ngModel)]="newProject.deadline">
        </div>
        <div class="desc-wrap">
          <div class="desc-header">
            <label class="desc-label">Description *</label>
            <button class="btn-ai" (click)="generateDescription()" [disabled]="isGenerating" [class.loading]="isGenerating">
              <span class="ai-icon">✨</span>
              {{ isGenerating ? 'Generating...' : 'Generate with AI' }}
            </button>
          </div>
          <textarea class="form-input form-textarea" placeholder="Describe your project..." [(ngModel)]="newProject.description"></textarea>
          <div class="ai-hint" *ngIf="!newProject.title">💡 Fill in the title and category first, then click Generate with AI</div>
          <div class="ai-error" *ngIf="aiError">⚠️ {{ aiError }}</div>
        </div>
        <input class="form-input" placeholder="Required skills (comma separated)" [(ngModel)]="skillsInput">
        <div class="prediction-trigger" *ngIf="newProject.category">
          <button class="btn-predict" (click)="loadPrediction()" [disabled]="isPredicting">
            {{ isPredicting ? 'Calculating...' : 'Suggest Budget and Deadline' }}
          </button>
        </div>
        <div class="ai-error" *ngIf="predictionError">⚠️ {{ predictionError }}</div>
        <div class="prediction-card" *ngIf="prediction && prediction.budget && prediction.deadline && !isPredicting">
          <div class="prediction-section">
            <b>Budget</b> {{ prediction.budget.confidence }}
            <div class="prediction-stats">
              <span>Min: {{ prediction.budget.min }} TND</span>
              <span>Recommended: {{ prediction.budget.recommended }} TND</span>
              <span>Max: {{ prediction.budget.max }} TND</span>
            </div>
            <button class="btn-apply" (click)="applyBudget()">Apply Budget</button>
          </div>
          <div class="prediction-section">
            <b>Deadline</b> {{ prediction.deadline.confidence }}
            <div class="prediction-stats">
              <span>Min: {{ prediction.deadline.minDays }}d</span>
              <span>Recommended: {{ prediction.deadline.recommendedDays }}d</span>
              <span>Max: {{ prediction.deadline.maxDays }}d</span>
            </div>
            <button class="btn-apply" (click)="applyDeadline()">Apply Deadline</button>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="createProject()" [disabled]="isCreating">
            {{ isCreating ? 'Creating...' : 'Post Project' }}
          </button>
        </div>
        <div class="error" *ngIf="createError">{{ createError }}</div>
      </div>

      <!-- ── DELIVERED ALERT BANNER ── -->
      <div class="delivered-alert" *ngIf="deliveredProjects.length > 0">
        <div class="delivered-alert-left">
          <span class="delivered-pulse"></span>
          <span class="delivered-alert-icon">📦</span>
          <div>
            <strong>{{ deliveredProjects.length }} project(s) delivered — waiting for your review!</strong>
            <p>A freelancer submitted work. Confirm completion or request a revision.</p>
          </div>
        </div>
        <button class="filter-btn active" (click)="setFilter('DELIVERED')">View Deliveries</button>
      </div>

      <!-- Filter -->
      <div class="filters">
        <button *ngFor="let s of statuses" class="filter-btn"
          [class.active]="activeFilter === s"
          [class.filter-delivered]="s === 'DELIVERED'"
          (click)="setFilter(s)">
          {{ s }}
          <span class="filter-badge" *ngIf="s === 'DELIVERED' && deliveredProjects.length > 0">
            {{ deliveredProjects.length }}
          </span>
        </button>
      </div>

      <div class="loading-state" *ngIf="isLoading"><div class="spinner"></div><span>Loading...</span></div>

      <div class="project-grid" *ngIf="!isLoading">
        <div class="empty" *ngIf="filtered.length === 0">No projects found.</div>
        <div class="project-card" *ngFor="let p of filtered"
             [class.card-delivered]="p.status === 'DELIVERED'">

          <div class="card-top">
            <span class="category-tag">{{ p.category }}</span>
            <span class="badge" [class]="getStatusClass(p.status)">{{ p.status }}</span>
          </div>
          <h3 class="card-title">{{ p.title }}</h3>
          <p class="card-desc">{{ p.description }}</p>
          <div class="card-meta">
            <span *ngIf="p.budget">💰 {{ p.budget }} TND</span>
            <span *ngIf="p.deadline">📅 {{ p.deadline | date:'dd/MM/yyyy' }}</span>
            <span>📝 {{ p.proposalsCount || 0 }} proposals</span>
          </div>

          <!-- Delivery info -->
          <div class="delivery-info" *ngIf="p.status === 'DELIVERED'">
            <div class="delivery-info-header">📦 Freelancer submitted a delivery</div>
            <a *ngIf="p.deliveryLink" [href]="p.deliveryLink" target="_blank" class="delivery-link-btn">
              🔗 View Delivery Link ↗
            </a>
            <div *ngIf="p.deliveryMessage" class="delivery-msg-preview">
              "{{ p.deliveryMessage }}"
            </div>
          </div>

          <!-- ── ESCROW PAYMENT BANNER (IN_PROGRESS) ── -->
          <div class="escrow-banner" *ngIf="p.status === 'IN_PROGRESS'">
            <span class="escrow-banner-icon">🔒</span>
            <span class="escrow-banner-text">Secure your payment with Matchy Escrow</span>
          </div>

          <div class="card-actions">
            <button class="btn-sm" (click)="viewProposals(p.id!)">View Proposals</button>
            <button class="btn-sm" (click)="openEditModal(p)" *ngIf="p.status === 'OPEN' || p.status === 'DRAFT'">Edit</button>

            <!-- 🔒 Escrow Payment — visible for IN_PROGRESS or DELIVERED -->
            <button class="btn-sm btn-pay-escrow"
              *ngIf="p.status === 'IN_PROGRESS' || p.status === 'DELIVERED'"
              (click)="goToEscrowPayment(p.id!)">
              🔒 Pay via Escrow
            </button>

            <!-- Delivery review -->
            <button class="btn-sm btn-confirm"
              *ngIf="p.status === 'DELIVERED'"
              (click)="openDeliveryModal(p)">
              ✅ Review Delivery
            </button>

            <button class="btn-sm btn-danger"
              (click)="deleteProject(p.id!)"
              *ngIf="p.status === 'OPEN' || p.status === 'DRAFT'">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════
         DELIVERY REVIEW MODAL
    ═══════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showDeliveryModal" (click)="closeModal()">
      <div class="modal-box" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">📦</span>
            <div>
              <h3>Review Delivery</h3>
              <p>{{ selectedProject?.title }}</p>
            </div>
          </div>
          <button class="modal-close" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="delivery-section" *ngIf="selectedProject?.deliveryLink">
            <label class="delivery-label">🔗 Delivery Link</label>
            <a [href]="selectedProject!.deliveryLink" target="_blank" class="delivery-link">
              {{ selectedProject!.deliveryLink }} <span>↗</span>
            </a>
          </div>

          <div class="delivery-section" *ngIf="selectedProject?.deliveryMessage">
            <label class="delivery-label">💬 Freelancer's Message</label>
            <div class="delivery-message">{{ selectedProject!.deliveryMessage }}</div>
          </div>

          <div class="delivery-empty"
               *ngIf="!selectedProject?.deliveryLink && !selectedProject?.deliveryMessage">
            <p>📎 No delivery link or message provided.</p>
          </div>

          <div class="revision-section" *ngIf="showRevisionInput">
            <label class="delivery-label">✏️ Revision Request</label>
            <textarea class="revision-textarea" [(ngModel)]="revisionMessage"
              placeholder="Describe what needs to be changed..." rows="3"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <ng-container *ngIf="!showRevisionInput">
            <button class="btn-revision-toggle" (click)="showRevisionInput = true">
              🔁 Request Revision
            </button>
            <button class="btn-confirm-modal" (click)="confirmDelivery()">
              ✅ Confirm & Complete
            </button>
          </ng-container>
          <ng-container *ngIf="showRevisionInput">
            <button class="btn-cancel-revision" (click)="showRevisionInput = false; revisionMessage = ''">
              Cancel
            </button>
            <button class="btn-send-revision" (click)="requestRevision()"
              [disabled]="!revisionMessage.trim()">
              Send Revision Request
            </button>
          </ng-container>
        </div>

      </div>
    </div>

    <!-- PAYMENT MODAL -->
    <app-payment-modal
      *ngIf="showPaymentModal"
      [projectTitle]="selectedProject?.title ?? ''"
      [budget]="selectedProject?.budget ?? 0"
      [cardHolder]="authService.currentUser?.firstName ?? 'CLIENT'"
      (cancel)="onPaymentDone()"
      (confirm)="onPaymentConfirm()"
      (done)="onPaymentDone()"
      #paymentModal
    ></app-payment-modal>

    <div class="modal-backdrop" *ngIf="showEditModal" (click)="closeEditModal()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title"><span class="modal-icon">✏️</span><div><h3>Edit Project</h3><p>{{ editingProject?.title }}</p></div></div>
          <button class="modal-close" (click)="closeEditModal()">✕</button>
        </div>
        <div class="modal-body">
          <input class="form-input" placeholder="Project title *" [(ngModel)]="editProject.title">
          <input class="form-input" type="number" placeholder="Budget (TND)" [(ngModel)]="editProject.budget">
          <input class="form-input" type="date" [(ngModel)]="editProject.deadline">
          <textarea class="form-input form-textarea" placeholder="Description" [(ngModel)]="editProject.description"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel-revision" (click)="closeEditModal()">Cancel</button>
          <button class="btn-confirm-modal" (click)="saveProjectEdit()" [disabled]="isSavingEdit">
            {{ isSavingEdit ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./projects.component.scss']
})
export class ClProjectsComponent implements OnInit {
  projects:   Project[]       = [];
  filtered:   Project[]       = [];
  categories: CategoryModel[] = [];

  isLoading    = true;
  showForm     = false;
  isCreating   = false;
  isGenerating = false;
  createError  = '';
  aiError      = '';
  activeFilter = 'ALL';
  skillsInput  = '';

  statuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

  newProject: Partial<Project> = { title: '', description: '', category: undefined, status: 'OPEN' };

  // ── Delivery modal ──────────────────────────────
  showDeliveryModal  = false;
  showPaymentModal   = false;
  showPaymentSuccess = false;
  paymentResult:     any = null;
  isConfirming       = false;
  selectedProject:   any = null;
  showRevisionInput  = false;
  revisionMessage    = '';
  showEditModal      = false;
  isSavingEdit       = false;
  editingProject: Project | null = null;
  editProject: Partial<Project> = {};

  @ViewChild('paymentModal') paymentModalRef: any;

  get deliveredProjects(): Project[] {
    return this.projects.filter(p => p.status === 'DELIVERED');
  }

  private api = environment.apiUrl;

  constructor(
    public  authService:     AuthService,
    private projectService:  ProjectService,
    private categoryService: CategoryService,
    private http:            HttpClient,
    private router:          Router,
  ) {}

  ngOnInit(): void { this.load(); this.loadCategories(); }

  load(): void {
    const userId = this.authService.currentUser?.id;
    this.projectService.getAll(undefined, userId).subscribe({
      next: p => { this.projects = p; this.applyFilter(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  loadCategories(): void {
    this.categoryService.getActive().subscribe({
      next: (cats) => {
        this.categories = cats;
        if (cats.length > 0 && !this.newProject.category)
          this.newProject.category = cats[0].name;
      },
      error: () => {}
    });
  }

  generateDescription(): void {
    if (!this.newProject.title?.trim()) { this.aiError = 'Please enter a project title first.'; return; }
    this.isGenerating = true; this.aiError = '';
    this.http.post<{ description: string }>(`${this.api}/ai/generate-description`, {
      title: this.newProject.title, category: this.newProject.category || ''
    }).subscribe({
      next: (res) => {
        const text = String(res?.description ?? '');
        const aiFailed = /erreur|unexpected|inattendue/i.test(text) || !text.trim();
        this.newProject.description = aiFailed ? '' : text;
        this.aiError = aiFailed ? 'Groq could not generate a description right now. Please retry.' : '';
        this.isGenerating = false;
      },
      error: (_err: any) => {
        this.newProject.description = '';
        this.aiError = 'Groq service unavailable. Please retry.';
        this.isGenerating = false;
      }
    });
  }

  setFilter(s: string): void { this.activeFilter = s; this.applyFilter(); }

  applyFilter(): void {
    this.filtered = this.activeFilter === 'ALL'
      ? this.projects
      : this.projects.filter(p => p.status === this.activeFilter);
  }

  prediction: any = null;
  isPredicting = false;
  predictionError = '';

  private buildLocalPrediction(category: string, skills: string[]): any {
    const byCategory: Record<string, { budget: number; days: number }> = {
      'web development': { budget: 900, days: 18 },
      'mobile development': { budget: 1200, days: 24 },
      'design': { budget: 500, days: 10 },
      'marketing': { budget: 450, days: 12 },
      'writing': { budget: 280, days: 7 },
      'data': { budget: 800, days: 16 },
      'ai': { budget: 1400, days: 26 }
    };
    const key = String(category || '').toLowerCase().trim();
    const base = byCategory[key] ?? { budget: 700, days: 14 };
    const skillFactor = Math.max(0, Math.min(6, skills.length)) * 0.08;
    const knownCategory = !!byCategory[key];
    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
      knownCategory && skills.length >= 3 ? 'HIGH' :
      (knownCategory || skills.length >= 1) ? 'MEDIUM' : 'LOW';

    const factors = confidence === 'HIGH'
      ? { budgetMin: 0.9, budgetMax: 1.12, daysMin: 0.88, daysMax: 1.18 }
      : confidence === 'LOW'
      ? { budgetMin: 0.75, budgetMax: 1.35, daysMin: 0.7, daysMax: 1.45 }
      : { budgetMin: 0.85, budgetMax: 1.2, daysMin: 0.8, daysMax: 1.3 };

    const recBudget = Math.round(base.budget * (1 + skillFactor));
    const minBudget = Math.max(100, Math.round(recBudget * factors.budgetMin));
    const maxBudget = Math.round(recBudget * factors.budgetMax);
    const recDays = Math.max(3, Math.round(base.days * (1 + skillFactor * 0.7)));
    const minDays = Math.max(2, Math.round(recDays * factors.daysMin));
    const maxDays = Math.round(recDays * factors.daysMax);

    return {
      budget: {
        min: minBudget,
        max: maxBudget,
        average: recBudget,
        median: recBudget,
        recommended: recBudget,
        confidence,
        basedOn: 0,
        message: 'Estimated from category and required skills.'
      },
      deadline: {
        minDays,
        maxDays,
        medianDays: recDays,
        recommendedDays: recDays,
        onTimeRate: 0.8,
        confidence,
        basedOn: 0,
        message: 'Estimated from category and required skills.'
      }
    };
  }

  loadPrediction() {
    this.isPredicting = true;
    this.prediction = null;
    this.predictionError = '';
    const skills = this.skillsInput ? this.skillsInput.split(",").map((s: string) => s.trim()) : [];
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    this.http.get<any>(
      `${this.api}/predictions/all?category=${encodeURIComponent(String(this.newProject.category ?? ''))}&skills=${encodeURIComponent(skills.join(","))}`,
      { headers }
    ).subscribe({
      next: (data) => {
        if (!data?.budget || !data?.deadline) {
          this.prediction = this.buildLocalPrediction(String(this.newProject.category ?? ''), skills);
          this.predictionError = 'Prediction service unavailable. Showing smart local estimate.';
        } else {
          this.prediction = data;
          // Auto-fill recommended values so budget/deadline are saved in DB.
          this.applyBudget();
          this.applyDeadline();
        }
        this.isPredicting = false;
      },
      error: () => {
        this.prediction = this.buildLocalPrediction(String(this.newProject.category ?? ''), skills);
        this.predictionError = 'Prediction service unavailable. Showing smart local estimate.';
        this.isPredicting = false;
      }
    });
  }

  applyBudget() {
    if (this.prediction) this.newProject.budget = this.prediction.budget.recommended;
  }

  applyDeadline() {
    if (this.prediction) {
      const d = new Date();
      d.setDate(d.getDate() + this.prediction.deadline.recommendedDays);
      this.newProject.deadline = d.toISOString().split("T")[0];
    }
  }

  createProject(): void {
    if (!this.newProject.title?.trim())       { this.createError = 'Title is required';        return; }
    if (!this.newProject.description?.trim()) { this.createError = 'Description is required';  return; }
    if (!this.newProject.category)            { this.createError = 'Please select a category'; return; }
    this.isCreating = true; this.createError = '';
    const payload: any = {
      title:          this.newProject.title!.trim(),
      description:    this.newProject.description!.trim(),
      category:       this.newProject.category,
      status:         'OPEN',
      clientId:       this.authService.currentUser?.id,
      clientEmail:    this.authService.currentUser?.email,
      requiredSkills: this.skillsInput
        ? this.skillsInput.split(',').map(s => s.trim()).filter(s => s)
        : [],
    };
    if (this.newProject.budget)   payload['budget']   = this.newProject.budget;
    if (this.newProject.deadline) payload['deadline']  = this.newProject.deadline;
    this.projectService.create(payload).subscribe({
      next: () => {
        this.showForm    = false;
        this.newProject  = { title: '', description: '', category: this.categories[0]?.name, status: 'OPEN' };
        this.skillsInput = ''; this.isCreating = false; this.createError = '';
        this.load();
      },
      error: (err: any) => {
        this.createError = err?.error?.message || err?.error?.error || 'Error creating project';
        this.isCreating  = false;
      }
    });
  }

  deleteProject(id: number): void {
    if (!confirm('Delete this project?')) return;
    this.projectService.delete(id).subscribe(() => this.load());
  }

  viewProposals(projectId: number): void {
    window.location.href = `/client/proposals?projectId=${projectId}`;
  }

  // ── Navigate to Escrow Payment page ──────────────
  goToEscrowPayment(projectId: number): void {
    this.router.navigate(['/client/projects/payment', projectId]);
  }

  // ── Delivery modal ────────────────────────────────
  openDeliveryModal(project: any): void {
    this.selectedProject   = project;
    this.showDeliveryModal = true;
    this.showRevisionInput = false;
    this.revisionMessage   = '';
  }

  closeModal(): void {
    this.showDeliveryModal = false;
    this.selectedProject   = null;
  }

  confirmDelivery(): void {
    this.showDeliveryModal = false;
    this.showPaymentModal  = true;
  }

  onPaymentConfirm(): void {
    if (!this.selectedProject) return;
    this.projectService.completeProject(
      this.selectedProject.id,
      Number(this.authService.currentUser!.id),
      this.selectedProject.acceptedProposalId ?? 0
    ).subscribe({
      next: (_res: any) => {
        if (this.paymentModalRef) this.paymentModalRef.showSuccess();
        this.load();
      },
      error: (err: any) => {
        console.error('Payment error', err);
        this.showPaymentModal = false;
      }
    });
  }

  onPaymentDone(): void {
    this.showPaymentModal = false;
    this.selectedProject  = null;
  }

  requestRevision(): void {
    if (!this.selectedProject || !this.revisionMessage.trim()) return;
    this.projectService.requestRevision(
      this.selectedProject.id,
      this.revisionMessage,
      Number(this.authService.currentUser!.id)
    ).subscribe({
      next: () => { this.closeModal(); this.load(); },
      error: (err: any) => console.error('Revision error', err)
    });
  }

  getStatusClass(s: string): string {
    const m: any = {
      OPEN:        'status-open',
      IN_PROGRESS: 'status-progress',
      DELIVERED:   'status-delivered',
      COMPLETED:   'status-done',
      CANCELLED:   'status-cancel',
      DRAFT:       'status-draft'
    };
    return m[s] || '';
  }

  openEditModal(project: Project): void {
    this.editingProject = project;
    this.editProject = {
      title: project.title,
      description: project.description,
      budget: project.budget,
      deadline: project.deadline,
      category: project.category,
      budgetType: project.budgetType,
      requiredSkills: project.requiredSkills,
      duration: project.duration,
      experienceLevel: project.experienceLevel
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingProject = null;
    this.editProject = {};
  }

  saveProjectEdit(): void {
    if (!this.editingProject?.id) return;
    this.isSavingEdit = true;
    this.projectService.update(this.editingProject.id, this.editProject).subscribe({
      next: () => {
        this.isSavingEdit = false;
        this.closeEditModal();
        this.load();
      },
      error: () => {
        this.isSavingEdit = false;
      }
    });
  }
}