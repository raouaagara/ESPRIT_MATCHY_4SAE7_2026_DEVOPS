import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PromoCode {
  id?: number;
  code: string;
  discountPercent: number;
  active: boolean;
  createdAt?: string;
  usageCount?: number;
  notes?: string;
}

export interface PromoValidationResult {
  valid: boolean;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private readonly API_URL = `${environment.apiUrl}/promocode`;

  constructor(private http: HttpClient) {}

  getCodesObservable(): Observable<PromoCode[]> {
    return this.http.get<PromoCode[]>(this.API_URL).pipe(catchError(() => of([])));
  }

  getActiveCodesObservable(): Observable<PromoCode[]> {
    return this.http.get<PromoCode[]>(`${this.API_URL}/active`).pipe(catchError(() => of([])));
  }

  generateCodeObservable(notes?: string): Observable<PromoCode> {
    const url = notes ? `${this.API_URL}/generate?notes=${encodeURIComponent(notes)}` : `${this.API_URL}/generate`;
    return this.http.post<PromoCode>(url, {});
  }

  createCodeObservable(code: string, discountPercent: number = 10, notes?: string): Observable<PromoCode> {
    return this.http.post<PromoCode>(`${this.API_URL}/create`, {
      code: code.trim().toUpperCase(),
      discountPercent,
      notes: notes || undefined
    });
  }

  deactivateCodeObservable(id: number): Observable<PromoCode> {
    return this.http.post<PromoCode>(`${this.API_URL}/${id}/deactivate`, {});
  }

  reactivateCodeObservable(id: number): Observable<PromoCode> {
    return this.http.post<PromoCode>(`${this.API_URL}/${id}/reactivate`, {});
  }

  deleteCodeObservable(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  validate(code: string, _planId: string, amountTnd: number): Observable<PromoValidationResult> {
    const c = code.trim().toUpperCase();
    if (!c) return of({ valid: false, message: 'Enter a promo code' }).pipe(delay(200));

    return this.http.post<any>(`${this.API_URL}/validate`, null, {
      params: { code: c, amountTnd: amountTnd.toString() }
    }).pipe(
      map((r: any) => r.valid
        ? { valid: true, discountType: 'percent' as const, discountValue: r.discountPercent, message: r.message }
        : { valid: false, message: r.message || 'Invalid code' }),
      catchError((err) => of({
        valid: false,
        message: err?.error?.message || err?.error || 'Invalid or expired promo code'
      }))
    );
  }

  applyDiscount(amountTnd: number, r: PromoValidationResult): number {
    if (!r.valid || r.discountValue == null) return amountTnd;
    if (r.discountType === 'percent') {
      return Math.max(0, Math.round(amountTnd * (1 - r.discountValue / 100) * 100) / 100);
    }
    return Math.max(0, Math.round((amountTnd - r.discountValue) * 100) / 100);
  }
}
