import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/models';
import { environment } from '../../_env/environment';

const SKILL_CATEGORIES = [
  { label:'Frontend', color:'#818cf8', bg:'rgba(99,102,241,0.13)',  border:'rgba(99,102,241,0.3)',  skills:['React','Angular','Vue.js','Next.js','TypeScript','JavaScript','Tailwind CSS','SCSS','HTML/CSS','Svelte','Nuxt.js'] },
  { label:'Backend',  color:'#34d399', bg:'rgba(16,185,129,0.13)',  border:'rgba(16,185,129,0.3)',  skills:['Node.js','Python','Java','Spring Boot','Django','Flask','PHP','Laravel','Express.js','NestJS','C#','.NET','Go','Rust'] },
  { label:'Database', color:'#67e8f9', bg:'rgba(6,182,212,0.13)',   border:'rgba(6,182,212,0.3)',   skills:['PostgreSQL','MongoDB','MySQL','Redis','Firebase','Supabase','GraphQL','REST API','Elasticsearch','SQLite'] },
  { label:'DevOps',   color:'#fde68a', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.3)',  skills:['Docker','Kubernetes','AWS','Azure','GCP','CI/CD','Git','Linux','Terraform','Nginx','Jenkins'] },
  { label:'Mobile',   color:'#f9a8d4', bg:'rgba(236,72,153,0.12)',  border:'rgba(236,72,153,0.3)',  skills:['React Native','Flutter','Swift','Kotlin','iOS','Android','Expo','Capacitor'] },
  { label:'Design',   color:'#c4b5fd', bg:'rgba(139,92,246,0.13)',  border:'rgba(139,92,246,0.3)',  skills:['Figma','UI/UX','Adobe XD','Photoshop','Illustrator','Wireframing','Prototyping','Webflow'] },
  { label:'AI / Data',color:'#6ee7b7', bg:'rgba(16,185,129,0.1)',   border:'rgba(16,185,129,0.25)', skills:['Machine Learning','Data Science','TensorFlow','PyTorch','NLP','Computer Vision','Pandas','NumPy','Scikit-learn'] }
];

interface Badge {
  id: number; type: string; title: string;
  description: string; icon: string; earnedAt: string;
}

const BADGE_STYLES: Record<string, { color:string; bg:string; border:string; glow:string }> = {
  FIRST_PROPOSAL:  { color:'#22c55e', bg:'rgba(34,197,94,0.12)',   border:'rgba(34,197,94,0.3)',   glow:'rgba(34,197,94,0.25)' },
  PROLIFIC:        { color:'#6366f1', bg:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.3)',  glow:'rgba(99,102,241,0.25)' },
  FAST_STARTER:    { color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.3)',  glow:'rgba(245,158,11,0.25)' },
  RISING_TALENT:   { color:'#f97316', bg:'rgba(249,115,22,0.12)',  border:'rgba(249,115,22,0.3)',  glow:'rgba(249,115,22,0.25)' },
  EXPERIENCED:     { color:'#a855f7', bg:'rgba(168,85,247,0.12)',  border:'rgba(168,85,247,0.3)',  glow:'rgba(168,85,247,0.25)' },
  EXPERT:          { color:'#eab308', bg:'rgba(234,179,8,0.12)',   border:'rgba(234,179,8,0.3)',   glow:'rgba(234,179,8,0.25)' },
  ELITE:           { color:'#06b6d4', bg:'rgba(6,182,212,0.12)',   border:'rgba(6,182,212,0.3)',   glow:'rgba(6,182,212,0.3)' },
  HIGH_ACCEPTANCE: { color:'#10b981', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.3)',  glow:'rgba(16,185,129,0.25)' },
  TOP_RATED:       { color:'#f43f5e', bg:'rgba(244,63,94,0.12)',   border:'rgba(244,63,94,0.3)',   glow:'rgba(244,63,94,0.25)' },
  VERIFIED_PRO:    { color:'#3b82f6', bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.3)',  glow:'rgba(59,130,246,0.25)' },
};

@Component({
  selector: 'app-fl-profile',
  template: `
<div class="fp-page">

  <!-- ?? HEADER ?? -->
  <div class="fp-header">
    <div class="fp-avatar-wrap" (click)="triggerFileInput()" title="Change profile photo">
      <div class="fp-avatar">
        <img *ngIf="avatarPreview" [src]="avatarPreview" class="fp-avatar-img" alt="Profile photo" />
        <span *ngIf="!avatarPreview">{{ getInitials(user?.firstName + ' ' + user?.lastName) }}</span>
      </div>
      <div class="fp-avatar-ring"></div>
      <div class="fp-avatar-overlay">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
      <button class="fp-avatar-delete" *ngIf="avatarPreview" (click)="$event.stopPropagation(); removePhoto()" title="Supprimer">?</button>
      <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileSelected($event)" />
    </div>
    <div class="fp-header-info">
      <h1 class="fp-name">{{ user?.firstName }} {{ user?.lastName }}</h1>
      <p class="fp-email">{{ user?.email }}</p>
      <div class="fp-badges-count" *ngIf="badges.length > 0">
        <span class="fp-badges-count-dot"></span>
        {{ badges.length }} badge{{ badges.length > 1 ? 's' : '' }} earned
      </div>
      <div class="fp-progress-wrap">
        <div class="fp-progress-header">
          <span class="fp-progress-label">Profile completion</span>
          <span class="fp-progress-pct">{{ profileCompletion }}%</span>
        </div>
        <div class="fp-progress-bar">
          <div class="fp-progress-fill" [style.width]="profileCompletion + '%'"></div>
        </div>
      </div>
    </div>
    <button class="fp-save-btn" (click)="save()" [disabled]="isSaving">
      <span *ngIf="!isSaving && !saved">Save changes</span>
      <span *ngIf="isSaving" class="fp-spinner"></span>
      <span *ngIf="saved" class="fp-saved-ok">? Saved!</span>
    </button>
  </div>

  <div class="fp-body">

    <!-- ?? LEFT COL ?? -->
    <div class="fp-col fp-col--left">

      <!-- Personal info -->
      <div class="fp-card">
        <div class="fp-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Personal Information
        </div>
        <div class="fp-grid2">
          <div class="fp-field">
            <label class="fp-label">First Name</label>
            <input class="fp-input" [(ngModel)]="user!.firstName" placeholder="First name" />
          </div>
          <div class="fp-field">
            <label class="fp-label">Last Name</label>
            <input class="fp-input" [(ngModel)]="user!.lastName" placeholder="Last name" />
          </div>
        </div>
        <div class="fp-field">
          <label class="fp-label">Email</label>
          <input class="fp-input" [(ngModel)]="user!.email" placeholder="Email address" type="email" />
        </div>
        <div class="fp-field">
          <label class="fp-label">Phone</label>
          <input class="fp-input" [(ngModel)]="user!.phone" placeholder="+216 XX XXX XXX" />
        </div>
        <div class="fp-field">
          <label class="fp-label">Bio</label>
          <textarea class="fp-input fp-textarea" [(ngModel)]="user!.bio" placeholder="Tell clients about yourself?" rows="4"></textarea>
        </div>
        <div class="fp-grid2">
          <div class="fp-field">
            <label class="fp-label">Hourly Rate (TND)</label>
            <input class="fp-input" [(ngModel)]="user!.hourlyRate" placeholder="0" type="number" min="0" />
          </div>
          <div class="fp-field">
            <label class="fp-label">Experience (years)</label>
            <input class="fp-input" [(ngModel)]="user!.experienceYears" placeholder="0" type="number" min="0" />
          </div>
        </div>
      </div>

      <!-- Skills -->
      <div class="fp-card">
        <div class="fp-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Skills
          <span class="fp-skill-count">{{ skillTags.length }}/20</span>
        </div>

        <div class="fp-skill-box" [class.fp-skill-box--focused]="inputFocused" (click)="focusInput()">
          <div class="fp-tag-list">
            <span
              *ngFor="let tag of skillTags; let i = index"
              class="fp-tag"
              [class.fp-tag--removing]="removingIndex === i"
              [style.color]="getTagColor(tag)"
              [style.background]="getTagBg(tag)"
              [style.border-color]="getTagBorder(tag)"
            >
              {{ tag }}
              <button class="fp-tag-x" (click)="$event.stopPropagation(); removeSkill(i)">�</button>
            </span>
            <input
              #skillInput
              class="fp-skill-input"
              [(ngModel)]="skillInputValue"
              (focus)="onInputFocus()"
              (blur)="onInputBlur()"
              (input)="onSkillInput()"
              (keydown)="onSkillKeydown($event)"
              placeholder="{{ skillTags.length === 0 ? 'Type a skill and press Enter?' : '' }}"
              [style.width]="skillInputValue.length * 9 + 90 + 'px'"
            />
          </div>

          <div class="fp-dropdown" *ngIf="showDropdown && (filteredSuggestions.length > 0 || canAddCustom)">
            <div
              *ngFor="let s of filteredSuggestions"
              class="fp-dropdown-item"
              (mousedown)="$event.preventDefault(); addSuggestion(s.skill)"
            >
              <span class="fp-dropdown-dot" [style.background]="s.color"></span>
              <span class="fp-dropdown-skill">{{ s.skill }}</span>
              <span class="fp-dropdown-cat" [style.color]="s.color" [style.background]="s.bg">{{ s.category }}</span>
            </div>
            <div
              *ngIf="canAddCustom"
              class="fp-dropdown-item fp-dropdown-item--custom"
              (mousedown)="$event.preventDefault(); addTag(skillInputValue)"
            >
              <span class="fp-dropdown-plus">+</span>
              Add "{{ skillInputValue.trim() }}"
            </div>
          </div>
        </div>

        <div class="fp-cat-tabs">
          <button
            *ngFor="let cat of categories"
            class="fp-cat-tab"
            [class.fp-cat-tab--active]="activeCategory === cat.label"
            [style.--cat-color]="cat.color"
            (click)="setCategory(cat.label)"
          >{{ cat.label }}</button>
        </div>

        <div class="fp-cat-skills">
          <span
            *ngFor="let skill of activeCategorySkills"
            class="fp-cat-skill"
            [class.fp-cat-skill--added]="skillTags.includes(skill)"
            [style.color]="activeCategoryColor"
            [style.background]="activeCategoryBg"
            [style.border-color]="activeCategoryColor + '55'"
            (click)="!skillTags.includes(skill) && addSuggestion(skill)"
          >
            <span *ngIf="skillTags.includes(skill)">? </span>{{ skill }}
          </span>
        </div>
      </div>

    </div>

    <!-- ?? RIGHT COL ?? -->
    <div class="fp-col fp-col--right">

      <!-- Badges -->
      <div class="fp-card">
        <div class="fp-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Badges & Achievements
          <span class="fp-badge-count-pill" *ngIf="badges.length > 0">{{ badges.length }}</span>
        </div>

        <div class="fp-badge-loading" *ngIf="badgesLoading">
          <div class="fp-badge-skeleton" *ngFor="let i of [1,2,3]"></div>
        </div>

        <div class="fp-badge-empty" *ngIf="!badgesLoading && badges.length === 0">
          <div class="fp-badge-empty-icon">??</div>
          <p class="fp-badge-empty-title">No badges yet</p>
          <p class="fp-badge-empty-sub">Complete projects and get reviews to earn your first badge.</p>
        </div>

        <div class="fp-badge-grid" *ngIf="!badgesLoading && badges.length > 0">
          <div
            *ngFor="let badge of badges"
            class="fp-badge-card"
            [style.--bc]="getBadgeStyle(badge.type).color"
            [style.--bb]="getBadgeStyle(badge.type).bg"
            [style.--bbd]="getBadgeStyle(badge.type).border"
            [style.--bg]="getBadgeStyle(badge.type).glow"
          >
            <div class="fp-badge-icon-wrap">
              <span class="fp-badge-icon">{{ badge.icon }}</span>
              <div class="fp-badge-icon-ring"></div>
            </div>
            <div class="fp-badge-info">
              <div class="fp-badge-title">{{ badge.title }}</div>
              <div class="fp-badge-desc">{{ badge.description }}</div>
              <div class="fp-badge-date">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ formatDate(badge.earnedAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Portfolio link -->
      <div class="fp-card">
        <div class="fp-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Links & Portfolio
        </div>
        <div class="fp-field">
          <label class="fp-label">Portfolio URL</label>
          <input class="fp-input" [(ngModel)]="user!.portfolioUrl" placeholder="https://yourportfolio.com" />
        </div>
        <div class="fp-field">
          <label class="fp-label">LinkedIn</label>
          <input class="fp-input" [(ngModel)]="user!.linkedinUrl" placeholder="https://linkedin.com/in/..." />
        </div>
        <div class="fp-field">
          <label class="fp-label">GitHub</label>
          <input class="fp-input" [(ngModel)]="user!.githubUrl" placeholder="https://github.com/..." />
        </div>
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    :host {
      --p:    #3D8EFF;
      --pl:   #6AACFF;
      --bg:   #07091C;
      --bg2:  #0B0E22;
      --card: rgba(13,17,38,0.85);
      --bdr:  rgba(255,255,255,0.07);
      --txt:  #EEF0FF;
      --muted:rgba(160,180,255,0.45);
      --soft: rgba(160,180,255,0.65);
      --r:    14px;
      --rs:   10px;
      --font: 'Plus Jakarta Sans','Outfit',sans-serif;
    }

    .fp-page {
      min-height: 100vh;
      background: var(--bg);
      padding: 32px;
      font-family: var(--font);
      color: var(--txt);
    }

    .fp-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
      padding: 24px 28px;
      background: var(--card);
      border: 1px solid var(--bdr);
      border-radius: 20px;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 40px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset;
    }

    /* ?? AVATAR UPLOAD ?? */
    .fp-avatar-wrap {
      position: relative;
      flex-shrink: 0;
      cursor: pointer;
    }

    .fp-avatar {
      width: 68px; height: 68px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--p), #8B5CF6);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 800; color: white;
      position: relative; z-index: 1;
      box-shadow: 0 8px 24px rgba(61,142,255,0.4);
      overflow: hidden;
    }

    .fp-avatar-img {
      width: 100%; height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .fp-avatar-overlay {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 2;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .fp-avatar-wrap:hover .fp-avatar-overlay { opacity: 1; }
    .fp-avatar-delete {
      position: absolute; top: -4px; right: -4px;
      width: 20px; height: 20px; border-radius: 50%;
      background: #ef4444; border: 2px solid #07091C;
      color: white; font-size: 13px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 3; padding: 0;
      transition: background 0.2s;
    }
    .fp-avatar-delete:hover { background: #dc2626; }

    .fp-avatar-ring {
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, var(--p), #8B5CF6, #00E5FF, var(--p));
      z-index: 0;
      animation: ringRotate 4s linear infinite;
      mask: radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px));
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px));
    }

    .fp-header-info { flex: 1; min-width: 0; }
    .fp-progress-wrap { margin-top: 10px; }
    .fp-progress-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .fp-progress-label { font-size: 11px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .fp-progress-pct { font-size: 11px; font-weight: 700; color: var(--pl); }
    .fp-progress-bar { height: 6px; background: rgba(255,255,255,0.07); border-radius: 100px; overflow: hidden; width: 220px; }
    .fp-progress-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, var(--p), #8B5CF6); transition: width 0.5s ease; }

    .fp-name {
      font-size: 22px; font-weight: 800;
      color: var(--txt); letter-spacing: -0.5px;
      margin: 0 0 3px;
    }

    .fp-email {
      font-size: 13px; color: var(--muted);
      margin: 0 0 8px;
    }

    .fp-badges-count {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600;
      color: #6AACFF;
      background: rgba(61,142,255,0.1);
      border: 1px solid rgba(61,142,255,0.22);
      border-radius: 100px;
      padding: 3px 10px;
    }

    .fp-badges-count-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #00E5FF;
      box-shadow: 0 0 8px #00E5FF;
      animation: dotPulse 2.5s ease-in-out infinite;
    }

    .fp-save-btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, var(--p), #1A5FEE);
      border: none; border-radius: var(--rs);
      color: white; font-family: var(--font);
      font-size: 14px; font-weight: 700;
      cursor: pointer; flex-shrink: 0;
      transition: all 0.28s; position: relative;
      overflow: hidden; min-width: 140px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 24px rgba(61,142,255,0.38), 0 1px 0 rgba(255,255,255,0.1) inset;
    }

    .fp-save-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
      transform: translateX(-120%);
      transition: transform 0.55s;
    }

    .fp-save-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 36px rgba(61,142,255,0.52);
    }

    .fp-save-btn:hover::before { transform: translateX(120%); }
    .fp-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .fp-saved-ok { color: #34D399; }

    .fp-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.25);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .fp-body {
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 24px;
      align-items: start;
    }

    .fp-col { display: flex; flex-direction: column; gap: 24px; }

    .fp-card {
      background: var(--card);
      border: 1px solid var(--bdr);
      border-radius: 18px;
      padding: 24px;
      backdrop-filter: blur(20px);
      box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05) inset;
    }

    .fp-card-title {
      display: flex; align-items: center; gap: 9px;
      font-size: 13.5px; font-weight: 700;
      color: var(--txt); letter-spacing: -0.1px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--bdr);
    }

    .fp-card-title svg { color: var(--pl); }

    .fp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .fp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .fp-field:last-child { margin-bottom: 0; }

    .fp-label {
      font-size: 11px; font-weight: 700;
      color: var(--muted); letter-spacing: 0.7px;
      text-transform: uppercase;
    }

    .fp-input {
      width: 100%;
      padding: 11px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--bdr);
      border-radius: var(--rs);
      color: var(--txt);
      font-size: 14px; font-weight: 400;
      font-family: var(--font);
      outline: none;
      transition: all 0.24s;
      caret-color: var(--p);
    }

    .fp-input::placeholder { color: rgba(255,255,255,0.2); }
    .fp-input:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.13); }
    .fp-input:focus { background: rgba(61,142,255,0.07); border-color: var(--p); box-shadow: 0 0 0 4px rgba(61,142,255,0.12); }
    .fp-textarea { resize: vertical; min-height: 90px; }

    .fp-skill-count {
      margin-left: auto;
      font-size: 11px; font-weight: 600;
      color: var(--muted);
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--bdr);
      border-radius: 100px;
      padding: 2px 8px;
    }

    .fp-skill-box {
      min-height: 52px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--bdr);
      border-radius: var(--rs);
      padding: 8px 12px;
      cursor: text;
      position: relative;
      transition: all 0.24s;
      margin-bottom: 16px;
    }

    .fp-skill-box--focused { border-color: var(--p); box-shadow: 0 0 0 4px rgba(61,142,255,0.12); background: rgba(61,142,255,0.04); }

    .fp-tag-list { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

    .fp-tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px;
      border-radius: 100px;
      border: 1px solid;
      font-size: 12.5px; font-weight: 600;
      transition: all 0.18s;
    }

    .fp-tag--removing { opacity: 0; transform: scale(0.8); }

    .fp-tag-x {
      background: none; border: none;
      color: inherit; opacity: 0.55;
      cursor: pointer; font-size: 15px;
      line-height: 1; padding: 0;
      transition: opacity 0.15s;
    }

    .fp-tag-x:hover { opacity: 1; }

    .fp-skill-input {
      background: none; border: none; outline: none;
      color: var(--txt); font-size: 13.5px;
      font-family: var(--font);
      min-width: 80px; max-width: 100%;
      caret-color: var(--p);
    }

    .fp-skill-input::placeholder { color: rgba(255,255,255,0.22); }

    .fp-dropdown {
      position: absolute;
      top: calc(100% + 8px); left: 0; right: 0;
      background: #0E1228;
      border: 1px solid rgba(61,142,255,0.22);
      border-radius: 12px;
      z-index: 100;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      overflow: hidden;
      animation: dropIn 0.18s ease;
    }

    .fp-dropdown-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 0.15s;
      font-size: 13.5px;
    }

    .fp-dropdown-item:hover { background: rgba(61,142,255,0.08); }
    .fp-dropdown-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .fp-dropdown-skill { flex: 1; font-weight: 500; color: var(--txt); }
    .fp-dropdown-cat { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 100px; letter-spacing: 0.3px; }
    .fp-dropdown-item--custom { border-top: 1px solid var(--bdr); color: var(--pl); font-weight: 600; }
    .fp-dropdown-plus { font-size: 16px; font-weight: 700; color: var(--pl); width: 20px; text-align: center; }

    .fp-cat-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }

    .fp-cat-tab {
      padding: 5px 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--bdr);
      border-radius: 100px;
      color: var(--muted);
      font-family: var(--font);
      font-size: 12px; font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .fp-cat-tab--active { background: rgba(var(--cat-color, 168,85,247), 0.12); border-color: var(--cat-color, #a855f7); color: var(--cat-color, #a855f7); }

    .fp-cat-skills { display: flex; flex-wrap: wrap; gap: 7px; }

    .fp-cat-skill {
      padding: 5px 12px;
      border-radius: 100px;
      border: 1px solid;
      font-size: 12px; font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      opacity: 0.75;
    }

    .fp-cat-skill:hover:not(.fp-cat-skill--added) { opacity: 1; transform: translateY(-1px); }
    .fp-cat-skill--added { opacity: 1; cursor: default; }

    .fp-badge-count-pill {
      margin-left: auto;
      background: linear-gradient(135deg, var(--p), #8B5CF6);
      color: white;
      font-size: 11px; font-weight: 700;
      padding: 2px 8px;
      border-radius: 100px;
      min-width: 22px;
      text-align: center;
    }

    .fp-badge-loading { display: flex; flex-direction: column; gap: 12px; }

    .fp-badge-skeleton {
      height: 72px;
      border-radius: 12px;
      background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    .fp-badge-empty { text-align: center; padding: 36px 16px; }
    .fp-badge-empty-icon { font-size: 44px; margin-bottom: 12px; opacity: 0.5; filter: grayscale(1); }
    .fp-badge-empty-title { font-size: 15px; font-weight: 700; color: var(--txt); margin-bottom: 6px; }
    .fp-badge-empty-sub { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 260px; margin: 0 auto; }

    .fp-badge-grid { display: flex; flex-direction: column; gap: 10px; }

    .fp-badge-card {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 14px 16px;
      background: var(--bb);
      border: 1px solid var(--bbd);
      border-radius: 13px;
      transition: all 0.25s;
      animation: badgeIn 0.4s both;
    }

    .fp-badge-card:hover { transform: translateX(3px); box-shadow: 0 4px 20px var(--bg); border-color: var(--bc); }

    .fp-badge-icon-wrap {
      position: relative; flex-shrink: 0;
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
    }

    .fp-badge-icon { font-size: 24px; position: relative; z-index: 1; filter: drop-shadow(0 2px 8px var(--bg)); }

    .fp-badge-icon-ring {
      position: absolute; inset: 0;
      border-radius: 50%;
      background: var(--bb);
      border: 1.5px solid var(--bbd);
      box-shadow: 0 0 12px var(--bg);
    }

    .fp-badge-info { flex: 1; min-width: 0; }
    .fp-badge-title { font-size: 13.5px; font-weight: 700; color: var(--bc); margin-bottom: 3px; }
    .fp-badge-desc { font-size: 12px; color: var(--soft); line-height: 1.5; margin-bottom: 6px; }
    .fp-badge-date { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--muted); font-weight: 500; }

    @keyframes spin       { to { transform: rotate(360deg); } }
    @keyframes ringRotate { to { transform: rotate(360deg); } }
    @keyframes dotPulse   { 0%,100%{box-shadow:0 0 6px #00E5FF} 50%{box-shadow:0 0 14px #00E5FF,0 0 28px rgba(0,229,255,0.3)} }
    @keyframes shimmer    { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes dropIn     { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes badgeIn    { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }

    @media (max-width: 1024px) {
      .fp-body { grid-template-columns: 1fr; }
      .fp-page { padding: 20px; }
    }

    .fp-page.fp-light {
      --bg:   #f0f2fa; --bg2: #ffffff;
      --card: rgba(255,255,255,0.95);
      --bdr:  rgba(0,0,0,0.08);
      --txt:  #111827;
      --muted:rgba(0,0,0,0.45);
      --soft: rgba(0,0,0,0.65);
    }
    .fp-page.fp-light .fp-input { background: rgba(0,0,0,0.03); color: #111827; }
    .fp-page.fp-light .fp-input::placeholder { color: rgba(0,0,0,0.3); }
    .fp-page.fp-light .fp-skill-input { color: #111827; }
    .fp-page.fp-light .fp-skill-input::placeholder { color: rgba(0,0,0,0.3); }
    .fp-page.fp-light .fp-dropdown { background: #ffffff; border-color: rgba(0,0,0,0.1); }
    .fp-page.fp-light .fp-dropdown-skill { color: #111827; }
  `]
})
export class FlProfileComponent implements OnInit {
  @ViewChild('skillInput') skillInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  user: (User & {
    name: string;
    phone?: string;
    bio?: string;
    hourlyRate?: number;
    experienceYears?: number;
    portfolioUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    skills?: any;
    avatar?: string;
  }) | null = null;

  isSaving = false;
  saved = false;
  avatarPreview: string | null = null;
  selectedPhotoFile: File | null = null;

  badges: Badge[] = [];
  badgesLoading = false;

  skillTags: string[] = [];
  skillInputValue = '';
  inputFocused = false;
  showDropdown = false;
  removingIndex = -1;
  activeCategory = 'Frontend';

  readonly categories = SKILL_CATEGORIES;

  get activeCategorySkills() { return this.categories.find(c => c.label === this.activeCategory)?.skills ?? []; }
  get activeCategoryColor()  { return this.categories.find(c => c.label === this.activeCategory)?.color  ?? '#a855f7'; }
  get activeCategoryBg()     { return this.categories.find(c => c.label === this.activeCategory)?.bg     ?? 'rgba(168,85,247,0.12)'; }

  get filteredSuggestions() {
    const q = this.skillInputValue.trim().toLowerCase();
    if (!q) return [];
    const res: { skill:string; category:string; color:string; bg:string }[] = [];
    for (const cat of this.categories)
      for (const skill of cat.skills)
        if (skill.toLowerCase().includes(q) && !this.skillTags.includes(skill))
          res.push({ skill, category: cat.label, color: cat.color, bg: cat.bg });
    return res.slice(0, 8);
  }

  get profileCompletion(): number {
    if (!this.user) return 0;
    const fields = [
      this.user.firstName, this.user.lastName, this.user.email,
      this.user.phone, this.user.bio, this.user.avatar,
      this.user.hourlyRate, this.user.experienceYears,
      this.user.portfolioUrl, this.skillTags.length > 0 ? "ok" : ""
    ];
    const filled = fields.filter(f => f !== null && f !== undefined && f !== "" && f !== 0).length;
    return Math.round((filled / fields.length) * 100);
  }

  get canAddCustom() {
    const q = this.skillInputValue.trim();
    return q.length > 0
      && !this.categories.some(c => c.skills.some(s => s.toLowerCase() === q.toLowerCase()))
      && !this.skillTags.some(t => t.toLowerCase() === q.toLowerCase());
  }

  constructor(public authService: AuthService, private userService: UserService, private http: HttpClient) {}

  ngOnInit() {
    this.authService.checkAuth();
    this.user = this.authService.currentUser ? { ...this.authService.currentUser } as any : null;
    if (this.user?.id) {
      this.userService.getById(this.user.id).subscribe({
        next: (fullUser: any) => {
          this.user = { ...(this.user as any), ...fullUser };
          const raw = Array.isArray(this.user?.skills)
            ? this.user?.skills
            : (this.user?.skills ? String(this.user.skills).split(',') : []);
          this.skillTags = raw.map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          this.avatarPreview = this.user?.avatar ?? null;
        },
        error: () => {
          if (this.user?.skills) {
            const raw = Array.isArray(this.user.skills)
              ? this.user.skills
              : (this.user.skills as string).split(',');
            this.skillTags = raw.map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          }
          if (this.user?.avatar) {
            this.avatarPreview = this.user.avatar;
          }
        }
      });
      this.loadBadges(this.user.id);
    }
    this.applyTheme();
  }

  private applyTheme(): void {
    const isDark = localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark');
    const page = document.querySelector('.fp-page');
    if (page) page.classList.toggle('fp-light', !isDark);
  }

  removePhoto(): void {
    this.avatarPreview = null;
    this.selectedPhotoFile = null;
    if (this.user) this.user.avatar = undefined;
  }

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;
    this.selectedPhotoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  loadBadges(userId: string | number) {
    this.badgesLoading = true;
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    const badgeUrls = [
      `${environment.apiUrl}/badges/user/${userId}`,
      `http://localhost:8082/api/badges/user/${userId}`,
      `http://localhost:8081/api/badges/user/${userId}`
    ];

    const tryLoad = (index: number): void => {
      if (index >= badgeUrls.length) {
        this.loadFallbackFreelancerBadges(userId);
        return;
      }

      this.http.get<any>(badgeUrls[index], { headers }).subscribe({
        next: (res) => {
          const rawBadges = this.extractBadgesArray(res);
          const normalized = rawBadges.map(raw => this.normalizeBadge(raw));
          if (normalized.length > 0) {
            this.badges = normalized;
            this.badgesLoading = false;
            return;
          }
          tryLoad(index + 1);
        },
        error: () => tryLoad(index + 1)
      });
    };

    tryLoad(0);
  }

  private extractBadgesArray(payload: any): any[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    return [];
  }

  private normalizeBadge(raw: any): Badge {
    const type = String(raw?.type ?? raw?.badgeType ?? raw?.name ?? 'FIRST_PROPOSAL');
    const icon = raw?.icon || this.defaultIcon(type);
    return {
      id: Number(raw?.id ?? 0),
      type,
      title: raw?.title ?? type.replace(/_/g, ' '),
      description: raw?.description ?? 'Achievement unlocked',
      icon,
      earnedAt: raw?.earnedAt ?? raw?.createdAt ?? new Date().toISOString()
    };
  }

  private defaultIcon(type: string): string {
    const map: Record<string, string> = {
      FIRST_PROPOSAL: '??', PROLIFIC: '??', FAST_STARTER: '?',
      RISING_TALENT: '??', EXPERIENCED: '??', EXPERT: '??',
      ELITE: '??', HIGH_ACCEPTANCE: '??', TOP_RATED: '?', VERIFIED_PRO: '?'
    };
    return map[type] ?? '??';
  }

  private loadFallbackFreelancerBadges(userId: string | number): void {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    this.http.get<any[]>(`${environment.apiUrl}/proposals?freelancerId=${userId}`, { headers }).subscribe({
      next: proposals => {
        const total = proposals?.length ?? 0;
        const accepted = (proposals ?? []).filter((p: any) => String(p?.status ?? '').toUpperCase() === 'ACCEPTED').length;
        const fallback: Badge[] = [];
        if (total >= 1) fallback.push({ id: 1, type: 'FIRST_PROPOSAL', title: 'First Step', description: 'Submitted your first proposal', icon: '??', earnedAt: new Date().toISOString() });
        if (total >= 20) fallback.push({ id: 2, type: 'PROLIFIC', title: 'Prolific', description: 'Submitted 20+ proposals', icon: '??', earnedAt: new Date().toISOString() });
        if (accepted >= 1) fallback.push({ id: 3, type: 'RISING_TALENT', title: 'Rising Talent', description: 'Got your first proposal accepted', icon: '??', earnedAt: new Date().toISOString() });
        if (accepted >= 5) fallback.push({ id: 4, type: 'EXPERIENCED', title: 'Experienced', description: 'Got 5 proposals accepted', icon: '??', earnedAt: new Date().toISOString() });
        this.badges = fallback;
        this.badgesLoading = false;
      },
      error: () => { this.badges = []; this.badgesLoading = false; }
    });
  }

  getBadgeStyle(type: string) {
    return BADGE_STYLES[type] ?? BADGE_STYLES['FIRST_PROPOSAL'];
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  focusInput() { this.skillInputRef?.nativeElement.focus(); }
  onInputFocus() { this.inputFocused = true; this.showDropdown = true; }
  onSkillInput() { this.showDropdown = true; }

  onSkillKeydown(event: KeyboardEvent) {
    const val = this.skillInputValue.trim();
    if ((event.key === 'Enter' || event.key === ',') && val) {
      event.preventDefault(); this.addTag(val.replace(/,/g,'')); return;
    }
    if (event.key === 'Backspace' && !this.skillInputValue && this.skillTags.length > 0) {
      this.removeSkill(this.skillTags.length - 1); return;
    }
    if (event.key === 'Escape') this.showDropdown = false;
  }

  addTag(value: string) {
    const clean = value.trim().replace(/,/g,'');
    if (!clean || this.skillTags.includes(clean) || this.skillTags.length >= 20) return;
    this.skillTags = [...this.skillTags, clean];
    this.skillInputValue = '';
    this.showDropdown = false;
    this.syncSkills();
  }

  addSuggestion(skill: string) {
    if (this.skillTags.includes(skill)) return;
    this.addTag(skill);
    setTimeout(() => this.focusInput(), 0);
  }

  removeSkill(index: number) {
    this.removingIndex = index;
    setTimeout(() => {
      this.skillTags = this.skillTags.filter((_,i) => i !== index);
      this.removingIndex = -1;
      this.syncSkills();
    }, 180);
  }

  onInputBlur() {
    if (this.skillInputValue.trim()) this.addTag(this.skillInputValue);
    setTimeout(() => { this.inputFocused = false; this.showDropdown = false; }, 160);
  }

  setCategory(label: string) { this.activeCategory = label; }

  private getCat(skill: string) {
    return this.categories.find(c => c.skills.some(s => s.toLowerCase() === skill.toLowerCase()));
  }

  getTagColor(skill: string)  { return this.getCat(skill)?.color  ?? '#a855f7'; }
  getTagBg(skill: string)     { return this.getCat(skill)?.bg     ?? 'rgba(168,85,247,0.13)'; }
  getTagBorder(skill: string) { return this.getCat(skill)?.border ?? 'rgba(168,85,247,0.3)'; }

  private syncSkills() {
    if (this.user) (this.user as any).skills = this.skillTags.join(', ');
  }

  save() {
    if (!this.user?.id) return;
    this.syncSkills();
    this.isSaving = true;
    this.user.name = `${this.user.firstName} ${this.user.lastName}`;

    if (this.selectedPhotoFile) {
      const formData = new FormData();
      formData.append('photo', this.selectedPhotoFile);
      const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
      this.http.post<{ photoUrl: string }>(`${environment.apiUrl}/users/${this.user.id}/photo`, formData, { headers }).subscribe({
        next: (res) => {
          if (this.user) this.user.avatar = res.photoUrl;
          this.selectedPhotoFile = null;
          this.saveProfile();
        },
        error: () => this.saveProfile()
      });
    } else {
      this.saveProfile();
    }
  }

  private saveProfile() {
    this.userService.update(this.user!.id!, this.user!).subscribe({
      next:  () => { this.isSaving = false; this.saved = true; setTimeout(() => this.saved = false, 3000); },
      error: () => { this.isSaving = false; }
    });
  }

  getInitials(name: string) {
    return name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || '??';
  }
}










