import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FlouciService } from '../services/flouci.service';

@Component({
  selector: 'app-payment-success',
  template: `
    <div class="result-page">
      <div class="result-card" *ngIf="!isVerifying && !verificationFailed">
        <div class="icon">✅</div>
        <h2>Payment Successful!</h2>
        <p>Your payment has been confirmed.</p>
        <p class="ref" *ngIf="ref">Reference: <strong>{{ ref }}</strong></p>
        <p class="info">Your subscription is now <strong>pending admin activation</strong>. You will receive a confirmation email shortly.</p>
        <button class="btn-primary" (click)="goHome()">Go to My Subscription</button>
      </div>
      <div class="result-card" *ngIf="isVerifying">
        <div class="spinner"></div>
        <p>Verifying your payment...</p>
      </div>
      <div class="result-card error" *ngIf="verificationFailed">
        <div class="icon">⚠️</div>
        <h2>Verification Issue</h2>
        <p>We couldn't verify your payment automatically, but our admin team will check it manually.</p>
        <button class="btn-primary" (click)="goHome()">Go to My Subscription</button>
      </div>
    </div>
  `,
  styles: [`
    .result-page { display:flex; justify-content:center; align-items:center; min-height:80vh; background:#0f1117; padding:40px; }
    .result-card { background:#1a1f2e; border:1px solid #22c55e; border-radius:20px; padding:40px; text-align:center; max-width:480px; color:#e5e7eb; }
    .result-card.error { border-color:#f59e0b; }
    .icon { font-size:3rem; margin-bottom:16px; }
    h2 { color:#22c55e; margin:0 0 12px; }
    .error h2 { color:#f59e0b; }
    p { color:#9ca3af; margin:8px 0; }
    .ref { font-size:0.85rem; }
    .info { background:rgba(34,197,94,0.1); padding:12px; border-radius:8px; color:#d1d5db; margin:16px 0; }
    .btn-primary { background:#4f6ef7; color:#fff; border:none; padding:12px 24px; border-radius:10px; font-weight:700; cursor:pointer; margin-top:8px; transition:background 0.2s; }
    .btn-primary:hover { background:#3d5bd9; }
    .spinner { width:36px; height:36px; border:3px solid #2d3348; border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 16px; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  ref = '';
  isVerifying = true;
  verificationFailed = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly flouciService: FlouciService
  ) {}

  ngOnInit(): void {
    this.ref = this.route.snapshot.queryParamMap.get('ref') || '';
    const paymentId = sessionStorage.getItem('flouci_payment_id') || '';

    if (paymentId) {
      this.flouciService.verifyPayment(paymentId).subscribe({
        next: () => {
          this.isVerifying = false;
          ['flouci_payment_id', 'flouci_pending_ref', 'flouci_plan', 'flouci_amount']
            .forEach(k => sessionStorage.removeItem(k));
        },
        error: () => { this.isVerifying = false; this.verificationFailed = true; }
      });
    } else {
      this.isVerifying = false;
    }
  }

  goHome(): void { this.router.navigate(['/my-subscription']); }
}
