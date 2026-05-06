// payment-modal.component.ts
// Ajouter ce composant dans ton module Angular, puis l'utiliser dans cl-projects

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-payment-modal',
  template: `
<div class="pm-backdrop" (click)="onBackdropClick($event)">
  <div class="pm-modal" [class.pm-success]="step === 'success'">

    <!-- ── STEP 1 : SUMMARY ── -->
    <ng-container *ngIf="step === 'summary'">
      <div class="pm-header">
        <div class="pm-logo">💳</div>
        <h2 class="pm-title">Secure Payment</h2>
        <p class="pm-sub">Review and confirm your payment</p>
      </div>

      <div class="pm-project-banner">
        <div class="pm-project-icon">📦</div>
        <div>
          <div class="pm-project-name">{{ projectTitle }}</div>
          <div class="pm-project-meta">Delivery confirmed</div>
        </div>
        <div class="pm-project-amount">{{ budget | number:'1.2-2' }} TND</div>
      </div>

      <div class="pm-breakdown">
        <div class="pm-row">
          <span>Project budget</span>
          <span>{{ budget | number:'1.2-2' }} TND</span>
        </div>
        <div class="pm-row pm-fee">
          <span>Platform fee (10%)</span>
          <span>- {{ commission | number:'1.2-2' }} TND</span>
        </div>
        <div class="pm-divider"></div>
        <div class="pm-row pm-net">
          <span>Freelancer receives</span>
          <strong>{{ montantNet | number:'1.2-2' }} TND</strong>
        </div>
      </div>

      <div class="pm-card-section">
        <div class="pm-card-label">Simulated Payment Card</div>
        <div class="pm-card">
          <div class="pm-card-shine"></div>
          <div class="pm-card-chip">
            <div class="chip-line"></div>
            <div class="chip-line"></div>
            <div class="chip-line"></div>
          </div>
          <div class="pm-card-number">•••• •••• •••• 4242</div>
          <div class="pm-card-bottom">
            <div>
              <div class="pm-card-label-sm">CARD HOLDER</div>
              <div class="pm-card-name">{{ cardHolder }}</div>
            </div>
            <div>
              <div class="pm-card-label-sm">EXPIRES</div>
              <div class="pm-card-name">12/28</div>
            </div>
            <div class="pm-card-brand">VISA</div>
          </div>
        </div>
      </div>

      <div class="pm-actions">
        <button class="pm-btn-cancel" (click)="cancel.emit()">Cancel</button>
        <button class="pm-btn-pay" (click)="goToPin()">
          <span class="pm-lock">🔒</span>
          Pay {{ budget | number:'1.2-2' }} TND
        </button>
      </div>
    </ng-container>

    <!-- ── STEP 2 : PIN ── -->
    <ng-container *ngIf="step === 'pin'">
      <div class="pm-header">
        <div class="pm-logo">🔐</div>
        <h2 class="pm-title">Enter PIN</h2>
        <p class="pm-sub">Enter any 4-digit code to simulate</p>
      </div>

      <div class="pm-pin-display">
        <div class="pm-pin-dot" *ngFor="let d of [0,1,2,3]"
             [class.filled]="pin.length > d"></div>
      </div>

      <div class="pm-numpad">
        <button class="pm-key" *ngFor="let k of [1,2,3,4,5,6,7,8,9]"
                (click)="addPin(k.toString())">{{ k }}</button>
        <button class="pm-key pm-key-empty"></button>
        <button class="pm-key" (click)="addPin('0')">0</button>
        <button class="pm-key pm-key-del" (click)="delPin()">⌫</button>
      </div>

      <div class="pm-pin-error" *ngIf="pinError">❌ Incorrect PIN. Try again.</div>

      <div class="pm-actions">
        <button class="pm-btn-cancel" (click)="step = 'summary'; pin = ''">Back</button>
      </div>
    </ng-container>

    <!-- ── STEP 3 : PROCESSING ── -->
    <ng-container *ngIf="step === 'processing'">
      <div class="pm-processing">
        <div class="pm-spinner-ring"></div>
        <div class="pm-processing-text">Processing payment…</div>
        <div class="pm-processing-sub">Please wait</div>
      </div>
    </ng-container>

    <!-- ── STEP 4 : SUCCESS ── -->
    <ng-container *ngIf="step === 'success'">
      <div class="pm-success-content">
        <div class="pm-checkmark">
          <svg viewBox="0 0 52 52">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="M14 26 l9 9 l15-18"/>
          </svg>
        </div>
        <h2 class="pm-success-title">Payment Successful!</h2>
        <p class="pm-success-sub">The freelancer has been paid</p>

        <div class="pm-receipt">
          <div class="pm-receipt-row">
            <span>Project</span>
            <strong>{{ projectTitle }}</strong>
          </div>
          <div class="pm-receipt-row">
            <span>Amount Paid</span>
            <strong>{{ budget | number:'1.2-2' }} TND</strong>
          </div>
          <div class="pm-receipt-row">
            <span>Freelancer Receives</span>
            <strong class="pm-green">{{ montantNet | number:'1.2-2' }} TND</strong>
          </div>
          <div class="pm-receipt-row">
            <span>Status</span>
            <span class="pm-badge-done">✅ COMPLETED</span>
          </div>
        </div>

        <button class="pm-btn-done" (click)="done.emit()">Done</button>
      </div>
    </ng-container>

  </div>
</div>
  `,
  styles: [`
/* ── BACKDROP ── */
.pm-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  animation: pmFadeIn 0.25s ease both;
}
@keyframes pmFadeIn { from{opacity:0} to{opacity:1} }

/* ── MODAL BOX ── */
.pm-modal {
  background: #fff;
  border-radius: 24px;
  width: 100%; max-width: 420px;
  padding: 32px 28px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.3);
  animation: pmSlideUp 0.3s cubic-bezier(.22,.68,0,1.2) both;
  position: relative;
  overflow: hidden;
}
@keyframes pmSlideUp {
  from { opacity:0; transform:translateY(40px) scale(0.95); }
  to   { opacity:1; transform:translateY(0)    scale(1); }
}

/* ── HEADER ── */
.pm-header { text-align: center; margin-bottom: 24px; }
.pm-logo { font-size: 36px; margin-bottom: 8px; }
.pm-title { font-size: 22px; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; font-family: 'Georgia', serif; }
.pm-sub { font-size: 13px; color: #888; margin: 0; }

/* ── PROJECT BANNER ── */
.pm-project-banner {
  display: flex; align-items: center; gap: 12px;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 14px; padding: 14px 16px;
  margin-bottom: 18px;
}
.pm-project-icon { font-size: 24px; }
.pm-project-name { font-size: 14px; font-weight: 700; color: #1a1a2e; }
.pm-project-meta { font-size: 11px; color: #888; margin-top: 2px; }
.pm-project-amount { margin-left: auto; font-size: 18px; font-weight: 800; color: #7c3aed; }

/* ── BREAKDOWN ── */
.pm-breakdown { background: #f9f9f9; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; }
.pm-row { display: flex; justify-content: space-between; font-size: 13px; color: #555; padding: 4px 0; }
.pm-fee { color: #ef4444; }
.pm-divider { height: 1px; background: #e5e7eb; margin: 8px 0; }
.pm-net { font-size: 15px; font-weight: 700; color: #1a1a2e; }

/* ── CARD ── */
.pm-card-section { margin-bottom: 24px; }
.pm-card-label { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }

.pm-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 16px; padding: 20px 22px;
  color: white; position: relative; overflow: hidden;
  box-shadow: 0 8px 32px rgba(26,26,46,0.35);
}
.pm-card-shine {
  position: absolute; top: -50%; left: -30%;
  width: 60%; height: 200%;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%);
  transform: rotate(15deg);
}
.pm-card-chip {
  width: 36px; height: 28px; background: linear-gradient(135deg, #d4af37, #f0d060);
  border-radius: 5px; margin-bottom: 16px;
  display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 5px;
}
.chip-line { height: 3px; background: rgba(0,0,0,0.2); border-radius: 2px; }

.pm-card-number { font-size: 15px; font-family: monospace; letter-spacing: 3px; margin-bottom: 16px; opacity: 0.9; }
.pm-card-bottom { display: flex; align-items: flex-end; gap: 20px; }
.pm-card-label-sm { font-size: 9px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
.pm-card-name { font-size: 12px; font-weight: 600; letter-spacing: 1px; }
.pm-card-brand { margin-left: auto; font-size: 20px; font-weight: 900; font-style: italic; opacity: 0.9; }

/* ── ACTIONS ── */
.pm-actions { display: flex; gap: 10px; }
.pm-btn-cancel {
  flex: 1; padding: 12px; border: 1.5px solid #e5e7eb; border-radius: 12px;
  background: white; color: #555; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all .2s;
  &:hover { background: #f5f5f5; border-color: #ccc; }
}
.pm-btn-pay {
  flex: 2; padding: 12px 20px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white; border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all .25s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 16px rgba(124,58,237,0.4);
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.5); }
}
.pm-lock { font-size: 14px; }

/* ── PIN ── */
.pm-pin-display {
  display: flex; justify-content: center; gap: 16px; margin: 20px 0 28px;
}
.pm-pin-dot {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2.5px solid #7c3aed; background: white;
  transition: all .2s;
  &.filled { background: #7c3aed; transform: scale(1.1); }
}
.pm-numpad {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  max-width: 280px; margin: 0 auto 20px;
}
.pm-key {
  height: 60px; border-radius: 14px; border: 1.5px solid #e5e7eb;
  background: white; font-size: 20px; font-weight: 600; color: #1a1a2e;
  cursor: pointer; transition: all .15s;
  &:hover { background: #f5f3ff; border-color: #7c3aed; color: #7c3aed; }
  &:active { transform: scale(0.93); }
}
.pm-key-empty { cursor: default; border-color: transparent; &:hover { background: white; border-color: transparent; } }
.pm-key-del { font-size: 18px; }
.pm-pin-error { text-align: center; color: #ef4444; font-size: 13px; margin-bottom: 12px; }

/* ── PROCESSING ── */
.pm-processing {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 0;
}
.pm-spinner-ring {
  width: 56px; height: 56px;
  border: 4px solid rgba(124,58,237,0.15);
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.pm-processing-text { font-size: 17px; font-weight: 700; color: #1a1a2e; }
.pm-processing-sub  { font-size: 13px; color: #888; margin-top: 4px; }

/* ── SUCCESS ── */
.pm-success-content { display: flex; flex-direction: column; align-items: center; }

.pm-checkmark {
  width: 72px; height: 72px; margin-bottom: 16px;
  svg { width: 100%; height: 100%; }
}
.checkmark-circle {
  stroke: #22c55e; stroke-width: 2;
  stroke-dasharray: 166; stroke-dashoffset: 166;
  animation: strokeCircle 0.6s ease forwards;
}
.checkmark-check {
  stroke: #22c55e; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 48; stroke-dashoffset: 48;
  animation: strokeCheck 0.4s ease 0.5s forwards;
}
@keyframes strokeCircle { to { stroke-dashoffset: 0; } }
@keyframes strokeCheck  { to { stroke-dashoffset: 0; } }

.pm-success-title { font-size: 22px; font-weight: 800; color: #1a1a2e; margin: 0 0 6px; font-family: 'Georgia', serif; }
.pm-success-sub   { font-size: 13px; color: #888; margin: 0 0 24px; }

.pm-receipt {
  width: 100%; background: #f9f9f9; border-radius: 14px;
  padding: 16px; margin-bottom: 24px;
}
.pm-receipt-row {
  display: flex; justify-content: space-between;
  font-size: 13px; color: #555; padding: 5px 0;
  border-bottom: 1px solid #eee;
  &:last-child { border-bottom: none; }
}
.pm-green { color: #16a34a; }
.pm-badge-done {
  background: rgba(34,197,94,0.1); color: #16a34a;
  padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;
}

.pm-btn-done {
  width: 100%; padding: 14px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white; border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  transition: all .25s;
  box-shadow: 0 4px 16px rgba(34,197,94,0.3);
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,197,94,0.4); }
}
  `]
})
export class PaymentModalComponent {
  @Input()  projectTitle = '';
  @Input()  budget       = 0;
  @Input()  cardHolder   = 'CLIENT';
  @Output() cancel       = new EventEmitter<void>();
  @Output() done         = new EventEmitter<void>();
  @Output() confirm      = new EventEmitter<void>();

  step     = 'summary'; // summary | pin | processing | success
  pin      = '';
  pinError = false;

  get commission(): number { return Math.round(this.budget * 0.10 * 100) / 100; }
  get montantNet(): number { return Math.round((this.budget - this.commission) * 100) / 100; }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('pm-backdrop')) {
      if (this.step !== 'processing') this.cancel.emit();
    }
  }

  goToPin(): void { this.step = 'pin'; this.pin = ''; this.pinError = false; }

  addPin(digit: string): void {
    if (this.pin.length >= 4) return;
    this.pin += digit;
    this.pinError = false;
    if (this.pin.length === 4) this.processPayment();
  }

  delPin(): void { this.pin = this.pin.slice(0, -1); this.pinError = false; }

  processPayment(): void {
    this.step = 'processing';
    // Simule 2s de traitement puis émet confirm
    setTimeout(() => {
      this.confirm.emit();         // déclenche l'appel API dans le parent
    }, 2000);
  }

  showSuccess(): void { this.step = 'success'; }
}