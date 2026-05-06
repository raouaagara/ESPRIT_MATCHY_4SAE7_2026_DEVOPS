import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { ProposalService } from '../../core/services/proposal.service';
import { Project, ProposalOptimizerResult } from '../../core/models/models';
import { environment } from '../../_env/environment';

@Component({
  selector: 'app-fl-projects',
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">Browse Projects</h1><p class="page-sub">Find your next opportunity</p></div>
      </div>

      <!-- MATCHING RECOMMENDATIONS -->
      <div class="matching-section" *ngIf="recommendations.length > 0">
        <div class="matching-header">
          <h2 class="matching-title">Recommended for You</h2>
          <span class="matching-sub">Based on your skills and experience</span>
        </div>
        <div class="matching-grid">
          <div class="match-card" *ngFor="let m of recommendations">
            <div class="match-top">
              <span class="match-category">{{ m.freelancerSkills }}</span>
              <span class="match-score" [class]="getScoreClass(m.totalScore)">{{ m.totalScore }}% match</span>
            </div>
            <h3 class="match-title">{{ m.freelancerName }}</h3>
            <div class="match-skills" *ngIf="m.matchedSkills">
              <span class="match-skills-label">&#10003; Your skills match:</span>
              <span class="match-skills-tags">{{ m.matchedSkills }}</span>
            </div>
            <div class="match-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">Skills</span>
                <div class="breakdown-bar"><div class="breakdown-fill skills" [style.width.%]="(m.skillsScore / 40) * 100"></div></div>
                <span class="breakdown-val">{{ m.skillsScore }}/40</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Budget</span>
                <div class="breakdown-bar"><div class="breakdown-fill budget" [style.width.%]="(m.budgetScore / 25) * 100"></div></div>
                <span class="breakdown-val">{{ m.budgetScore }}/25</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Experience</span>
                <div class="breakdown-bar"><div class="breakdown-fill experience" [style.width.%]="(m.experienceScore / 20) * 100"></div></div>
                <span class="breakdown-val">{{ m.experienceScore }}/20</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Activity</span>
                <div class="breakdown-bar"><div class="breakdown-fill activity" [style.width.%]="(m.activityScore / 15) * 100"></div></div>
                <span class="breakdown-val">{{ m.activityScore }}/15</span>
              </div>
            </div>
            <div class="match-footer">
              <span class="recommendation-badge" [class]="getRecoClass(m.recommendation)">{{ m.recommendation }}</span>
              <button class="btn-apply-match" (click)="openProposalModalById(m.freelancerId)" [disabled]="alreadyApplied(m.freelancerId)">
                {{ alreadyApplied(m.freelancerId) ? 'Applied' : 'Apply Now' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ADVANCED SEARCH & FILTER -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="search-wrap">
            <span class="search-icon" style="font-size:13px;opacity:0.5">&#9906;</span>
            <input class="search-input" placeholder="Search by title, description, skills..." [(ngModel)]="searchTerm" (input)="applyFilter()">
          </div>
          <select class="form-select" [(ngModel)]="categoryFilter" (change)="applyFilter()">
            <option value="">All categories</option>
            <option *ngFor="let c of categories">{{ c }}</option>
          </select>
          <select class="form-select" [(ngModel)]="sortBy" (change)="applyFilter()">
            <option value="newest">Newest first</option>
            <option value="budget-high">Budget: High to Low</option>
            <option value="budget-low">Budget: Low to High</option>
            <option value="proposals">Fewest proposals</option>
          </select>
        </div>

        <div class="filter-row filter-row-2">
          <div class="budget-slider-wrap">
            <span class="budget-slider-label">Budget max (TND)</span>
            <div class="budget-slider-values">
              <span>0 TND</span>
              <span class="slider-max-val">{{ budgetMax ? budgetMax + " TND max" : "No limit" }}</span>
            </div>
            <input type="range" min="0" [max]="getSliderMax()" step="100"
              [value]="budgetMax ? getSliderMax() - budgetMax : 0"
              (input)="sliderMax = +$any($event.target).value; onSliderChange()">
          </div>
          <select class="form-select" [(ngModel)]="experienceFilter" (change)="applyFilter()">
            <option value="">Any experience level</option>
            <option value="JUNIOR">Junior</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="SENIOR">Senior</option>
            <option value="EXPERT">Expert</option>
          </select>
          <select class="form-select" [(ngModel)]="budgetTypeFilter" (change)="applyFilter()">
            <option value="">Any budget type</option>
            <option value="FIXED">Fixed price</option>
            <option value="HOURLY">Hourly rate</option>
          </select>
          <button class="btn-reset" (click)="resetFilters()" *ngIf="hasActiveFilters()">
            &#10005; Reset filters
          </button>
        </div>

        <div class="filter-summary" *ngIf="hasActiveFilters()">
          <span class="filter-count">{{ filtered.length }} project{{ filtered.length !== 1 ? 's' : '' }} found</span>
          <span class="filter-tag" *ngIf="categoryFilter">{{ categoryFilter }} <button (click)="categoryFilter=''; applyFilter()">&#10005;</button></span>
          <span class="filter-tag" *ngIf="budgetMin">Min {{ budgetMin }} TND <button (click)="budgetMin=null; applyFilter()">&#10005;</button></span>
          <span class="filter-tag" *ngIf="budgetMax">Max {{ budgetMax }} TND <button (click)="budgetMax=null; applyFilter()">&#10005;</button></span>
          <span class="filter-tag" *ngIf="experienceFilter">{{ experienceFilter }} <button (click)="experienceFilter=''; applyFilter()">&#10005;</button></span>
          <span class="filter-tag" *ngIf="budgetTypeFilter">{{ budgetTypeFilter }} <button (click)="budgetTypeFilter=''; applyFilter()">&#10005;</button></span>
        </div>
      </div>

      <div class="loading-state" *ngIf="isLoading"><div class="spinner"></div><span>Loading projects...</span></div>

      <div class="project-grid" *ngIf="!isLoading">
        <div class="empty" *ngIf="filtered.length === 0">No projects found matching your criteria.</div>
        <div class="project-card" *ngFor="let p of filtered">
          <div class="card-top">
            <span class="category-tag">{{ p.category }}</span>
            <span class="budget-tag" *ngIf="p.budget">{{ p.budget }} TND</span>
          </div>
          <h3 class="card-title">{{ p.title }}</h3>
          <p class="card-desc">{{ p.description }}</p>
          <div class="skills-row" *ngIf="p.requiredSkills && p.requiredSkills.length > 0">
            <span class="skill-tag" *ngFor="let s of p.requiredSkills">{{ s }}</span>
          </div>
          <div class="card-meta">
            <span *ngIf="p.deadline">Deadline: {{ p.deadline | date:'dd/MM/yyyy' }}</span>
            <span>{{ p.proposalsCount || 0 }} proposals</span>
          </div>
          <button class="btn-predict" (click)="predictSuccess(p)" [disabled]="loadingPrediction.has(p.id!)">
            {{ loadingPrediction.has(p.id!) ? 'Analyzing...' : 'Predict My Chances' }}
          </button>
          <div class="prediction-result" *ngIf="predictions.has(p.id!)">
            <div class="pred-header">
              <div class="pred-score-wrap">
                <svg class="pred-ring" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e9ecef" stroke-width="5"/>
                  <circle cx="28" cy="28" r="24" fill="none"
                    [attr.stroke]="getPredictionColor(p.id!)"
                    stroke-width="5" stroke-linecap="round"
                    stroke-dasharray="150.8"
                    [attr.stroke-dashoffset]="150.8 - (predictions.get(p.id!)!.finalScore / 100) * 150.8"
                    transform="rotate(-90 28 28)"/>
                </svg>
                <div class="pred-score-text">
                  <span class="pred-pct" [style.color]="getPredictionColor(p.id!)">
                    {{ predictions.get(p.id!)!.finalScore }}%
                  </span>
                </div>
              </div>
              <div class="pred-level-wrap">
                <span class="pred-level-badge" [ngClass]="getPredLevelClass(p.id!)">
                  {{ getPredictionLevelEn(predictions.get(p.id!)!.predictionLevel) }}
                </span>
                <span class="pred-label">Success Prediction</span>
              </div>
            </div>
            <div class="pred-bars">
              <div class="pred-bar-item" *ngFor="let bar of getPredBars(p.id!)">
                <span class="pred-bar-label">{{ bar.label }}</span>
                <div class="pred-bar-track">
                  <div class="pred-bar-fill" [style.width]="bar.value + '%'" [style.background]="bar.color"></div>
                </div>
                <span class="pred-bar-val">{{ bar.value }}%</span>
              </div>
            </div>
            <div class="pred-advice" *ngIf="predictions.get(p.id!)!.advice">
              <span class="pred-advice-icon">&#128161;</span>
              <span>{{ translateAdvice(predictions.get(p.id!)!.advice) }}</span>
            </div>
          </div>
          <button class="btn-apply" (click)="openProposalModal(p)" [disabled]="alreadyApplied(p.id!)">
            {{ alreadyApplied(p.id!) ? 'Applied' : 'Apply Now' }}
          </button>
        </div>
      </div>

      <!-- PROPOSAL MODAL -->
      <div class="modal-overlay" *ngIf="selectedProject" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()" *ngIf="selectedProject as proj">
          <div class="modal-header">
            <div class="modal-header-inner">
              <div>
                <p class="modal-eyebrow">Submit your proposal</p>
                <h3 class="modal-title">{{ proj.title }}</h3>
                <span class="modal-category">{{ proj.category }}</span>
              </div>
              <button class="modal-close" (click)="closeModal()">&#10005;</button>
            </div>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <div class="field-header">
                <label>Cover Letter *</label>
                <button class="btn-ai" (click)="generateCoverLetter()" [disabled]="isGenerating" [class.loading]="isGenerating">
                  &#10024; {{ isGenerating ? 'Generating...' : 'Generate with AI' }}
                </button>
              </div>
              <textarea class="form-input form-textarea"
                placeholder="Why are you the best fit for this project?"
                [(ngModel)]="proposal.coverLetter"
                (input)="onProposalFieldChange()"></textarea>
              <div class="ai-error" *ngIf="aiError">{{ aiError }}</div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Your Budget (TND)</label>
                <input class="form-input" type="number" placeholder="Proposed budget" [(ngModel)]="proposal.proposedBudget" (input)="onProposalFieldChange()">
              </div>
              <div class="form-group">
                <label>Delivery Time</label>
                <input class="form-input" placeholder="e.g. 2 weeks" [(ngModel)]="proposal.deliveryTime">
              </div>
            </div>
            <div class="prediction-result" *ngIf="proposalOptimizer">
              <div class="pred-header">
                <div class="pred-level-wrap">
                  <span class="pred-level-badge" [class]="proposalOptimizer.totalScore >= 80 ? 'level-high' : (proposalOptimizer.totalScore >= 60 ? 'level-medium' : 'level-low')">
                    {{ proposalOptimizer.totalScore }} / 100
                  </span>
                  <span class="pred-label">Proposal Quality Score</span>
                </div>
              </div>
              <div class="pred-bars">
                <div class="pred-bar-item" *ngFor="let item of optimizerBars()">
                  <span class="pred-bar-label">{{ item.label }}</span>
                  <div class="pred-bar-track">
                    <div class="pred-bar-fill" [style.width.%]="item.value" [style.background]="item.color"></div>
                  </div>
                  <span class="pred-bar-val">{{ item.value }}</span>
                </div>
              </div>
              <div class="pred-advice" *ngFor="let tip of proposalOptimizer.suggestions">
                <span class="pred-advice-icon">💡</span>
                <span>{{ tip }}</span>
              </div>
            </div>
            <div class="error" *ngIf="submitError">{{ submitError }}</div>
          </div>
          <div class="modal-footer">
            <span class="footer-hint">Client will be notified</span>
            <div class="footer-btns">
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button class="btn-submit" (click)="submitProposal()" [disabled]="isSubmitting">
                {{ isSubmitting ? 'Sending...' : 'Submit Proposal' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./projects.component.scss']
})
export class FlProjectsComponent implements OnInit {
  projects: Project[] = [];
  filtered: Project[] = [];
  recommendations: any[] = [];
  appliedProjectIds: Set<number> = new Set();
  isLoading = true;

  searchTerm       = '';
  categoryFilter   = '';
  sortBy           = 'newest';
  budgetMin: number | null = null;
  budgetMax: number | null = null;
  experienceFilter = '';
  budgetTypeFilter = '';
  sliderMax = 10000;
  categories: string[] = [];

  selectedProject: Project | null = null;
  isSubmitting = false;
  isGenerating = false;
  submitError  = '';
  aiError      = '';
  predictions: Map<number, any> = new Map();
  loadingPrediction: Set<number> = new Set();
  proposal = { coverLetter: '', proposedBudget: 0, deliveryTime: '' };
  proposalOptimizer: ProposalOptimizerResult | null = null;
  private optimizeTimer: any = null;

  private api = environment.apiUrl;

  constructor(
    public authService: AuthService,
    private projectService: ProjectService,
    private proposalService: ProposalService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.authService.checkAuth();
    this.projectService.getOpen().subscribe({
      next: p => {
        this.projects   = p;
        this.categories = [...new Set(p.map(proj => proj.category).filter(c => c))].sort();
        this.sliderMax = 0;
        this.budgetMax = null;
        this.applyFilter();
        this.isLoading  = false;
      },
      error: () => { this.isLoading = false; }
    });
    const userId = this.authService.currentUser?.id;
    if (userId) {
      this.proposalService.getAll(undefined, userId).subscribe(proposals => {
        proposals.forEach(p => { if (p.projectId) this.appliedProjectIds.add(p.projectId); });
      });
      this.loadRecommendations(userId);
    }
  }

  loadRecommendations(userId: number | string): void {
    this.http.get<any[]>(`${this.api}/matching/freelancer/${userId}`)
      .subscribe({ next: d => { this.recommendations = d.slice(0, 3); }, error: () => { this.recommendations = []; } });
  }

  openProposalModalById(projectId: number): void {
    const project = this.projects.find(p => p.id === projectId);
    if (project) this.openProposalModal(project);
  }

  applyFilter(): void {
    let list = [...this.projects];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.requiredSkills || []).some(s => s.toLowerCase().includes(term))
      );
    }
    if (this.categoryFilter) list = list.filter(p => p.category === this.categoryFilter);
    if (this.budgetMin != null && this.budgetMin > 0) list = list.filter(p => p.budget != null && p.budget >= this.budgetMin!);
    if (this.budgetMax != null && this.budgetMax > 0) list = list.filter(p => p.budget != null && p.budget <= this.budgetMax!);
    if (this.experienceFilter) list = list.filter(p => p.experienceLevel === this.experienceFilter);
    if (this.budgetTypeFilter) list = list.filter(p => p.budgetType === this.budgetTypeFilter);
    switch (this.sortBy) {
      case 'budget-high': list.sort((a, b) => (b.budget || 0) - (a.budget || 0)); break;
      case 'budget-low':  list.sort((a, b) => (a.budget || 0) - (b.budget || 0)); break;
      case 'proposals':   list.sort((a, b) => (a.proposalsCount || 0) - (b.proposalsCount || 0)); break;
      default:            list.sort((a, b) => (b.createdAt || '') > (a.createdAt || '') ? 1 : -1);
    }
    this.filtered = list;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.categoryFilter || this.budgetMin || this.budgetMax || this.experienceFilter || this.budgetTypeFilter);
  }

  resetFilters(): void {
    this.searchTerm = ''; this.categoryFilter = ''; this.budgetMin = null;
    this.budgetMax  = null; this.experienceFilter = ''; this.budgetTypeFilter = '';
    this.sortBy = 'newest'; this.sliderMax = 0; this.applyFilter();
  }

  alreadyApplied(id: number): boolean { return this.appliedProjectIds.has(id); }

  openProposalModal(p: Project): void {
    this.selectedProject = p;
    this.proposal = { coverLetter: '', proposedBudget: p.budget || 0, deliveryTime: '' };
    this.submitError = ''; this.aiError = '';
    this.proposalOptimizer = null;
    this.runProposalOptimizer();
  }

  closeModal(): void {
    this.selectedProject = null;
    this.proposalOptimizer = null;
    if (this.optimizeTimer) {
      clearTimeout(this.optimizeTimer);
      this.optimizeTimer = null;
    }
  }

  generateCoverLetter(): void {
    if (!this.selectedProject) return;
    this.isGenerating = true; this.aiError = '';
    const user = this.authService.currentUser;
    const prompt = `Write a professional freelance cover letter for this project:
Title: ${this.selectedProject.title}
Category: ${this.selectedProject.category}
Description: ${this.selectedProject.description || ''}
${this.selectedProject.requiredSkills?.length ? 'Required skills: ' + this.selectedProject.requiredSkills.join(', ') : ''}
${this.selectedProject.budget ? 'Budget: ' + this.selectedProject.budget + ' TND' : ''}
Freelancer: ${user?.firstName || user?.name || 'the freelancer'}
Skills: ${user?.skills || 'various skills'}
Requirements: 3-4 sentences, professional, mention relevant experience, write in English only.`;
    this.http.post<{ description: string }>(`${this.api}/ai/generate-description`, {
      title: prompt, category: this.selectedProject.category
    }).subscribe({
      next: res => {
        const text = String(res?.description ?? '');
        const aiFailed = /erreur|unexpected|inattendue/i.test(text) || !text.trim();
        this.proposal.coverLetter = aiFailed ? '' : text;
        this.aiError = aiFailed ? 'Groq could not generate a cover letter right now. Please retry.' : '';
        if (!aiFailed) this.onProposalFieldChange();
        this.isGenerating = false;
      },
      error: _err => {
        this.proposal.coverLetter = '';
        this.aiError = 'Groq service unavailable. Please retry.';
        this.isGenerating = false;
      }
    });
  }

  onProposalFieldChange(): void {
    if (this.optimizeTimer) clearTimeout(this.optimizeTimer);
    this.optimizeTimer = setTimeout(() => this.runProposalOptimizer(), 350);
  }

  runProposalOptimizer(): void {
    if (!this.selectedProject) return;
    const hasContent = !!(this.proposal.coverLetter?.trim() || this.proposal.proposedBudget);
    if (!hasContent) {
      this.proposalOptimizer = null;
      return;
    }
    this.http.post<ProposalOptimizerResult>(`${this.api}/proposals/optimizer`, {
      projectId: this.selectedProject.id,
      projectTitle: this.selectedProject.title,
      projectDescription: this.selectedProject.description,
      projectBudget: this.selectedProject.budget,
      coverLetter: this.proposal.coverLetter,
      proposedBudget: this.proposal.proposedBudget
    }).subscribe({
      next: result => { this.proposalOptimizer = result; },
      error: () => {}
    });
  }

  optimizerBars(): { label: string; value: number; color: string }[] {
    if (!this.proposalOptimizer) return [];
    return [
      { label: 'Clarity', value: this.proposalOptimizer.breakdown.clarity, color: '#6366f1' },
      { label: 'Personalization', value: this.proposalOptimizer.breakdown.personalization, color: '#22c55e' },
      { label: 'Budget', value: this.proposalOptimizer.breakdown.budgetCoherence, color: '#f59e0b' },
      { label: 'CTA', value: this.proposalOptimizer.breakdown.cta, color: '#06b6d4' }
    ];
  }

  submitProposal(): void {
    if (!this.proposal.coverLetter) { this.submitError = 'Please write a cover letter'; return; }
    this.isSubmitting = true; this.submitError = '';
    const user = this.authService.currentUser;
    const payload = {
      projectId: this.selectedProject!.id, projectTitle: this.selectedProject!.title,
      freelancerId: user?.id, freelancerName: user?.name, freelancerEmail: user?.email,
      clientId: this.selectedProject!.clientId, clientEmail: this.selectedProject!.clientEmail,
      coverLetter: this.proposal.coverLetter, proposedBudget: this.proposal.proposedBudget,
      deliveryTime: this.proposal.deliveryTime, status: 'PENDING' as const
    };
    this.proposalService.create(payload).subscribe({
      next: () => { this.appliedProjectIds.add(this.selectedProject!.id!); this.isSubmitting = false; this.closeModal(); },
      error: (err) => {
        this.submitError =
          err?.error?.message ||
          err?.error?.error ||
          (err?.status === 403 ? 'Maximum 5 active projects reached.' : 'Error submitting proposal');
        this.isSubmitting = false;
      }
    });
  }

  onSliderChange(): void {
    const max = this.getSliderMax();
    const inverted = max - this.sliderMax;
    this.budgetMax = (inverted >= max) ? null : inverted;
    this.applyFilter();
  }

  getSliderMax(): number {
    return this.projects.length > 0
      ? Math.max(...this.projects.map(p => p.budget || 0))
      : 10000;
  }

  getScoreClass(score: number): string {
    if (score >= 75) return 'score-excellent';
    if (score >= 50) return 'score-good';
    if (score >= 25) return 'score-fair';
    return 'score-low';
  }

  getRecoClass(reco: string): string {
    if (reco === 'Excellent Match') return 'reco-excellent';
    if (reco === 'Good Match')      return 'reco-good';
    if (reco === 'Fair Match')      return 'reco-fair';
    return 'reco-low';
  }

  predictSuccess(project: Project): void {
    const userId = this.authService.currentUser?.id;
    if (!userId || !project.id) return;
    this.loadingPrediction.add(project.id);
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    this.http.post<any>(`${this.api}/predictions/${userId}/${project.id}`, {}, { headers }).subscribe({
      next: data => { this.predictions.set(project.id!, data); this.loadingPrediction.delete(project.id!); },
      error: () => { this.loadingPrediction.delete(project.id!); }
    });
  }

  getPredictionColor(projectId: number): string {
    const p = this.predictions.get(projectId);
    if (!p) return '#667eea';
    const lvl = (p.predictionLevel || '').toUpperCase();
    if (lvl.includes('LEV') || lvl === 'ELEVE') return '#22c55e';
    if (lvl === 'MOYEN') return '#f59e0b';
    return '#ef4444';
  }

  getPredLevelClass(projectId: number): string {
    const p = this.predictions.get(projectId);
    if (!p) return '';
    const lvl = (p.predictionLevel || '').toUpperCase();
    if (lvl.includes('LEV') || lvl === 'ELEVE') return 'level-high';
    if (lvl === 'MOYEN') return 'level-medium';
    return 'level-low';
  }

  getPredictionLevelEn(level: string): string {
    if (!level) return '';
    const lvl = level.toUpperCase();
    if (lvl.includes('LEV') || lvl === 'ELEVE') return 'HIGH';
    if (lvl === 'MOYEN') return 'MEDIUM';
    return 'LOW';
  }

  getPredBars(projectId: number): { label: string; value: number; color: string }[] {
    const p = this.predictions.get(projectId);
    if (!p) return [];
    return [
      { label: 'Skills',       value: Math.round(p.skillsScore      ?? 0), color: '#6366f1' },
      { label: 'Experience',   value: Math.round(p.experienceScore  ?? 0), color: '#f59e0b' },
      { label: 'Reputation',   value: Math.round(p.reputationScore  ?? 0), color: '#22c55e' },
      { label: 'Success Rate', value: Math.round(p.successRateScore ?? 0), color: '#06b6d4' },
    ];
  }

  translateAdvice(advice: string): string {
    if (!advice) return '';
    return advice
      .replace(/Ameliorez vos competences/g, 'Improve your skills')
      .replace(/Completez plus de projets/g, 'Complete more projects')
      .replace(/Travaillez sur votre reputation/g, 'Work on your reputation')
      .replace(/Excellent profil/g, 'Excellent profile')
      .replace(/Bon profil/g, 'Good profile')
      .replace(/Continuez a ameliorer/g, 'Keep improving your profile')
      .replace(/ \| /g, ' · ');
  }
}