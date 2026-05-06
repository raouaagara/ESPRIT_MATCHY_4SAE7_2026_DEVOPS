import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../../core/models/models';
import { environment } from '../../_env/environment';

@Component({
  selector: 'app-cl-profile',
  template: `
    <div class="page">
      <div class="page-header"><h1 class="page-title">My Profile</h1></div>
      <div class="profile-card" *ngIf="user">
        <div class="avatar-section">
          <div class="big-avatar">{{ getInitials(user.name) }}</div>
          <div><h2 class="user-name">{{ user.name }}</h2><span class="role-tag">{{ user.role }}</span></div>
        </div>
        <div class="form-grid">
          <div class="form-group"><label>First Name</label><input class="form-input" [(ngModel)]="user.firstName"></div>
          <div class="form-group"><label>Last Name</label><input class="form-input" [(ngModel)]="user.lastName"></div>
          <div class="form-group"><label>Email</label><input class="form-input" [(ngModel)]="user.email" disabled></div>
          <div class="form-group"><label>Location</label><input class="form-input" [(ngModel)]="user.location"></div>
        </div>
        <div class="form-group full"><label>Bio</label><textarea class="form-input form-textarea" [(ngModel)]="user.bio"></textarea></div>
        <div class="form-actions">
          <button class="btn-primary" (click)="save()" [disabled]="isSaving">{{ isSaving ? 'Saving...' : 'Save Changes' }}</button>
          <span class="success" *ngIf="saved">✅ Saved!</span>
        </div>
      </div>

      <div class="badges-card" *ngIf="badges.length > 0">
        <div class="badges-header">
          <span class="badges-icon">🏅</span>
          <h2 class="badges-title">My Achievements</h2>
          <span class="badges-count">{{ badges.length }} badge{{ badges.length > 1 ? 's' : '' }}</span>
        </div>
        <div class="badges-grid">
          <div class="badge-item" *ngFor="let badge of badges">
            <div class="badge-icon">{{ badge.icon }}</div>
            <div class="badge-info">
              <div class="badge-title">{{ badge.title }}</div>
              <div class="badge-desc">{{ badge.description }}</div>
              <div class="badge-date">{{ badge.earnedAt | date:'mediumDate' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="badges-card empty-badges" *ngIf="badges.length === 0 && !loadingBadges">
        <div class="badges-header">
          <span class="badges-icon">🏅</span>
          <h2 class="badges-title">My Achievements</h2>
        </div>
        <div class="empty-state"><span>🎯</span><p>Complete projects to earn your first badge!</p></div>
      </div>

      <div class="toast" *ngIf="toastMessage">
        <span>🏅</span><span>{{ toastMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; position: relative; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--bo-text-primary); }
    .profile-card { background: var(--bo-bg-secondary); border-radius: var(--radius-md); padding: 28px; box-shadow: var(--shadow-card); display: flex; flex-direction: column; gap: 20px; }
    .avatar-section { display: flex; align-items: center; gap: 16px; }
    .big-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--info); color: white; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-name { font-size: 20px; font-weight: 700; color: var(--bo-text-primary); }
    .role-tag { font-size: 12px; background: rgba(6,182,212,0.1); color: var(--info); padding: 3px 8px; border-radius: 20px; font-weight: 600; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label, .full label { font-size: 13px; color: var(--bo-text-secondary); font-weight: 500; }
    .full { display: flex; flex-direction: column; gap: 6px; }
    .form-input { padding: 10px 14px; border: 1px solid var(--bo-border); border-radius: 8px; font-size: 14px; background: var(--bo-bg-primary); color: var(--bo-text-primary); outline: none; font-family: var(--font-body); width: 100%; }
    .form-input:focus { border-color: var(--primary); }
    .form-input:disabled { opacity: 0.6; }
    .form-textarea { min-height: 80px; resize: vertical; }
    .form-actions { display: flex; align-items: center; gap: 12px; }
    .btn-primary { padding: 10px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; }
    .success { color: #22c55e; font-size: 14px; }
    .badges-card { background: var(--bo-bg-secondary); border-radius: var(--radius-md); padding: 24px; box-shadow: var(--shadow-card); }
    .badges-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .badges-icon { font-size: 22px; }
    .badges-title { font-size: 18px; font-weight: 700; color: var(--bo-text-primary); flex: 1; }
    .badges-count { font-size: 12px; background: rgba(139,92,246,0.12); color: var(--primary); padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .badges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .badge-item { display: flex; align-items: center; gap: 14px; background: var(--bo-bg-primary); border-radius: 12px; padding: 14px 16px; border: 1px solid var(--bo-border); transition: transform 0.2s, box-shadow 0.2s; }
    .badge-item:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(139,92,246,0.12); border-color: var(--primary); }
    .badge-icon { font-size: 28px; flex-shrink: 0; }
    .badge-info { display: flex; flex-direction: column; gap: 2px; }
    .badge-title { font-size: 14px; font-weight: 700; color: var(--bo-text-primary); }
    .badge-desc { font-size: 12px; color: var(--bo-text-secondary); }
    .badge-date { font-size: 11px; color: var(--bo-text-secondary); opacity: 0.7; margin-top: 2px; }
    .empty-badges .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; color: var(--bo-text-secondary); font-size: 14px; }
    .empty-badges .empty-state span { font-size: 32px; }
    .toast { position: fixed; bottom: 30px; right: 30px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 14px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 24px rgba(124,58,237,0.35); z-index: 9999; animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `]
})
export class ClProfileComponent implements OnInit {
  user: (User & { name: string }) | null = null;
  isSaving = false;
  saved = false;
  badges: any[] = [];
  loadingBadges = true;
  toastMessage = '';
  private prevBadgeIds: number[] = [];
  private readonly fallbackBadgeDefs = [
    { key: 'FIRST_PROJECT', icon: '🚀', title: 'First Project', description: 'Posted your first project', minTotal: 1, minCompleted: 0 },
    { key: 'ACTIVE_CLIENT', icon: '📋', title: 'Active Client', description: 'Actively posting projects', minTotal: 3, minCompleted: 0 },
    { key: 'POWER_CLIENT', icon: '💪', title: 'Power Client', description: 'Completed 5+ projects', minTotal: 0, minCompleted: 5 },
    { key: 'MEGA_CLIENT', icon: '🏆', title: 'Mega Client', description: 'Completed 10+ projects', minTotal: 0, minCompleted: 10 },
    { key: 'LEGEND', icon: '👑', title: 'Legend', description: 'Complete 25+ projects', minTotal: 0, minCompleted: 25 }
  ];

  constructor(public authService: AuthService, private userService: UserService, private http: HttpClient) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser ? { ...this.authService.currentUser } : null;
    if (this.user?.id) this.loadBadges(this.user.id);
  }

  private normalizeBadge(badge: any): any {
    const defs: Record<string, { icon: string; title: string; description: string }> = {
      FIRST_PROJECT: { icon: '🚀', title: 'First Project', description: 'Posted your first project' },
      ACTIVE_CLIENT: { icon: '📋', title: 'Active Client', description: 'Actively posting projects' },
      POWER_CLIENT: { icon: '💪', title: 'Power Client', description: 'Completed 5+ projects' },
      MEGA_CLIENT: { icon: '🏆', title: 'Mega Client', description: 'Completed 10+ projects' },
      LOYAL_CLIENT: { icon: '⭐', title: 'Loyal Client', description: 'Active for 30+ days' },
      SPEED_POSTER: { icon: '⚡', title: 'Speed Poster', description: 'Post 3 projects in 1 day' },
      VIP_CLIENT: { icon: '💎', title: 'VIP Client', description: 'Spend 5000+ TND' },
      TOP_REVIEWER: { icon: '🌟', title: 'Top Reviewer', description: 'Leave 10+ reviews' },
      TEAM_PLAYER: { icon: '🤝', title: 'Team Player', description: 'Hire 5 different freelancers' },
      LEGEND: { icon: '👑', title: 'Legend', description: 'Complete 25+ projects' }
    };

    const key = badge?.badgeType ?? badge?.key ?? badge?.name ?? '';
    const def = defs[key] ?? { icon: '🏅', title: key || 'Badge', description: 'Achievement unlocked' };
    return {
      ...badge,
      icon: badge?.icon ?? def.icon,
      title: badge?.title ?? badge?.name ?? def.title,
      description: badge?.description ?? badge?.desc ?? def.description,
      earnedAt: badge?.earnedAt ?? badge?.createdAt ?? new Date().toISOString()
    };
  }

  loadBadges(userId: string | number): void {
    this.loadingBadges = true;
    this.http.get<any[]>(`${environment.apiUrl}/badges/user/${userId}`).subscribe({
      next: (data) => {
        const normalized = (data ?? []).map(b => this.normalizeBadge(b));
        const newBadges = normalized.filter(b => b?.id && !this.prevBadgeIds.includes(b.id));
        if (newBadges.length > 0 && this.prevBadgeIds.length > 0) {
          newBadges.forEach(b => this.sendBadgeNotification(userId, b));
        }
        this.prevBadgeIds = normalized.filter(b => b?.id).map(b => b.id);
        this.badges = normalized;
        if (this.badges.length === 0) {
          this.loadFallbackBadges(userId);
          return;
        }
        this.loadingBadges = false;
      },
      error: () => this.loadFallbackBadges(userId)
    });
  }

  private loadFallbackBadges(userId: string | number): void {
    fetch(`${environment.apiUrl}/projects?clientId=${userId}`)
      .then(r => r.json())
      .then((projects: any[]) => {
        const total = (projects ?? []).length;
        const completed = (projects ?? []).filter((p: any) =>
          String(p?.status ?? '').toLowerCase() === 'completed'
        ).length;
        const earned = this.fallbackBadgeDefs
          .filter(b => (b.minTotal > 0 && total >= b.minTotal) || (b.minCompleted > 0 && completed >= b.minCompleted))
          .map(b => ({
            key: b.key,
            icon: b.icon,
            title: b.title,
            description: b.description,
            earnedAt: new Date().toISOString()
          }));
        this.badges = earned;
        this.loadingBadges = false;
      })
      .catch(() => {
        this.loadingBadges = false;
      });
  }

  sendBadgeNotification(userId: string | number, badge: any): void {
    const body = { userId, message: `🏅 You earned the badge: ${badge.title} - ${badge.description}`, type: 'BADGE', read: false };
    fetch(`${environment.apiUrl}/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(() => { this.toastMessage = `New badge unlocked: ${badge.title} ${badge.icon}`; setTimeout(() => this.toastMessage = '', 4000); });
  }

  save(): void {
    if (!this.user?.id) return;
    this.isSaving = true;
    this.user.name = `${this.user.firstName} ${this.user.lastName}`;
    this.userService.update(this.user.id, this.user).subscribe({
      next: () => { this.isSaving = false; this.saved = true; setTimeout(() => this.saved = false, 3000); },
      error: () => { this.isSaving = false; }
    });
  }

  getInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); }
}



