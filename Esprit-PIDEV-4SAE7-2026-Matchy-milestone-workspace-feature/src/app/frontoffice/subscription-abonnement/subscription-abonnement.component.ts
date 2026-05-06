import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { SubscriptionPlan, Subscription } from '../models/subscription.model';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-subscription-abonnement',
  templateUrl: './subscription-abonnement.component.html',
  styleUrls: ['./subscription-abonnement.component.scss']
})
export class SubscriptionAbonnementComponent implements OnInit {

  @Input() plan!: SubscriptionPlan;
  @Input() billingCycle: 'monthly' | 'yearly' = 'monthly';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  subscription!: Subscription;
  showPayment = false;

  constructor(private subscriptionService: SubscriptionService) { }

  ngOnInit(): void {
    // Crée la subscription avec status PENDING
    this.subscription = this.subscriptionService.buildSubscription(this.plan, this.billingCycle);
  }

  onConfirmSubscription(): void {
    this.confirm.emit();
  }

  onClosePayment(): void {
    this.showPayment = false;
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}