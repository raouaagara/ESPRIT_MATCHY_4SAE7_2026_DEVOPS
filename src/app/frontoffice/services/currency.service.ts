import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/** Les prix du catalogue sont exprimés en TND (référence). */
export type CurrencyCode = 'TND' | 'USD' | 'EUR';

const STORAGE_KEY = 'matchy_preferred_currency';

/** Taux fixes : 1 USD = 3.12 TND, 1 EUR = 3.38 TND */
const USD_PER_TND = 1 / 3.12;
const EUR_PER_TND = 1 / 3.38;

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly currencySubject = new BehaviorSubject<CurrencyCode>(this.loadInitial());

  readonly currency$: Observable<CurrencyCode> = this.currencySubject.asObservable();

  getCurrency(): CurrencyCode {
    return this.currencySubject.getValue();
  }

  setCurrency(code: CurrencyCode): void {
    this.currencySubject.next(code);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }

  /** Convertit un montant exprimé en TND vers la devise affichée. */
  convertFromTnd(amountTnd: number): number {
    const c = this.getCurrency();
    if (c === 'TND') {
      return amountTnd;
    }
    if (c === 'USD') {
      return Math.round(amountTnd * USD_PER_TND * 100) / 100;
    }
    return Math.round(amountTnd * EUR_PER_TND * 100) / 100;
  }

  /** Alias demandé par le cahier des charges (montant en TND → devise courante). */
  convertPrice(amountTnd: number): number {
    return this.convertFromTnd(amountTnd);
  }

  getSymbol(): string {
    const m: Record<CurrencyCode, string> = {
      TND: 'TND',
      USD: '$',
      EUR: '€'
    };
    return m[this.getCurrency()];
  }

  formatAmount(amountTnd: number): string {
    const v = this.convertFromTnd(amountTnd);
    const sym = this.getSymbol();
    const c = this.getCurrency();
    if (c === 'TND') {
      return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${sym}`;
    }
    return `${sym}${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private loadInitial(): CurrencyCode {
    if (typeof localStorage === 'undefined') {
      return 'TND';
    }
    const s = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (s === 'TND' || s === 'USD' || s === 'EUR') {
      return s;
    }
    return 'TND';
  }
}
