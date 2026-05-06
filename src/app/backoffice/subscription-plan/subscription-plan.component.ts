import { Component, OnInit } from '@angular/core';
import { SubscriptionService } from '../../frontoffice/services/subscription.service';
import { SubscriptionPlan } from '../../frontoffice/models/subscription.model';
import { Router } from '@angular/router';

@Component({
    selector: 'app-bo-subscription-plan',
    templateUrl: './subscription-plan.component.html',
    styleUrls: ['./subscription-plan.component.scss']
})
export class BoSubscriptionPlanComponent implements OnInit {
    plans: SubscriptionPlan[] = [];
    billingCycle: 'monthly' | 'yearly' = 'monthly';
    showComparison = false;

    // Modal state
    showModal = false;
    showDeleteModal = false;
    isEditing = false;
    editingPlan: SubscriptionPlan | null = null;
    planToDelete: SubscriptionPlan | null = null;

    // Form
    form = this.getEmptyForm();

    // Pickers
    icons = ['🌱', '⚡', '👑', '🚀', '💎', '🔥', '⭐', '🎯', '💼', '🏆'];
    colors = ['#6b7280', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

    constructor(private subscriptionService: SubscriptionService, private router: Router) { }

    ngOnInit(): void {
        this.loadPlans();
    }

    loadPlans(): void {
        this.plans = this.subscriptionService.getPlans(this.billingCycle);
    }

    toggleBilling(cycle: 'monthly' | 'yearly'): void {
        this.billingCycle = cycle;
        this.loadPlans();
    }

    toggleComparison(): void {
        this.router.navigate(['/backoffice/subscription-plan-comparison']);
    }

    getEmptyForm() {
        return {
            id: '' as string | number, name: '', price: 0, currency: 'TND',
            description: '', features: '',
            isPopular: false, color: '#10b981', icon: '🌱'
        };
    }

    openAdd(): void {
        this.isEditing = false;
        this.form = this.getEmptyForm();
        this.showModal = true;
    }

    openEdit(plan: SubscriptionPlan): void {
        this.isEditing = true;
        this.editingPlan = plan;
        this.form = {
            id: plan.id || '',
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            description: plan.description,
            features: (plan.features || []).join('\n'),
            isPopular: plan.isPopular || false,
            color: plan.color || '#10b981',
            icon: plan.icon || '🌱'
        };
        this.showModal = true;
    }

    save(): void {
        if (!this.form.name.trim() || !this.form.description.trim()) return;

        const plan: SubscriptionPlan = {
            id: this.isEditing ? this.form.id : this.form.name.toLowerCase().replace(/\s+/g, '-'),
            name: this.form.name as any,
            price: this.form.price,
            currency: this.form.currency,
            billingCycle: 'monthly',
            description: this.form.description,
            features: this.form.features.split('\n').map(f => f.trim()).filter(f => f),
            isPopular: this.form.isPopular,
            isCurrent: false,
            color: this.form.color,
            icon: this.form.icon
        };

        if (this.isEditing) {
            this.subscriptionService.updatePlan(plan);
        } else {
            this.subscriptionService.addPlan(plan);
        }
        this.loadPlans();
        this.showModal = false;
    }

    confirmDelete(plan: SubscriptionPlan): void {
        this.planToDelete = plan;
        this.showDeleteModal = true;
    }

    deletePlan(): void {
        if (this.planToDelete && this.planToDelete.id !== undefined) {
            this.subscriptionService.deletePlan(this.planToDelete.id.toString());
            this.loadPlans();
            this.showDeleteModal = false;
            this.planToDelete = null;
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.showDeleteModal = false;
    }

    getAllFeatures(): string[] {
        const all = new Set<string>();
        this.plans.forEach(p => (p.features || []).forEach(f => all.add(f)));
        return Array.from(all);
    }

    planHasFeature(plan: SubscriptionPlan, feature: string): boolean {
        return (plan.features || []).includes(feature);
    }

    getYearlyPrice(price: number): number {
        return Math.round(price * 12 * 0.80);
    }
}
