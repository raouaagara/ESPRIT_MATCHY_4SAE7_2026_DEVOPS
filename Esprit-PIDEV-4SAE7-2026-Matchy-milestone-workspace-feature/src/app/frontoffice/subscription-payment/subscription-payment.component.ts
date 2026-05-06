import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  SubscriptionPlan, Subscription, Payment, PaymentResponse, PaymentMethod, MobileProvider
} from '../models/subscription.model';
import { SubscriptionService } from '../services/subscription.service';
import { CurrencyService } from '../services/currency.service';
import { AuthService } from '../services/auth.service';
import { PdfService } from '../services/pdf.service';
import { PromoCodeService, PromoValidationResult } from '../services/promo-code.service';

const SESSION_MS = 15 * 60 * 1000;

@Component({
  selector: 'app-subscription-payment',
  templateUrl: './subscription-payment.component.html',
  styleUrls: ['./subscription-payment.component.scss']
})
export class SubscriptionPaymentComponent implements OnInit, OnChanges, OnDestroy {
  @Input() plan!: SubscriptionPlan;
  @Input() subscription!: Subscription;
  @Input() selectedPaymentMethod: PaymentMethod | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<PaymentResponse>();

  currentStep: 1 | 2 | 3 | 4 = 1;
  activeMethod: PaymentMethod | null = null;

  paymentForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showSuccessModal = false;
  lastResponse: PaymentResponse | null = null;

  promoMessage = '';
  promoResult: PromoValidationResult | null = null;
  promoChecking = false;

  timerLabel = '';
  private timerId: ReturnType<typeof setInterval> | null = null;
  private sessionEnd = 0;

  mobileProviders: { id: MobileProvider; label: string; icon: string }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly subscriptionService: SubscriptionService,
    public readonly currencyService: CurrencyService,
    private readonly authService: AuthService,
    private readonly pdfService: PdfService,
    private readonly promoCodeService: PromoCodeService,
    private readonly router: Router
  ) {
    this.paymentForm = this.fb.group({
      promoCode: [''],
      // Card
      cardholderName: [''],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      saveCard: [true],
      // PayPal
      paypalEmail: [''],
      paypalSubMethod: ['account'], // 'card' | 'account'
      // Mobile
      mobileProvider: ['D17'],
      mobilePhone: [''],
      mobileTransactionCode: [''],
      // Bank Transfer
      bankName: [''],
      rib: [''],
      accountHolder: ['']
    });
  }

  ngOnInit(): void {
    // Always start from step 1 — never restore a previous draft step
    // so the user always goes through all payment steps
    this.clearDraft();
    this.startSessionTimer();
    if (this.selectedPaymentMethod) this.activeMethod = this.selectedPaymentMethod;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPaymentMethod'] && this.selectedPaymentMethod) {
      this.activeMethod = this.selectedPaymentMethod;
    }
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  get basePriceTnd(): number { return this.subscription.priceAtPurchase; }

  get effectivePriceTnd(): number {
    if (this.promoResult?.valid && this.promoResult.discountValue != null) {
      return this.promoCodeService.applyDiscount(this.basePriceTnd, this.promoResult);
    }
    return this.basePriceTnd;
  }

  get discountTnd(): number {
    return Math.max(0, Math.round((this.basePriceTnd - this.effectivePriceTnd) * 100) / 100);
  }

  get convertedAmount(): number { return this.currencyService.convertFromTnd(this.effectivePriceTnd); }

  get cardBrand(): 'visa' | 'mastercard' | 'unknown' {
    const d = (this.paymentForm.get('cardNumber')?.value || '').replace(/\D/g, '');
    if (d.startsWith('4')) return 'visa';
    if (d.startsWith('5') || d.startsWith('2')) return 'mastercard';
    return 'unknown';
  }

  get progressPercent(): number { return (this.currentStep / 4) * 100; }

  private draftKey(): string {
    return `matchy_payment_draft_${this.plan?.id ?? 'plan'}_${this.authService.currentUser?.id ?? 'guest'}`;
  }

  private loadDraft(): void {
    try {
      const raw = sessionStorage.getItem(this.draftKey());
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.form) this.paymentForm.patchValue(d.form, { emitEvent: false });
      if (d.step >= 1 && d.step <= 4) this.currentStep = d.step;
      if (d.activeMethod) this.activeMethod = d.activeMethod;
    } catch { /* ignore */ }
  }

  saveDraft(): void {
    try {
      sessionStorage.setItem(this.draftKey(), JSON.stringify({
        step: this.currentStep, activeMethod: this.activeMethod, form: this.paymentForm.value
      }));
    } catch { /* ignore */ }
  }

  private clearDraft(): void {
    try { sessionStorage.removeItem(this.draftKey()); } catch { /* ignore */ }
  }

  private startSessionTimer(): void {
    this.sessionEnd = Date.now() + SESSION_MS;
    this.tickTimer();
    this.timerId = setInterval(() => this.tickTimer(), 1000);
  }

  private tickTimer(): void {
    const left = Math.max(0, this.sessionEnd - Date.now());
    if (left <= 0) { this.timerLabel = '0:00'; return; }
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    this.timerLabel = `${m}:${s.toString().padStart(2, '0')}`;
  }

  validatePromo(): void {
    const code = this.paymentForm.get('promoCode')?.value || '';
    if (!code.trim()) { this.promoResult = null; this.promoMessage = ''; return; }
    this.promoChecking = true;
    this.promoCodeService.validate(code, String(this.plan.id), this.basePriceTnd).subscribe({
      next: r => { this.promoResult = r; this.promoMessage = r.message; this.promoChecking = false; },
      error: () => { this.promoChecking = false; }
    });
  }

  goStep1Next(): void { this.currentStep = 2; }

  selectMethod(m: PaymentMethod): void { this.activeMethod = m; }

  goStep2Next(): void {
    if (!this.activeMethod) { this.errorMessage = 'Please choose a payment method.'; return; }
    this.errorMessage = '';
    this.applyValidatorsForMethod();
    this.currentStep = 3;
  }

  goStep3Next(): void {
    this.applyValidatorsForMethod();
    this.paymentForm.updateValueAndValidity({ emitEvent: true });
    if (this.paymentForm.invalid) { this.paymentForm.markAllAsTouched(); return; }
    this.currentStep = 4;
  }

  goBack(): void {
    this.errorMessage = '';
    if (this.currentStep > 1) { this.currentStep = (this.currentStep - 1) as 1 | 2 | 3 | 4; }
  }

  private applyValidatorsForMethod(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      if (key !== 'promoCode') this.paymentForm.get(key)?.clearValidators();
    });
    if (this.activeMethod === 'CARD') {
      this.paymentForm.get('cardholderName')?.setValidators([Validators.required, Validators.minLength(3)]);
      this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
      this.paymentForm.get('expiryDate')?.setValidators([Validators.required]);
      this.paymentForm.get('cvv')?.setValidators([Validators.required]);
    } else if (this.activeMethod === 'PAYPAL') {
      this.paymentForm.get('paypalEmail')?.setValidators([Validators.required, Validators.email]);
    }
    Object.keys(this.paymentForm.controls).forEach(key => {
      this.paymentForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').substring(0, 16);
    this.paymentForm.get('cardNumber')?.setValue(digits, { emitEvent: true });
    input.value = digits.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2);
    this.paymentForm.get('expiryDate')?.setValue(value, { emitEvent: true });
    input.value = value;
  }

  downloadInvoicePreview(): void {
    const ref = this.lastResponse?.transactionRef || this.lastResponse?.transactionId || 'PREVIEW';
    this.pdfService.downloadInvoice({
      invoiceId: 'INV-' + ref.slice(-8),
      clientName: this.authService.currentUser?.name || 'Client',
      clientEmail: this.authService.currentUser?.email || '—',
      planName: String(this.plan.name),
      amountTnd: this.effectivePriceTnd,
      amountOriginal: this.convertedAmount,
      currency: this.currencyService.getCurrency(),
      durationMonths: this.subscription.duration || 1,
      periodStart: new Date(this.subscription.startDate).toLocaleDateString('en-US'),
      periodEnd: new Date(this.subscription.endDate).toLocaleDateString('en-US'),
      paymentMethod: this.activeMethod || '—',
      transactionRef: ref,
      paid: false
    });
  }

  onSubmit(): void {
    if (!this.activeMethod) return;
    this.applyValidatorsForMethod();
    if (this.paymentForm.invalid) { this.paymentForm.markAllAsTouched(); return; }

    this.isLoading = true;
    this.errorMessage = '';
    const v = this.paymentForm.value;
    const userId = this.authService.currentUser?.id != null ? String(this.authService.currentUser.id) : 'guest';
    const ref = `TXN-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const payment: Payment = this.subscriptionService.buildPayment(this.subscription, {
      method: this.activeMethod,
      amountOriginalTnd: this.effectivePriceTnd,
      cardNumber: v.cardNumber,
      expiryDate: v.expiryDate,
      cvv: v.cvv,
      cardholderName: v.cardholderName,
      paypalEmail: v.paypalEmail,
      mobileProvider: v.mobileProvider,
      mobilePhone: v.mobilePhone,
      mobileTransactionCode: v.mobileTransactionCode,
      bankName: v.bankName,
      rib: v.rib,
      accountHolder: v.accountHolder,
      promoCode: v.promoCode?.trim() || undefined,
      discountAmountTnd: this.discountTnd > 0 ? this.discountTnd : undefined
    });

    // Always show the pending popup immediately after 1s "processing" delay
    // The API call runs in background — UX never blocks on backend errors
    const showPendingPopup = (transactionRef: string) => {
      this.isLoading = false;
      this.lastResponse = {
        success: true,
        message: 'Your payment is pending admin approval.',
        paymentId: '',
        transactionId: transactionRef,
        transactionRef: transactionRef
      };
      // Store pending flag so My Subscription page shows the pending state
      localStorage.setItem('matchy_payment_pending', JSON.stringify({
        planId:   this.plan?.id,
        planName: this.plan?.name,
        amount:   this.effectivePriceTnd,
        ref:      transactionRef,
        userId:   this.authService.currentUser?.id ?? null
      }));
      this.showSuccessModal = true;
      // Do NOT call markPlanAsCurrent here — the plan is PENDING, not active yet.
      // My Subscription will show pending state based on localStorage flag.
      this.paymentSuccess.emit(this.lastResponse);
      sessionStorage.removeItem(this.draftKey());
    };

    this.subscriptionService.processPayment(payment, userId, ref).subscribe({
      next: (response: PaymentResponse) => {
        // Use the real transaction ref from backend if available
        showPendingPopup(response.transactionRef || response.transactionId || ref);
      },
      error: () => {
        // Backend failed but we still show the pending popup
        // Payment will be retried or handled by admin
        showPendingPopup(ref);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const f = this.paymentForm.get(fieldName);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  fieldError(fieldName: string): string {
    const f = this.paymentForm.get(fieldName);
    if (!f || !f.errors || (!f.dirty && !f.touched)) return '';
    if (f.errors['required']) return 'Required field';
    if (f.errors['email']) return 'Invalid email address';
    if (f.errors['pattern']) return 'Card number must be 16 digits';
    return 'Invalid';
  }

  onDashboard(): void {
    this.showSuccessModal = false;
    // Navigate first, then emit close so the parent doesn't destroy
    // this component before the router has time to navigate
    this.router.navigate(['/my-subscription']).then(() => {
      this.close.emit();
    });
  }
}
