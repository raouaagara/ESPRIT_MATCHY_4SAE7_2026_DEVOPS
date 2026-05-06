import { Component } from '@angular/core';
import { CurrencyCode, CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-currency-selector',
  templateUrl: './currency-selector.component.html',
  styleUrls: ['./currency-selector.component.scss']
})
export class CurrencySelectorComponent {
  readonly options: { code: CurrencyCode; label: string; flag: string }[] = [
    { code: 'TND', label: 'TND', flag: '🇹🇳' },
    { code: 'USD', label: 'USD', flag: '🇺🇸' },
    { code: 'EUR', label: 'EUR', flag: '🇪🇺' }
  ];

  constructor(public currency: CurrencyService) {}

  select(code: CurrencyCode): void {
    this.currency.setCurrency(code);
  }

  isActive(code: CurrencyCode): boolean {
    return this.currency.getCurrency() === code;
  }
}
