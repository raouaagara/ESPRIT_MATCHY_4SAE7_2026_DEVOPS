import { TestBed } from '@angular/core/testing';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.removeItem('matchy_preferred_currency');
    service = TestBed.inject(CurrencyService);
  });

  it('should convert TND to USD correctly (1 USD = 3.12 TND)', () => {
    service.setCurrency('USD');
    expect(service.convertFromTnd(3.12)).toBeCloseTo(1, 2);
    expect(service.convertFromTnd(31.2)).toBeCloseTo(10, 2);
  });

  it('should persist currency in localStorage', () => {
    service.setCurrency('EUR');
    expect(localStorage.getItem('matchy_preferred_currency')).toBe('EUR');
  });

  it('should update symbol for currency', () => {
    service.setCurrency('TND');
    expect(service.getSymbol()).toBe('TND');
    service.setCurrency('USD');
    expect(service.getSymbol()).toBe('$');
  });
});
