import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PaymentSuccessModalComponent } from './payment-success-modal.component';

describe('PaymentSuccessModalComponent', () => {
  let component: PaymentSuccessModalComponent;
  let fixture: ComponentFixture<PaymentSuccessModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [PaymentSuccessModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSuccessModalComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    component.transactionRef = 'TXN-2026-ABCDE';
    component.plan = 'Pro';
    component.amount = 29;
    component.currency = 'TND';
    component.currencySymbol = 'TND';
    fixture.detectChanges();
  });

  it('should display transaction reference', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TXN-2026-ABCDE');
  });

  it('should close on ESC key', () => {
    spyOn(component.closed, 'emit');
    component.onEscape();
    expect(component.closed.emit).toHaveBeenCalled();
  });
});
