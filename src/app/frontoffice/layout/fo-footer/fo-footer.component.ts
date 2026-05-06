import { Component } from '@angular/core';

@Component({
  selector: 'app-fo-footer',
  template: `
    <footer class="fo-footer">
      <div class="footer-container">
        <div class="footer-brand">
          <div class="logo-icon">M</div>
          <span class="logo-text">Match<span class="accent">y</span></span>
        </div>
        <p class="footer-tagline">#1 Tunisian Freelance Platform</p>
        <p class="footer-copy">&copy; {{ year }} Matchy. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .fo-footer {
      background: var(--fo-bg-secondary);
      border-top: 1px solid var(--fo-border);
      padding: 40px 32px;
      text-align: center;
    }
    .footer-container { max-width: 1280px; margin: 0 auto; }
    .footer-brand {
      display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px;
      .logo-icon {
        width: 30px; height: 30px;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        border-radius: 6px; display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 800; font-size: 16px; font-family: var(--font-display);
      }
      .logo-text {
        font-family: var(--font-display); font-size: 18px; font-weight: 700;
        color: var(--fo-text-primary);
        .accent { color: var(--accent); }
      }
    }
    .footer-tagline { color: var(--fo-text-muted); font-size: 13px; margin-bottom: 6px; }
    .footer-copy { color: var(--fo-text-muted); font-size: 12px; }
  `]
})
export class FoFooterComponent {
  year = new Date().getFullYear();
}
