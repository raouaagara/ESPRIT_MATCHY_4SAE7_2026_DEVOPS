import { SubscriptionService } from '../services/subscription.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionAbonnementComponent } from './subscription-abonnement.component';

describe('SubscriptionAbonnementComponent', () => {
  let component: SubscriptionAbonnementComponent;
  let fixture: ComponentFixture<SubscriptionAbonnementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [SubscriptionAbonnementComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: SubscriptionService,
          useValue: {
            getCurrentPlan: () => ({ id: 'pro', price: 29, color: 'red', name: 'Pro' }),
            getPlans: () => [{ id: 'pro', price: 29, color: 'red', name: 'Pro' }],
            buildSubscription: () => ({ plan: { id: 'pro', price: 29, color: 'red', name: 'Pro' }, priceAtPurchase: 29 }),
            listSubscriptions: () => ({ subscribe: () => {} })
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionAbonnementComponent);
    component = fixture.componentInstance;
    component.plan = { id: 'pro', price: 29, color: 'red', name: 'Pro' } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
