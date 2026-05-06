import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubscriptionService } from './subscription.service';
import { CurrencyService } from './currency.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { SubscriptionPlan, Payment } from '../models/subscription.model';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let http: HttpTestingController;
  let currencyServiceSpy: jasmine.SpyObj<CurrencyService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockPlan: SubscriptionPlan = {
    id: 'pro', name: 'Pro', price: 29, currency: 'TND',
    billingCycle: 'monthly', description: 'Pro plan',
    features: ['Unlimited bids'], isPopular: true, isCurrent: false,
    color: '#10b981', icon: '⚡'
  };

  beforeEach(() => {
    currencyServiceSpy = jasmine.createSpyObj('CurrencyService', [
      'getCurrency', 'convertFromTnd', 'formatAmount'
    ]);
    currencyServiceSpy.getCurrency.and.returnValue('TND');
    currencyServiceSpy.convertFromTnd.and.callFake((v: number) => v);

    authServiceSpy = jasmine.createSpyObj('AuthService', ['checkAuth'], {
      currentUser: { id: 1, name: 'Test User', email: 'test@test.com', role: 'freelancer', status: 'active', verified: true, createdAt: new Date() }
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SubscriptionService,
        { provide: CurrencyService, useValue: currencyServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(SubscriptionService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  // ── CRUD Plans ──────────────────────────────────────

  describe('getPlans()', () => {
    it('should return 3 plans for monthly billing', () => {
      const plans = service.getPlans('monthly');
      expect(plans.length).toBe(3);
      expect(plans.map(p => p.id)).toEqual(['free', 'pro', 'premium']);
    });

    it('should apply 20% discount for yearly billing', () => {
      const monthly = service.getPlans('monthly');
      const yearly  = service.getPlans('yearly');
      const proMonthly = monthly.find(p => p.id === 'pro')!;
      const proYearly  = yearly.find(p => p.id === 'pro')!;
      expect(proYearly.price).toBe(Math.round(proMonthly.price * 12 * 0.80));
    });

    it('should return free plan with price 0', () => {
      const plans = service.getPlans('monthly');
      const free = plans.find(p => p.id === 'free')!;
      expect(free.price).toBe(0);
    });
  });

  describe('buildSubscription()', () => {
    it('should build a monthly subscription with 1 month duration', () => {
      const sub = service.buildSubscription(mockPlan, 'monthly');
      expect(sub.duration).toBe(1);
      expect(sub.status).toBe('PENDING');
      expect(sub.plan).toEqual(mockPlan);
      expect(sub.priceAtPurchase).toBe(29);
    });

    it('should build a yearly subscription with 12 months duration', () => {
      const sub = service.buildSubscription(mockPlan, 'yearly');
      expect(sub.duration).toBe(12);
    });

    it('should set endDate 1 month after startDate for monthly', () => {
      const sub = service.buildSubscription(mockPlan, 'monthly');
      const start = new Date(sub.startDate);
      const end   = new Date(sub.endDate);
      expect(end.getMonth()).toBe((start.getMonth() + 1) % 12);
    });
  });

  describe('buildPayment()', () => {
    it('should build a CARD payment with correct fields', () => {
      const sub = service.buildSubscription(mockPlan, 'monthly');
      const payment = service.buildPayment(sub, {
        method: 'CARD',
        cardNumber: '4111111111111111',
        cardholderName: 'Test User',
        amountOriginalTnd: 29
      });
      expect(payment.method).toBe('CARD');
      expect(payment.status).toBe('PENDING');
      expect(payment.lastFourDigits).toBe('1111');
      expect(payment.amountOriginalTnd).toBe(29);
    });

    it('should extract last 4 digits from card number', () => {
      const sub = service.buildSubscription(mockPlan, 'monthly');
      const payment = service.buildPayment(sub, {
        method: 'CARD',
        cardNumber: '5500005555555559'
      });
      expect(payment.lastFourDigits).toBe('5559');
    });

    it('should set status to PENDING', () => {
      const sub = service.buildSubscription(mockPlan, 'monthly');
      const payment = service.buildPayment(sub, { method: 'PAYPAL' });
      expect(payment.status).toBe('PENDING');
    });
  });

  describe('markPlanAsCurrent()', () => {
    it('should mark the pro plan as current', () => {
      service.markPlanAsCurrent('pro');
      const current = service.getCurrentPlan();
      expect(current.id).toBe('pro');
      expect(current.isCurrent).toBeTrue();
    });

    it('should unmark other plans when marking one as current', () => {
      service.markPlanAsCurrent('pro');
      service.markPlanAsCurrent('premium');
      const plans = service.getPlans('monthly');
      const pro = plans.find(p => p.id === 'pro')!;
      expect(pro.isCurrent).toBeFalse();
    });

    it('should persist to localStorage', () => {
      service.markPlanAsCurrent('pro');
      const stored = localStorage.getItem('matchy_subscription_plans');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      const pro = parsed.find((p: any) => p.id === 'pro');
      expect(pro.isCurrent).toBeTrue();
    });
  });

  describe('processPayment()', () => {
    it('should POST to subscription then payment API and return success', () => {
      const sub = service.buildSubscription(mockPlan, 'monthly');
      const payment: Payment = service.buildPayment(sub, {
        method: 'CARD', amountOriginalTnd: 29, cardholderName: 'Test'
      });

      let result: any;
      service.processPayment(payment, '1', 'TXN-TEST-001').subscribe(r => result = r);

      // First call: POST /subscription
      const subReq = http.expectOne(`${environment.apiUrl}/subscription`);
      expect(subReq.request.method).toBe('POST');
      expect(subReq.request.body.userId).toBe(1);
      subReq.flush({ id: 10, status: 'PENDING' });

      // Second call: POST /payment
      const payReq = http.expectOne(`${environment.apiUrl}/payment`);
      expect(payReq.request.method).toBe('POST');
      expect(payReq.request.body.transactionRef).toBe('TXN-TEST-001');
      expect(payReq.request.body.subscription).toEqual({ id: 10 });
      payReq.flush({ id: 5, transactionRef: 'TXN-TEST-001' });

      expect(result.success).toBeTrue();
      expect(result.transactionRef).toBe('TXN-TEST-001');
    });

    it('should return success:false on HTTP error without throwing', () => {
      const sub = service.buildSubscription(mockPlan, 'monthly');
      const payment = service.buildPayment(sub, { method: 'CARD', amountOriginalTnd: 29 });

      let result: any;
      service.processPayment(payment, '1', 'TXN-ERR').subscribe(r => result = r);

      const req = http.expectOne(`${environment.apiUrl}/subscription`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(result.success).toBeFalse();
      expect(result.transactionRef).toBe('TXN-ERR');
    });

    it('should resolve plan ID from slug "pro" to 2', () => {
      const sub = service.buildSubscription(mockPlan, 'monthly');
      const payment = service.buildPayment(sub, { method: 'CARD', amountOriginalTnd: 29 });

      service.processPayment(payment, '1').subscribe();

      const req = http.expectOne(`${environment.apiUrl}/subscription`);
      expect(req.request.body.plan).toEqual({ id: 2 });
      req.flush({ id: 1 });
      http.expectOne(`${environment.apiUrl}/payment`).flush({ id: 1 });
    });
  });

  describe('listSubscriptions()', () => {
    it('should GET /subscription and return array', () => {
      let result: any[];
      service.listSubscriptions().subscribe(r => result = r);

      const req = http.expectOne(`${environment.apiUrl}/subscription`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, status: 'ACTIVE' }]);

      expect(result!.length).toBe(1);
    });

    it('should return empty array on error', () => {
      let result: any[];
      service.listSubscriptions().subscribe(r => result = r);

      http.expectOne(`${environment.apiUrl}/subscription`).flush(
        'error', { status: 503, statusText: 'Service Unavailable' }
      );

      expect(result!).toEqual([]);
    });
  });
});
