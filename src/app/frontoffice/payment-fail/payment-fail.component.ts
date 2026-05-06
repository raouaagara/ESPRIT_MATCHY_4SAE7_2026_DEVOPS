import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-fail',
  template: `
    <div class="result-page">
      <div class="result-card">
        <div class="icon">❌</div>
        <h2>Payment Failed</h2>
        <p>Your payment was not completed.</p>
        <p class="info">No charges were made. You can try again or choose a different payment method.</p>
        <button class="btn-retry" (click)="retry()">Try Again</button>
      </div>
    </div>
  `,
  styles: [`
    .result-page { display:flex; justify-content:center; align-items:center; min-height:80vh; background:#0f1117; padding:40px; }
    .result-card { background:#1a1f2e; border:1px solid #ef4444; border-radius:20px; padding:40px; text-align:center; max-width:480px; color:#e5e7eb; }
    .icon { font-size:3rem; margin-bottom:16px; }
    h2 { color:#ef4444; margin:0 0 12px; }
    p { color:#9ca3af; margin:8px 0; }
    .info { background:rgba(239,68,68,0.1); padding:12px; border-radius:8px; color:#d1d5db; margin:16px 0; }
    .btn-retry { background:#4f6ef7; color:#fff; border:none; padding:12px 24px; border-radius:10px; font-weight:700; cursor:pointer; margin-top:8px; }
  `]
})
export class PaymentFailComponent {
  constructor(private readonly router: Router) {}
  retry(): void { this.router.navigate(['/subscription-management']); }
}
