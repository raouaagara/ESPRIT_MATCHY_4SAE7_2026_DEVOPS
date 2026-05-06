import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  step: 'role' | 'form' = 'role';
  selectedRole: 'CLIENT' | 'FREELANCER' | null = null;
  isLoading = false;
  isDark = true;
  error = '';
  showPassword = false;
  // Captcha is intentionally disabled in this integration (matchy backend
  // does not validate reCAPTCHA tokens). The template still references
  // these fields so we keep them as no-ops to preserve the UI layout.
  captchaToken = 'disabled';
  captchaWidgetId: number | null = null;
  form: FormGroup;

  // ── Canvas internals ─────────────────────────────────
  private ctx!: CanvasRenderingContext2D;
  private animId!: number;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private nodes: any[] = [];
  private hexes: any[] = [];
  private waves: any[] = [];
  private tags: any[] = [];
  private stars: any[] = [];
  private frame = 0;
  private MAX_DIST = 160;
  private TAGS = ['UI Design','React','Branding','Figma','Node.js','Motion','Copy','SEO','3D','Vue','Strategy','Spring','Outfit'];
  private resizeHandler!: () => void;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }

    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', [Validators.required, Validators.minLength(2)]],
      email:     ['', [Validators.required, Validators.email]],
      password:  ['', [Validators.required, Validators.minLength(6)]],
      location:  [''],
      skills:    [''],
      bio:       ['']
    });
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  ngOnDestroy(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
  }

  selectRole(role: 'CLIENT' | 'FREELANCER'): void {
    this.selectedRole = role;
    this.step = 'form';
  }

  goBackToRole(): void {
    this.step = 'role';
    this.error = '';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.selectedRole) {
      this.error = 'Please pick a role first.';
      return;
    }
    this.isLoading = true;
    this.error = '';

    const v = this.form.value;
    const fullName = `${v.firstName} ${v.lastName}`.trim();
    const role = this.selectedRole.toLowerCase() as 'client' | 'freelancer';
    const skillsList = v.skills
      ? String(v.skills).split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const payload: any = {
      fullName,
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      password: v.password,
      role,
      location: v.location || null,
      skills: skillsList.length ? skillsList.join(',') : null,
      bio: v.bio || null
    };

    this.authService.register(payload).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: any) => {
        const apiError = err?.error?.error || err?.message || 'Registration failed. Email may already be in use.';
        this.error = apiError;
        this.isLoading = false;
      }
    });
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
  }

  get passwordStrength(): { score: number; label: string; color: string } {
    const pw = this.form.get('password')?.value || '';
    let score = 0;
    if (pw.length >= 6)           score++;
    if (pw.length >= 10)          score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    if (score <= 1) return { score, label: 'Weak',        color: '#EF4444' };
    if (score <= 2) return { score, label: 'Fair',        color: '#F97316' };
    if (score <= 3) return { score, label: 'Good',        color: '#EAB308' };
    if (score <= 4) return { score, label: 'Strong',      color: '#22C55E' };
    return                 { score, label: 'Very strong', color: '#10B981' };
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  // ── Canvas setup (background animation, identical to her original) ──
  private initCanvas(): void {
    if (!this.canvasEl) return;
    const canvas = this.canvasEl.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);
    this.resize();
    this.loop();
  }

  private resize(): void {
    const canvas = this.canvasEl.nativeElement;
    this.dpr = window.devicePixelRatio || 1;
    this.W = canvas.offsetWidth;
    this.H = canvas.offsetHeight;
    canvas.width  = this.W * this.dpr;
    canvas.height = this.H * this.dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
    this.buildScene();
  }

  private col(r: number, g: number, b: number, a: number): string {
    return `rgba(${r},${g},${b},${a})`;
  }

  private buildScene(): void {
    this.nodes = Array.from({ length: 55 }, () => this.makeNode(true));
    this.hexes = [];
    const S = 46, rows = 12, cols = 12;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.hexes.push({
          cx: c * S * Math.sqrt(3) + (r % 2 ? S * Math.sqrt(3) / 2 : 0) - 30,
          cy: r * S * 1.5 - 40,
          s: S,
          phase: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.006,
          base: 0.03 + Math.random() * 0.1
        });
      }
    }
    this.waves = [0, 1, 2].map(i => ({
      i, phase: i * 1.8,
      speed: 0.004 + i * 0.002,
      amp: 80 + i * 30,
      y: this.H * (0.3 + i * 0.18),
      opacity: 0.025 - i * 0.005
    }));
    this.tags = Array.from({ length: 10 }, () => this.makeTag(true));
  }

  private makeNode(init: boolean): any {
    const kind = Math.random() < 0.12 ? 'hi' : Math.random() < 0.25 ? 'mid' : 'lo';
    return {
      x: init ? Math.random() * this.W : (Math.random() < 0.5 ? -5 : this.W + 5),
      y: Math.random() * this.H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.2 + 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.012,
      kind, pulseAmp: 0.4 + Math.random() * 0.6
    };
  }

  private makeTag(init: boolean): any {
    return {
      text: this.TAGS[Math.floor(Math.random() * this.TAGS.length)],
      x: init ? Math.random() * this.W : -200,
      y: 50 + Math.random() * (this.H - 200),
      vx: 0.15 + Math.random() * 0.25, vy: (Math.random() - 0.5) * 0.08,
      opacity: 0, targetOp: 0.12 + Math.random() * 0.12,
      fading: false, delay: init ? Math.random() * 300 : 0, timer: 0,
      fontSize: 11 + Math.floor(Math.random() * 4)
    };
  }

  private loop = (): void => {
    this.frame++;
    this.ctx.clearRect(0, 0, this.W, this.H);

    // Hex grid (subtle)
    for (const h of this.hexes) {
      const a = h.base + Math.sin(this.frame * h.speed + h.phase) * 0.04;
      this.drawHex(h.cx, h.cy, h.s, this.col(99, 102, 241, Math.max(0.02, a)));
    }

    // Waves
    for (const w of this.waves) {
      this.ctx.beginPath();
      for (let x = 0; x <= this.W; x += 8) {
        const y = w.y + Math.sin(x * 0.012 + this.frame * w.speed + w.phase) * w.amp;
        if (x === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
      }
      this.ctx.strokeStyle = this.col(99, 102, 241, w.opacity);
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
    }

    // Nodes
    for (const n of this.nodes) {
      n.x += n.vx; n.y += n.vy; n.phase += n.speed;
      if (n.x < -10 || n.x > this.W + 10 || n.y < -10 || n.y > this.H + 10) {
        Object.assign(n, this.makeNode(false));
      }
      const pulse = 1 + Math.sin(n.phase) * 0.4 * n.pulseAmp;
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
      this.ctx.fillStyle = this.col(168, 139, 250, 0.55);
      this.ctx.fill();
    }

    // Tags
    for (const t of this.tags) {
      t.timer++;
      if (!t.fading && t.opacity < t.targetOp) t.opacity += 0.005;
      t.x += t.vx; t.y += t.vy;
      if (t.x > this.W + 50) Object.assign(t, this.makeTag(false));
      this.ctx.font = `${t.fontSize}px Outfit, system-ui, sans-serif`;
      this.ctx.fillStyle = this.col(226, 232, 240, t.opacity);
      this.ctx.fillText(t.text, t.x, t.y);
    }

    this.animId = requestAnimationFrame(this.loop);
  };

  private drawHex(cx: number, cy: number, s: number, fill: string): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i;
      const x = cx + s * Math.cos(a);
      const y = cy + s * Math.sin(a);
      if (i === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.strokeStyle = fill;
    this.ctx.lineWidth = 0.8;
    this.ctx.stroke();
  }
}
