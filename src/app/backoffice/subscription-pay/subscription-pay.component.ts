import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PaymentRecord {
  id: string;
  userId?: string;
  user: string;
  email: string;
  plan: string;
  amount: number;
  currency: string;
  method: 'card' | 'paypal' | 'bank_transfer' | 'mobile';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: string;
  transactionId: string;
  rejectionReason?: string;
}

function mapApiPayment(p: any): PaymentRecord {
  try {
    const method = String(p?.method || 'CARD').toLowerCase();
    const normMethod: PaymentRecord['method'] =
      method === 'paypal' ? 'paypal'
      : method === 'mobile' ? 'mobile'
      : method === 'bank_transfer' ? 'bank_transfer'
      : 'card';

    const status = String(p?.status || 'PENDING').toLowerCase();
    const normStatus: PaymentRecord['status'] =
      status === 'completed' ? 'completed'
      : status === 'failed' ? 'failed'
      : status === 'cancelled' || status === 'refunded' ? 'refunded'
      : 'pending';

    // Resolve user display name from all available fields
    const cardHolder = p?.cardholderName ? String(p.cardholderName).trim() : '';
    const userName   = p?.userName       ? String(p.userName).trim()       : '';
    const userId     = p?.userId         != null ? String(p.userId)        : '';
    const user = userName || cardHolder || (userId ? 'User #' + userId : 'Unknown');

    // Resolve plan name
    const planRaw = p?.subscription?.plan?.name;
    const plan = planRaw
      ? String(planRaw).charAt(0).toUpperCase() + String(planRaw).slice(1).toLowerCase()
      : 'Pro';

    // Safe date
    const rawDate = p?.transactionDate || p?.submittedAt || '';
    const date = rawDate ? String(rawDate).substring(0, 10) : '';

    return {
      id:              'PAY-' + (p?.id ?? '?'),
      userId:          userId || undefined,
      user,
      email:           p?.userEmail ? String(p.userEmail) : '',
      plan,
      amount:          Number(p?.amount) || 0,
      currency:        p?.currency ? String(p.currency) : 'TND',
      method:          normMethod,
      status:          normStatus,
      date,
      transactionId:   p?.transactionRef ? String(p.transactionRef) : ('TXN-' + (p?.id ?? '?')),
      rejectionReason: p?.adminNotes ? String(p.adminNotes) : undefined
    };
  } catch (e) {
    console.error('[mapApiPayment] error mapping payment:', p, e);
    return {
      id: 'PAY-ERR', user: 'Error', email: '', plan: '?',
      amount: 0, currency: 'TND', method: 'card', status: 'pending',
      date: '', transactionId: '?'
    };
  }
}

@Component({
  selector: 'app-bo-subscription-pay',
  templateUrl: './subscription-pay.component.html',
  styleUrls: ['./subscription-pay.component.scss']
})
export class BoSubscriptionPayComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'all';
  selectedMethod = 'all';
  statuses = ['all', 'completed', 'pending', 'failed', 'refunded'];
  methods = ['all', 'card', 'paypal', 'bank_transfer', 'mobile'];

  toastMessage = '';

  payments: PaymentRecord[] = [];

  showDetail = false;
  selectedPayment: PaymentRecord | null = null;

  showRefundModal = false;
  paymentToRefund: PaymentRecord | null = null;

  showRejectModal = false;
  paymentToReject: PaymentRecord | null = null;
  rejectReason = '';

  showAddModal = false;
  newPayment: Partial<PaymentRecord> = this.initNewPayment();

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.http.get<any[]>(`${environment.apiUrl}/payment`).subscribe({
      next: (rows) => {
        console.log('[BO Payments] received', rows?.length, 'rows');
        this.payments = (rows || []).map(mapApiPayment);
        console.log('[BO Payments] mapped', this.payments.length, 'payments');
      },
      error: (err) => {
        console.error('[BO Payments] HTTP error:', err?.status, err?.message, err?.error);
      }
    });
  }

  initNewPayment(): Partial<PaymentRecord> {
    return {
      user: '',
      email: '',
      plan: 'Pro',
      amount: 29,
      currency: 'TND',
      method: 'card',
      status: 'completed'
    };
  }

  get filteredPayments(): PaymentRecord[] {
    return this.payments.filter(p => {
      const matchStatus = this.selectedStatus === 'all' || p.status === this.selectedStatus;
      const matchMethod = this.selectedMethod === 'all' || p.method === this.selectedMethod;
      const matchSearch =
        !this.searchTerm ||
        p.user.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.transactionId.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchStatus && matchMethod && matchSearch;
    });
  }

  get totalRevenue(): number {
    return this.payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  }
  get completedCount(): number { return this.payments.filter(p => p.status === 'completed').length; }
  get pendingCount(): number { return this.payments.filter(p => p.status === 'pending').length; }
  get failedCount(): number { return this.payments.filter(p => p.status === 'failed').length; }

  getStatusClass(status: string): string {
    return ({
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      refunded: 'badge-muted'
    } as Record<string, string>)[status] || 'badge-muted';
  }

  getMethodIcon(method: string): string {
    const m: Record<string, string> = {
      card: '💳', paypal: '🅿️', bank_transfer: '🏦', mobile: '📱'
    };
    return m[method] || '💰';
  }

  viewDetail(payment: PaymentRecord): void {
    this.selectedPayment = payment;
    this.showDetail = true;
  }

  openRefund(payment: PaymentRecord): void {
    this.paymentToRefund = payment;
    this.showRefundModal = true;
  }

  confirmRefund(): void {
    if (this.paymentToRefund) {
      const idx = this.payments.findIndex(p => p.id === this.paymentToRefund!.id);
      if (idx >= 0) {
        this.payments[idx] = { ...this.payments[idx], status: 'refunded' };
      }
      this.showRefundModal = false;
      this.paymentToRefund = null;
    }
  }

  closeModal(): void {
    this.showDetail = false;
    this.showRefundModal = false;
    this.showAddModal = false;
    this.showRejectModal = false;
    this.selectedPayment = null;
    this.paymentToRefund = null;
    this.paymentToReject = null;
  }

  openAddModal(): void {
    this.newPayment = this.initNewPayment();
    this.showAddModal = true;
  }

  savePayment(): void {
    const p: PaymentRecord = {
      id: `PAY-${String(this.payments.length + 1).padStart(3, '0')}`,
      user: this.newPayment.user || 'Unknown User',
      email: this.newPayment.email || 'unknown@example.com',
      plan: this.newPayment.plan || 'Pro',
      amount: this.newPayment.amount || 0,
      currency: this.newPayment.currency || 'TND',
      method: (this.newPayment.method as PaymentRecord['method']) || 'card',
      status: (this.newPayment.status as PaymentRecord['status']) || 'completed',
      date: new Date().toISOString().split('T')[0],
      transactionId: 'TXN-' + Math.random().toString(36).substring(2, 11).toUpperCase()
    };
    this.payments.unshift(p);
    this.closeModal();
  }

  approve(p: PaymentRecord): void {
    const numericId = p.id.replace(/^PAY-/, '');
    const url = `${environment.apiUrl}/payment/${numericId}/approve`;
    this.http.post(url, {}).subscribe({
      next: () => {
        p.status = 'completed';
        this.toast('✅ Payment approved. A confirmation email has been sent.');
      },
      error: () => {
        p.status = 'completed';
        this.toast('✅ Approved locally (backend unreachable).');
      }
    });
  }

  openReject(p: PaymentRecord): void {
    this.paymentToReject = p;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  confirmReject(): void {
    if (!this.paymentToReject) { return; }
    const p = this.paymentToReject;
    const numericId = p.id.replace(/^PAY-/, '');
    const reason = this.rejectReason || 'Non spécifié';
    const url = `${environment.apiUrl}/payment/${numericId}/reject?reason=${encodeURIComponent(reason)}`;
    this.http.post(url, {}).subscribe({
      next: () => {
        p.status = 'failed';
        p.rejectionReason = reason;
        this.toast('❌ Payment rejected — notification email sent.');
        this.showRejectModal = false;
        this.paymentToReject = null;
      },
      error: () => {
        p.status = 'failed';
        p.rejectionReason = reason;
        this.toast('❌ Rejection saved locally (backend unreachable).');
        this.showRejectModal = false;
        this.paymentToReject = null;
      }
    });
  }

  private toast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => (this.toastMessage = ''), 5000);
  }
}
