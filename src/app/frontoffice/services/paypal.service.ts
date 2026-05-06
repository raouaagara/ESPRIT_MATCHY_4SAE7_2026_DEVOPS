import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PayPalOrderResponse {
  orderId: string;
  approvalUrl: string;
  ref: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class PayPalService {
  private readonly API_URL = `${environment.apiUrl}/PayPal`;

  constructor(private http: HttpClient) {}

  createOrder(amount: number, currency: string = 'USD', transactionRef: string): Observable<PayPalOrderResponse> {
    return this.http.post<PayPalOrderResponse>(`${this.API_URL}/create-order`, { amount, currency, transactionRef });
  }

  captureOrder(orderId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/capture-order/${orderId}`, {});
  }

  getOrderDetails(orderId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/order/${orderId}`);
  }

  convertTndToUsd(amountTnd: number): number { return Math.round(amountTnd * 0.32 * 100) / 100; }
  convertUsdToTnd(amountUsd: number): number { return Math.round(amountUsd * 3.12 * 100) / 100; }
}
