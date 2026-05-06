import { Component, OnInit } from '@angular/core';
import { SubscriptionService } from '../../../frontoffice/services/subscription.service';
import { SubscriptionPlan } from '../../../frontoffice/models/subscription.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscription-plan-comparison',
  templateUrl: './subscription-plan-comparison.component.html',
  styleUrl: './subscription-plan-comparison.component.scss'
})
export class SubscriptionPlanComparisonComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  billingCycle: 'monthly' | 'yearly' = 'monthly';

  constructor(private subscriptionService: SubscriptionService, private router: Router) { }

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.plans = this.subscriptionService.getPlans(this.billingCycle);
  }

  getAllFeatures(): string[] {
    const all = new Set<string>();
    this.plans.forEach(p => (p.features || []).forEach(f => all.add(f)));
    return Array.from(all);
  }

  planHasFeature(plan: SubscriptionPlan, feature: string): boolean {
    return (plan.features || []).includes(feature);
  }

  goBack(): void {
    this.router.navigate(['/backoffice/subscription-plan']);
  }
}
