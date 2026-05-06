// src/app/client/projects/escrow-payment/escrow-payment.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EscrowPaymentService,
  ProjectDetail,
  PaymentSummary,
  EscrowRequest,
  EscrowResponse,
} from './escrow-payment.service';

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'D17';

@Component({
  selector: 'app-escrow-payment',
  templateUrl: './escrow-payment.component.html',
  styleUrls: ['./escrow-payment.component.scss'],
})
export class EscrowPaymentComponent implements OnInit {

  project: ProjectDetail | null = null;
  summary: PaymentSummary | null = null;

  loadingProject = true;
  loadingPayment = false;
  errorMessage   = '';
  paymentSuccess = false;
  transactionId: number | null = null;

  selectedMethod: PaymentMethod = 'BANK_TRANSFER';
  currentStep = 3;

  readonly steps = [
    { label: 'Project Created'    },
    { label: 'Freelancer Assigned'},
    { label: 'Escrow Payment'     },
    { label: 'In Progress'        },
    { label: 'Delivery'           },
    { label: 'Funds Released'     },
  ];

  readonly paymentMethods: {
    key: PaymentMethod;
    icon: string;
    name: string;
    desc: string;
    badge?: string;
  }[] = [
    { key: 'BANK_TRANSFER', icon: '🏦', name: 'Bank Transfer', desc: 'STB, BNA, Attijari…', badge: 'Recommended' },
    { key: 'CARD',          icon: '💳', name: 'Credit Card',   desc: 'Visa, Mastercard' },
    { key: 'D17',           icon: '📱', name: 'D17 / Flouci',  desc: 'Mobile payment' },
  ];

  constructor(
    private route:   ActivatedRoute,
    private router:  Router,
    private service: EscrowPaymentService,
  ) {}

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    if (!projectId) {
      this.errorMessage   = 'Project ID is missing.';
      this.loadingProject = false;
      return;
    }
    this.loadProject(projectId);
  }

  private loadProject(projectId: number): void {
    this.loadingProject = true;
    this.errorMessage   = '';

    this.service.getProjectById(projectId).subscribe({
      next: (project: ProjectDetail) => {
        this.project        = project;
        this.summary        = this.service.calculateSummary(project.budget);
        this.loadingProject = false;
      },
      error: (err: any) => {
        this.errorMessage   = err?.error?.message ?? 'Unable to load project.';
        this.loadingProject = false;
      },
    });
  }

  processPayment(): void {
    if (!this.project || this.loadingPayment) return;

    if (!this.project.freelancer) {
      this.errorMessage = 'No freelancer assigned to this project.';
      return;
    }

    this.loadingPayment = true;
    this.errorMessage   = '';

    const payload: EscrowRequest = {
      projectId:     this.project.id,
      clientId:      this.project.client.id,
      freelancerId:  this.project.freelancer.id,
      paymentMethod: this.selectedMethod,
    };

    this.service.processEscrow(payload).subscribe({
      next: (res: EscrowResponse) => {
        this.transactionId  = res.transactionId;
        this.paymentSuccess = true;
        this.currentStep    = 4;
        this.loadingPayment = false;
      },
      error: (err: any) => {
        this.errorMessage   = err?.error?.message ?? 'Payment failed. Please try again.';
        this.loadingPayment = false;
      },
    });
  }

  selectMethod(method: PaymentMethod): void {
    this.selectedMethod = method;
  }

  goToDashboard(): void {
    this.router.navigate(['/client/projects']);
  }

  getStepState(index: number): 'done' | 'active' | 'pending' {
    const step = index + 1;
    if (step < this.currentStep)   return 'done';
    if (step === this.currentStep) return 'active';
    return 'pending';
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}