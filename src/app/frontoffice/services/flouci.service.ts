import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FlouciInitResponse {
  paymentUrl: string;
  paymentId: string;
  ref: string;
}

export interface FlouciVerifyResponse {
  success: boolean;
  status: string;
  amount: number;
  paymentId: string;
}

@Injectable({ providedIn: 'root' })
export class FlouciService {
  private readonly API_URL = `${environment.apiUrl}/Flouci`;

  constructor(private readonly http: HttpClient) {}

  initPayment(amountTnd: number, transactionRef: string): Observable<FlouciInitResponse> {
    return this.http.post<FlouciInitResponse>(`${this.API_URL}/init`, { amount: amountTnd, transactionRef });
  }

  verifyPayment(paymentId: string): Observable<FlouciVerifyResponse> {
    return this.http.get<FlouciVerifyResponse>(`${this.API_URL}/verify/${paymentId}`);
  }
}
