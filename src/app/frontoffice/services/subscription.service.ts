import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  SubscriptionPlan, Subscription, Payment, PaymentResponse,
  SubscriptionStatus, PaymentMethod, PaymentPayload, PaymentCurrency
} from '../models/subscription.model';
import { CurrencyService } from './currency.service';
import { AuthService } from '../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {

  private readonly SUBSCRIPTION_API = `${environment.apiUrl}/subscription`;
  private readonly PAYMENT_API = `${environment.apiUrl}/payment`;
  private readonly PLAN_API = `${environment.apiUrl}/plan`;

  /** Maps the front-office plan slug to the backend DB plan id. */
  private readonly PLAN_ID_BY_SLUG: Record<string, number> = {
    free: 1, FREE: 1,
    pro: 2, PRO: 2,
    premium: 3, PREMIUM: 3, elite: 3, ELITE: 3
  };

  constructor(
    private readonly currencyService: CurrencyService,
    private readonly authService: AuthService,
    private http: HttpClient
  ) {
    this.loadFromLocalStorage();
  }

  private selectedPlanSubject = new BehaviorSubject<SubscriptionPlan | null>(null);
  selectedPlan$ = this.selectedPlanSubject.asObservable();

  private billingCycleSubject = new BehaviorSubject<'monthly' | 'yearly'>('monthly');
  billingCycle$ = this.billingCycleSubject.asObservable();

  private currentSubscriptionSubject = new BehaviorSubject<Subscription | null>(null);
  currentSubscription$ = this.currentSubscriptionSubject.asObservable();

  private readonly STORAGE_KEY = 'matchy_subscription_plans';

  private plans: SubscriptionPlan[] = [
    {
      id: 'free', name: 'Free', price: 0, currency: 'TND', billingCycle: 'monthly',
      description: 'Perfect to get started as a freelancer.',
      features: ['Up to 3 active bids', 'Basic profile', 'Community access', 'Standard support'],
      isPopular: false, isCurrent: false, color: '#6b7280', icon: '🌱'
    },
    {
      id: 'pro', name: 'Pro', price: 29, currency: 'TND', billingCycle: 'monthly',
      description: 'For serious freelancers who want to grow.',
      features: ['Unlimited bids', 'Featured profile', 'Priority in search results', 'Analytics dashboard', 'Badge Pro', 'Priority support'],
      isPopular: true, isCurrent: false, color: '#10b981', icon: '⚡'
    },
    {
      id: 'premium', name: 'Premium', price: 69, currency: 'TND', billingCycle: 'monthly',
      description: 'For top freelancers and agencies.',
      features: ['Everything in Pro', 'Dedicated account manager', 'Team workspace', 'White-label proposals', 'API access', '24/7 support'],
      isPopular: false, isCurrent: false, color: '#3b82f6', icon: '👑'
    }
  ];

  private saveToLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.plans));
    }
  }

  private loadFromLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          let loadedPlans: SubscriptionPlan[] = JSON.parse(stored);
          let modified = false;
          loadedPlans = loadedPlans.map(plan => {
            if (plan.id === 'elite') { plan.id = 'premium'; plan.name = 'Premium'; modified = true; }
            if (plan.isCurrent) { plan.isCurrent = false; modified = true; }
            return plan;
          });
          this.plans = loadedPlans;
          if (modified) this.saveToLocalStorage();
        } catch (e) { console.error('Error parsing stored plans', e); }
      }
    }
  }

  getPlans(billingCycle: 'monthly' | 'yearly'): SubscriptionPlan[] {
    return this.plans.map(plan => ({
      ...plan, billingCycle,
      price: billingCycle === 'yearly' ? Math.round(plan.price * 12 * 0.80) : plan.price
    }));
  }

  getApiPlans(): Observable<any[]> {
    return this.http.get<any[]>(this.PLAN_API).pipe(catchError(() => of([])));
  }

  addPlan(plan: SubscriptionPlan): void { this.plans.push(plan); this.saveToLocalStorage(); }
  updatePlan(plan: SubscriptionPlan): void {
    const idx = this.plans.findIndex(p => p.id === plan.id);
    if (idx !== -1) { this.plans[idx] = plan; this.saveToLocalStorage(); }
  }
  deletePlan(id: string): void { this.plans = this.plans.filter(p => p.id !== id); this.saveToLocalStorage(); }
  setSelectedPlan(plan: SubscriptionPlan): void { this.selectedPlanSubject.next(plan); }
  getSelectedPlan(): SubscriptionPlan | null { return this.selectedPlanSubject.getValue(); }
  setBillingCycle(cycle: 'monthly' | 'yearly'): void { this.billingCycleSubject.next(cycle); }

  buildSubscription(plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly'): Subscription {
    const duration = billingCycle === 'monthly' ? 1 : 12;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);
    return { plan, priceAtPurchase: plan.price, duration, startDate, endDate, status: 'PENDING' as SubscriptionStatus };
  }

  buildPayment(subscription: Subscription, paymentData: Partial<Payment>): Payment {
    const cur = this.currencyService.getCurrency() as PaymentCurrency;
    const amountTnd = paymentData.amountOriginalTnd ?? subscription.priceAtPurchase;
    return {
      subscription,
      amount: this.currencyService.convertFromTnd(amountTnd),
      amountOriginalTnd: amountTnd,
      currency: cur,
      method: paymentData.method || 'CARD',
      status: 'PENDING' as any,
      cardNumber: paymentData.cardNumber,
      expiryDate: paymentData.expiryDate,
      cvv: paymentData.cvv,
      cardholderName: paymentData.cardholderName,
      paypalEmail: paymentData.paypalEmail,
      mobileProvider: paymentData.mobileProvider,
      mobilePhone: paymentData.mobilePhone,
      mobileTransactionCode: paymentData.mobileTransactionCode,
      bankName: paymentData.bankName,
      rib: paymentData.rib,
      accountHolder: paymentData.accountHolder,
      transferReference: paymentData.transferReference,
      promoCode: paymentData.promoCode,
      discountAmountTnd: paymentData.discountAmountTnd,
      lastFourDigits: paymentData.cardNumber ? paymentData.cardNumber.replace(/\D/g, '').slice(-4) : undefined,
      transactionDate: new Date()
    };
  }

  private toApiMethod(m: PaymentMethod): PaymentPayload['paymentMethod'] {
    const map: Record<PaymentMethod, PaymentPayload['paymentMethod']> = {
      CARD: 'card', PAYPAL: 'paypal', MOBILE: 'mobile', BANK_TRANSFER: 'bank_transfer'
    };
    return map[m] ?? 'card';
  }

  /** HTTP flow against subscription microservice via api-gateway. */
  processPayment(payment: Payment, userId: string, transactionRef?: string): Observable<PaymentResponse> {
    const ref = transactionRef || `TXN-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const numericUserId = userId && userId !== 'guest' ? Number(userId) : 1;
    const planId = payment.subscription?.plan?.id;
    const planName = (payment.subscription?.plan?.name ?? String(planId ?? '')).toUpperCase();

    // Resolve numeric plan ID: try slug map first, then direct numeric
    let numericPlanId: number | null = null;
    if (planId != null && !isNaN(Number(planId))) {
      numericPlanId = Number(planId);
    } else if (typeof planId === 'string' && this.PLAN_ID_BY_SLUG[planId] != null) {
      numericPlanId = this.PLAN_ID_BY_SLUG[planId];
    }
    // Also try resolving by planName slug
    if (numericPlanId == null && planName && this.PLAN_ID_BY_SLUG[planName.toLowerCase()] != null) {
      numericPlanId = this.PLAN_ID_BY_SLUG[planName.toLowerCase()];
    }

    const subscriptionPayload: any = {
      priceAtPurchase: payment.amountOriginalTnd ?? payment.amount,
      userId: numericUserId,
      plan: numericPlanId ? { id: numericPlanId } : null,
      planName: planName || null,
      userName:  this.authService.currentUser?.name  || null,
      userEmail: this.authService.currentUser?.email || null
    };

    return this.http.post<any>(this.SUBSCRIPTION_API, subscriptionPayload).pipe(
      switchMap((createdSub: any) => {
        const paymentPayload: any = {
          amount: payment.amountOriginalTnd ?? payment.amount,
          currency: 'TND',
          method: payment.method,
          status: 'PENDING',
          transactionRef: ref,
          cardholderName: payment.cardholderName ?? null,
          bankName: payment.bankName ?? null,
          rib: payment.rib ?? null,
          accountHolder: payment.accountHolder ?? null,
          subscription: { id: createdSub.id },
          userId: numericUserId,
          promoCode: payment.promoCode ?? null,
          discountAmountTnd: payment.discountAmountTnd ?? null,
          userName:  this.authService.currentUser?.name  || null,
          userEmail: this.authService.currentUser?.email || null
        };
        return this.http.post<any>(this.PAYMENT_API, paymentPayload);
      }),
      map((res): PaymentResponse => ({
        success: true,
        message: 'Your payment has been submitted and is awaiting admin confirmation. You will receive a confirmation email once approved.',
        paymentId: String(res.id),
        transactionId: res.transactionRef || ref,
        transactionRef: res.transactionRef || ref
      })),
      catchError((err) => {
        console.error('[processPayment] failed:', err);
        // Extract a readable error message from the HTTP error response
        let msg = 'Payment submission failed. Please try again.';
        if (err?.error) {
          if (typeof err.error === 'string') {
            msg = err.error;
          } else if (typeof err.error === 'object' && err.error?.message) {
            msg = err.error.message;
          } else if (typeof err.error === 'object' && err.error?.error) {
            msg = err.error.error;
          }
        } else if (err?.message) {
          msg = err.message;
        }
        return of<PaymentResponse>({
          success: false,
          message: msg,
          paymentId: '',
          transactionId: ref,
          transactionRef: ref
        });
      })
    );
  }

  activateSubscription(subscription: Subscription): Subscription {
    const activated: Subscription = { ...subscription, id: Math.floor(Math.random() * 1000000), status: 'ACTIVE' as SubscriptionStatus };
    this.currentSubscriptionSubject.next(activated);
    return activated;
  }

  getCurrentPlan(): SubscriptionPlan {
    return this.plans.find(p => p.isCurrent) || this.plans[0];
  }

  /** Marks the given plan (by slug) as the user's current plan and persists locally. */
  markPlanAsCurrent(planSlug: string): void {
    const slug = String(planSlug).toLowerCase();
    let matched: SubscriptionPlan | null = null;
    this.plans = this.plans.map(p => {
      const isMatch = String(p.id).toLowerCase() === slug;
      if (isMatch) matched = { ...p, isCurrent: true };
      return { ...p, isCurrent: isMatch };
    });
    this.saveToLocalStorage();
    if (matched) {
      const sub = this.buildSubscription(matched, 'monthly');
      sub.status = 'ACTIVE' as SubscriptionStatus;
      this.currentSubscriptionSubject.next(sub);
    }
  }

  listSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(this.SUBSCRIPTION_API).pipe(catchError(() => of([])));
  }

  createApiSubscription(payload: { userId: number; planId: number; planName?: string; priceAtPurchase: number }): Observable<any> {
    return this.http.post<any>(this.SUBSCRIPTION_API, {
      priceAtPurchase: payload.priceAtPurchase,
      userId: payload.userId,
      plan: { id: payload.planId },
      planName: payload.planName
    });
  }

  deleteApiSubscription(id: number | string): Observable<any> {
    return this.http.delete(`${this.SUBSCRIPTION_API}/${id}`);
  }

  upgradeSubscription(userId: number, newPlanId: number): Observable<any> {
    return this.http.post(`${this.SUBSCRIPTION_API}/upgrade?userId=${userId}&newPlanId=${newPlanId}`, {});
  }
}
