import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

interface Badge {
  id: number;
  userId: number;
  type: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

@Component({
  selector: 'app-gamification',
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Badges</h1>
          <p class="page-sub">Your achievements on Matchy</p>
        </div>
      </div>

      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Loading badges...</span>
      </div>

      <div *ngIf="!isLoading">

        <div class="summary-card">
          <div class="summary-icon">🏆</div>
          <div class="summary-info">
            <div class="summary-count">{{ badges.length }}</div>
            <div class="summary-label">Badges Earned</div>
          </div>
          <div class="summary-info">
            <div class="summary-count">{{ allBadges.length - badges.length }}</div>
            <div class="summary-label">Badges Remaining</div>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-label">Overall Progress</div>
            <div class="progress-track">
              <div class="progress-fill" [style.width]="getProgress() + '%'"></div>
            </div>
            <div class="progress-pct">{{ getProgress() }}%</div>
          </div>
        </div>

        <div class="section-title" *ngIf="badges.length > 0">✅ Earned Badges</div>
        <div class="badges-grid" *ngIf="badges.length > 0">
          <div class="badge-card earned" *ngFor="let badge of badges">
            <div class="badge-icon">{{ badge.icon }}</div>
            <div class="badge-title">{{ badge.title }}</div>
            <div class="badge-desc">{{ badge.description }}</div>
            <div class="badge-date">{{ badge.earnedAt | date:'dd/MM/yyyy' }}</div>
          </div>
        </div>

        <div class="section-title">🔒 Badges to Unlock</div>
        <div class="badges-grid">
          <div class="badge-card locked" *ngFor="let badge of getLockedBadges()">
            <div class="badge-icon locked-icon">{{ badge.icon }}</div>
            <div class="badge-title">{{ badge.title }}</div>
            <div class="badge-desc">{{ badge.description }}</div>
            <div class="badge-date">Not yet earned</div>
          </div>
        </div>

        <div class="empty" *ngIf="badges.length === 0">
          <div class="empty-icon">🌱</div>
          <div class="empty-text">No badges yet - start submitting proposals!</div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 26px; font-weight: 700; color: #1a1a2e; }
    .page-sub { color: #888; font-size: 14px; margin-top: 4px; }
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 40px; justify-content: center; color: #888; }
    .spinner { width: 24px; height: 24px; border: 3px solid #e0e0e0; border-top-color: #667eea; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .summary-card { background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 16px; padding: 28px 32px; display: flex; align-items: center; gap: 32px; margin-bottom: 32px; color: white; flex-wrap: wrap; }
    .summary-icon { font-size: 48px; }
    .summary-info { text-align: center; }
    .summary-count { font-size: 32px; font-weight: 800; }
    .summary-label { font-size: 13px; opacity: 0.85; margin-top: 2px; }
    .progress-bar-wrapper { flex: 1; min-width: 200px; }
    .progress-label { font-size: 13px; opacity: 0.85; margin-bottom: 8px; }
    .progress-track { background: rgba(255,255,255,0.2); border-radius: 20px; height: 10px; overflow: hidden; }
    .progress-fill { height: 100%; background: white; border-radius: 20px; transition: width 0.6s ease; }
    .progress-pct { font-size: 13px; opacity: 0.85; margin-top: 6px; text-align: right; }
    .section-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 24px 0 16px; }
    .badges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .badge-card { background: white; border-radius: 16px; padding: 24px 16px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 2px solid transparent; transition: transform 0.2s, box-shadow 0.2s; }
    .badge-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .badge-card.earned { border-color: #667eea; background: linear-gradient(135deg, #f8f9ff, #fff); }
    .badge-card.locked { opacity: 0.5; filter: grayscale(1); }
    .badge-icon { font-size: 40px; margin-bottom: 12px; }
    .locked-icon { filter: grayscale(1); }
    .badge-title { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
    .badge-desc { font-size: 12px; color: #888; line-height: 1.4; margin-bottom: 10px; }
    .badge-date { font-size: 11px; color: #aaa; }
    .badge-card.earned .badge-date { color: #667eea; font-weight: 600; }
    .empty { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-text { color: #888; font-size: 16px; }
  `]
})
export class GamificationComponent implements OnInit {
  badges: Badge[] = [];
  isLoading = true;
  allBadges = [
    { type: 'FAST_STARTER', title: 'First Step', description: 'Submit your first proposal', icon: '🌱' },
    { type: 'RISING_TALENT', title: 'Rising Talent', description: 'Get your first proposal accepted', icon: '🥉' },
    { type: 'EXPERIENCED', title: 'Experienced', description: '5 proposals accepted', icon: '🥈' },
    { type: 'EXPERT', title: 'Expert', description: '10 proposals accepted', icon: '🥇' },
    { type: 'ELITE', title: 'Elite', description: '20 proposals accepted', icon: '💎' },
    { type: 'PROLIFIC', title: 'Prolific', description: 'Submit 20+ proposals', icon: '📝' },
    { type: 'HIGH_ACCEPTANCE', title: 'High Acceptance', description: 'Acceptance rate >= 50%', icon: '🎯' },
    { type: 'VERIFIED_PRO', title: 'Verified Pro', description: 'Account verified by Matchy', icon: '✅' }
  ];

  constructor(public authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    const id = this.authService.currentUser?.id;
    if (id) this.loadBadges(id);
  }

  loadBadges(userId: string | number): void {
    this.isLoading = true;
    this.http.get<Badge[]>(`http://localhost:8081/api/badges/user/${userId}`).subscribe({
      next: (data) => { this.badges = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  getLockedBadges() {
    const earnedTypes = this.badges.map(b => b.type);
    return this.allBadges.filter(b => !earnedTypes.includes(b.type));
  }

  getProgress(): number {
    return Math.round((this.badges.length / this.allBadges.length) * 100);
  }
}