import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../_env/environment';

export interface ProjectDetail {
  id: number;
  title: string;
  description: string;
  budget: number;
  category: string;
  createdAt: string;
  status: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
  };
  freelancer: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

export interface EscrowRequest {
  projectId: number;
  clientId: number;
  freelancerId: number;
  paymentMethod: string;
}

export interface EscrowResponse {
  transactionId: number;
  amount: number;
  commission: number;
  netAmount: number;
  status: string;
  message: string;
}

export interface PaymentSummary {
  grossAmount: number;
  commission: number;
  netAmount: number;
  commissionRate: number;
}

@Injectable({ providedIn: 'root' })
export class EscrowPaymentService {

  private readonly COMMISSION_RATE = 0.10;
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProjectById(projectId: number): Observable<ProjectDetail> {
    return this.http.get<ProjectDetail>(`${this.API}/projects/${projectId}`);
  }

  calculateSummary(budget: number): PaymentSummary {
    const commission = Math.round(budget * this.COMMISSION_RATE * 100) / 100;
    const netAmount  = Math.round((budget - commission) * 100) / 100;
    return {
      grossAmount:    budget,
      commission,
      netAmount,
      commissionRate: this.COMMISSION_RATE * 100,
    };
  }

  processEscrow(payload: EscrowRequest): Observable<EscrowResponse> {
    return this.http.post<EscrowResponse>(`${this.API}/payments/escrow`, payload);
  }
}
