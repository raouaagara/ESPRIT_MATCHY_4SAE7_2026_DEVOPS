import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionPlan, PaymentResponse } from '../models/subscription.model';
import { SubscriptionService } from '../services/subscription.service';
import { CurrencyService } from '../services/currency.service';

interface Invoice {
  id: string;
  date: Date;
  plan: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-subscription-management',
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.scss']
})
export class SubscriptionManagementComponent implements OnInit {

  plans: SubscriptionPlan[] = [];
  billingCycle: 'monthly' | 'yearly' = 'monthly';
  showConfirmation = false;
  showPayment = false;
  showSuccessModal = false;
  isFreePlanSuccess = false;
  selectedPlan: SubscriptionPlan | null = null;
  currentPlan!: SubscriptionPlan;

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
    public currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadPlans();
    this.currentPlan = this.subscriptionService.getCurrentPlan();
  }

  loadPlans(): void {
    this.plans = this.subscriptionService.getPlans(this.billingCycle);
  }

  toggleBillingCycle(cycle: 'monthly' | 'yearly'): void {
    this.billingCycle = cycle;
    this.subscriptionService.setBillingCycle(cycle);
    this.loadPlans();
  }

  getPrice(plan: SubscriptionPlan): number {
    return plan.price;
  }

  getPeriod(): string {
    return this.billingCycle === 'monthly' ? '/month' : '/year';
  }

  getPeriodFr(): string {
    return this.billingCycle === 'monthly' ? '/mois' : '/an';
  }

  onSelectPlan(plan: SubscriptionPlan): void {
    if (plan.isCurrent) return;

    this.selectedPlan = plan;
    this.subscriptionService.setSelectedPlan(plan);

    // Free plan: show confirmation modal
    if (plan.price === 0) {
      this.showConfirmation = true;
    } else {
      this.showPayment = true;
    }
  }

  onConfirmFreePlan(): void {
    this.showConfirmation = false;
    this.isFreePlanSuccess = true;
    this.showSuccessModal = true;
    if (this.selectedPlan) {
      this.currentPlan = { ...this.selectedPlan, isCurrent: true };
    }
  }

  onPaymentSuccess(_response: PaymentResponse): void {
    // The payment pending popup is shown INSIDE SubscriptionPaymentComponent.
    // We do NOT close the payment modal here — let the user click "Go to Dashboard"
    // inside the pending popup, which will navigate to /my-subscription.
    // Just hide the plans page payment overlay without navigating.
    // Navigation is handled by onDashboard() inside SubscriptionPaymentComponent.
  }

  downloadInvoice(): void {
    console.log('Downloading invoice as PDF...');
    // Real logic would involve a service call to generate/get the PDF
    alert('Invoice download started (PDF)');
  }

  closeModal(): void {
    this.showConfirmation = false;
    this.showPayment = false;
    this.showSuccessModal = false;
    this.isFreePlanSuccess = false;
    this.selectedPlan = null;
  }

  onCloseConfirmation(): void {
    this.closeModal();
  }

  onClosePayment(): void {
    this.closeModal();
  }

  buildSubscription(plan: SubscriptionPlan): any {
    return this.subscriptionService.buildSubscription(plan, this.billingCycle);
  }
}