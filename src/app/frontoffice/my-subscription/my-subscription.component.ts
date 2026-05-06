import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription as RxSubscription, interval } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../services/auth.service';
import { SubscriptionPlan, Subscription, PaymentResponse, SubscriptionStatus } from '../models/subscription.model';

export type PageState = 'no-plan' | 'pending' | 'active' | 'loading';

const PENDING_KEY = 'matchy_payment_pending';
const POLL_INTERVAL_MS = 30_000; // check every 30s

@Component({
  selector: 'app-my-subscription',
  templateUrl: './my-subscription.component.html',
  styleUrls: ['./my-subscription.component.scss']
})
export class MySubscriptionComponent implements OnInit, OnDestroy {

  state: PageState = 'loading';

  plan: SubscriptionPlan | null = null;
  currentSubscription: Subscription | null = null;
  paymentSubscription: Subscription | null = null;
  renewDate = new Date();
  progress = 0;
  autoRenew = false;
  pendingRef = '';

  showPayment = false;
  startingTrial = false;

  private rxSub?: RxSubscription;
  private pollSub?: RxSubscription;

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.detectState();

    // React to subscription changes pushed by the service
    this.rxSub = this.subscriptionService.currentSubscription$.subscribe(sub => {
      if (sub) {
        this.currentSubscription = sub;
        this.plan = sub.plan ?? this.plan;
        this.resolveState(sub.status);
        if (sub.endDate) {
          this.renewDate = new Date(sub.endDate);
          const start = new Date(sub.startDate);
          const end   = new Date(sub.endDate);
          const now   = new Date();
          const total = end.getTime() - start.getTime();
          const used  = now.getTime() - start.getTime();
          this.progress = total > 0 ? Math.min(1, Math.max(0, used / total)) : 0;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.rxSub?.unsubscribe();
    this.stopPolling();
  }

  // ── State detection ───────────────────────────────

  private detectState(): void {
    const uid = this.authService.currentUser?.id;

    // 1. PRIORITY: pending payment in localStorage → always show pending
    const pendingRaw = localStorage.getItem(PENDING_KEY);
    if (pendingRaw) {
      try {
        const data = JSON.parse(pendingRaw);
        this.pendingRef = data.ref || '';
        this.plan = {
          id:           data.planId   || 'pro',
          name:         data.planName || 'Pro',
          price:        data.amount   || 0,
          currency:     'TND',
          billingCycle: 'monthly',
          description:  '',
          color:        this.colorForPlan(data.planName),
          icon:         this.iconForPlan(data.planName)
        };
        this.state = 'pending';
        this.startPolling(data.userId || uid);
        return;
      } catch { localStorage.removeItem(PENDING_KEY); }
    }

    // 2. Check backend API for real subscription status
    if (uid) {
      this.state = 'loading';
      this.subscriptionService.listSubscriptions().pipe(
        catchError(() => of([]))
      ).subscribe((subs: any[]) => {
        const userSubs = subs.filter((s: any) => String(s.userId) === String(uid));

        // Check for any PENDING subscription
        const pending = userSubs.find((s: any) =>
          ['PENDING', 'TRIAL'].includes((s.status || '').toUpperCase())
        );
        if (pending) {
          this.state = 'pending';
          this.pendingRef = '';
          if (pending.plan) {
            this.plan = {
              id:           String(pending.plan.id),
              name:         pending.plan.name || 'Pro',
              price:        pending.plan.price || 0,
              currency:     'TND',
              billingCycle: 'monthly',
              description:  '',
              color:        this.colorForPlan(pending.plan.name),
              icon:         this.iconForPlan(pending.plan.name)
            };
          }
          // Store in localStorage so next visit also shows pending
          localStorage.setItem(PENDING_KEY, JSON.stringify({
            planId:   this.plan?.id,
            planName: this.plan?.name,
            amount:   this.plan?.price,
            ref:      '',
            userId:   uid
          }));
          this.startPolling(uid);
          return;
        }

        // Check for ACTIVE subscription
        const active = userSubs.find((s: any) =>
          (s.status || '').toUpperCase() === 'ACTIVE'
        );
        if (active) {
          this.state = 'active';
          if (active.plan) {
            this.plan = {
              id:           String(active.plan.id),
              name:         active.plan.name || 'Pro',
              price:        active.plan.price || 0,
              currency:     'TND',
              billingCycle: 'monthly',
              description:  '',
              color:        this.colorForPlan(active.plan.name),
              icon:         this.iconForPlan(active.plan.name),
              isCurrent:    true
            };
          }
          this.renewDate = active.endDate ? new Date(active.endDate) : new Date();
          if (!active.endDate) this.renewDate.setMonth(this.renewDate.getMonth() + 1);
          this.progress = 0.05;
          return;
        }

        // No subscription found → show upsell
        this.state = 'no-plan';
      });
      return;
    }

    // 3. Fallback: no user logged in
    this.state = 'no-plan';
  }

  private resolveState(status: SubscriptionStatus): void {
    if (status === 'PENDING') {
      this.state = 'pending';
    } else if (status === 'ACTIVE') {
      this.state = 'active';
      localStorage.removeItem(PENDING_KEY);
      this.stopPolling();
    } else {
      this.state = 'no-plan';
    }
  }

  // ── Polling — check if admin approved ────────────

  private startPolling(userId?: number): void {
    this.stopPolling();
    const uid = userId ?? this.authService.currentUser?.id;
    if (!uid) return;

    this.pollSub = interval(POLL_INTERVAL_MS).pipe(
      switchMap(() =>
        this.subscriptionService.listSubscriptions().pipe(catchError(() => of([])))
      )
    ).subscribe((subs: any[]) => {
      const active = subs.find(
        (s: any) => String(s.userId) === String(uid) && s.status === 'ACTIVE'
      );
      if (active) {
        this.state = 'active';
        localStorage.removeItem(PENDING_KEY);
        this.stopPolling();
        // Update plan info from backend response
        if (active.plan) {
          this.plan = {
            id:           String(active.plan.id),
            name:         active.plan.name || this.plan?.name || 'Pro',
            price:        active.plan.price || this.plan?.price || 0,
            currency:     'TND',
            billingCycle: 'monthly',
            description:  active.plan.description || '',
            color:        this.colorForPlan(active.plan.name),
            icon:         this.iconForPlan(active.plan.name),
            isCurrent:    true
          };
        }
        this.renewDate = active.endDate ? new Date(active.endDate) : new Date();
        if (!active.endDate) this.renewDate.setMonth(this.renewDate.getMonth() + 1);
        this.progress = 0.05;
      }
    });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  // ── Helpers ───────────────────────────────────────

  private colorForPlan(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('premium')) return '#3b82f6';
    if (n.includes('pro'))     return '#10b981';
    return '#6b7280';
  }

  private iconForPlan(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('premium')) return '👑';
    if (n.includes('pro'))     return '⚡';
    return '🌱';
  }

  // ── Actions ──────────────────────────────────────

  goToPlans(): void { this.router.navigate(['/subscription-management']); }

  contactSupport(): void {
    window.open('mailto:support@matchy.tn?subject=Payment%20Pending%20-%20' + this.pendingRef, '_blank');
  }

  startFreeTrial(): void {
    this.startingTrial = true;
    const freePlan: SubscriptionPlan = {
      id: 'free', name: 'Free', price: 0, currency: 'TND',
      billingCycle: 'monthly', description: 'Free trial — 30 days',
      features: ['Up to 3 active bids', 'Basic profile', 'Community access', 'Standard support'],
      isPopular: false, isCurrent: true, color: '#6b7280', icon: '🌱'
    };
    this.subscriptionService.markPlanAsCurrent('free');
    setTimeout(() => {
      this.startingTrial = false;
      this.plan = freePlan;
      this.state = 'active';
      this.renewDate = new Date();
      this.renewDate.setMonth(this.renewDate.getMonth() + 1);
      this.progress = 0;
    }, 800);
  }

  toggleAutoRenew(): void { this.autoRenew = !this.autoRenew; }

  changePlan(): void { this.router.navigate(['/subscription-management']); }

  renew(): void {
    if (!this.plan) return;
    this.paymentSubscription = this.subscriptionService.buildSubscription(this.plan, 'monthly');
    this.showPayment = true;
  }

  closePayment(): void {
    this.showPayment = false;
    this.paymentSubscription = null;
  }

  onRenewSuccess(response: PaymentResponse): void {
    this.showPayment = false;
    this.state = 'pending';
    this.pendingRef = response.transactionRef || response.transactionId || '';
    const uid = this.authService.currentUser?.id;
    localStorage.setItem(PENDING_KEY, JSON.stringify({
      planId:   this.plan?.id,
      planName: this.plan?.name,
      amount:   this.plan?.price,
      ref:      this.pendingRef,
      userId:   uid
    }));
    this.startPolling(uid);
  }

  // ── Getters ──────────────────────────────────────

  get planColor(): string { return this.plan?.color || '#4f6ef7'; }
  get planIcon():  string { return this.plan?.icon  || '⚡'; }
  get planName():  string { return this.plan?.name  || 'Pro'; }
}
