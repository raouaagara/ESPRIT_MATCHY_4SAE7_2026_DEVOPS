import { Component, EventEmitter, HostListener, Input, Output, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-success-modal',
  templateUrl: './payment-success-modal.component.html',
  styleUrls: ['./payment-success-modal.component.scss']
})
export class PaymentSuccessModalComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Input() transactionRef = '';
  @Input() plan = '';
  @Input() amount = 0;
  @Input() currency = 'TND';
  @Input() currencySymbol = 'TND';

  @Output() closed = new EventEmitter<void>();
  @Output() downloadInvoicePdf = new EventEmitter<void>();

  private trapHandler?: (e: KeyboardEvent) => void;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly router: Router
  ) {}

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    this.trapHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !this.isOpen) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', this.trapHandler);
  }

  ngOnDestroy(): void {
    if (this.trapHandler) document.removeEventListener('keydown', this.trapHandler);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen) this.onClose(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      setTimeout(() => {
        const btn = this.host.nativeElement.querySelector<HTMLElement>('button.primary');
        btn?.focus();
      });
    }
  }

  onClose(): void { this.closed.emit(); }

  /** Navigate to My Subscription page — no need to emit closed since navigation destroys the parent */
  goDashboard(): void {
    this.router.navigate(['/my-subscription']);
  }

  formatAmount(): string {
    if (this.currency === 'TND') return `${this.amount} ${this.currencySymbol}`;
    return `${this.currencySymbol}${this.amount}`;
  }
}
