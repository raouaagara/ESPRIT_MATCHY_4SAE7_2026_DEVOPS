import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SubscriptionPaymentComponent } from './subscription-payment.component';
import { SubscriptionService } from '../services/subscription.service';
import { CurrencyService } from '../services/currency.service';
import { AuthService } from '../services/auth.service';
import { PdfService } from '../services/pdf.service';
import { PromoCodeService } from '../services/promo-code.service';
import { CurrencySelectorComponent } from '../components/currency-selector/currency-selector.component';
import { PaymentSuccessModalComponent } from '../components/payment-success-modal/payment-success-modal.component';
import { SubscriptionPlan, Subscription } from '../models/subscription.model';

describe('SubscriptionPaymentComponent', () => {
  let component: SubscriptionPaymentComponent;
  let fixture: ComponentFixture<SubscriptionPaymentComponent>;

  const mockPlan: SubscriptionPlan = {
    id: 'pro',
    name: 'Pro',
    price: 29,
    currency: 'TND',
    billingCycle: 'monthly',
    description: 'Test',
    color: '#10b981',
    icon: '⚡'
  };

  const mockSub: Subscription = {
    plan: mockPlan,
    priceAtPurchase: 29,
    duration: 1,
    startDate: new Date(),
    endDate: new Date(),
    status: 'PENDING'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, HttpClientTestingModule],
      declarations: [
        SubscriptionPaymentComponent,
        CurrencySelectorComponent,
        PaymentSuccessModalComponent
      ],
      providers: [SubscriptionService, CurrencyService, AuthService, PdfService, PromoCodeService]
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionPaymentComponent);
    component = fixture.componentInstance;
    component.plan = mockPlan;
    component.subscription = mockSub;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
