import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PromoCode, PromoCodeService } from '../../frontoffice/services/promo-code.service';

@Component({
  selector: 'app-promo-codes',
  templateUrl: './promo-codes.component.html',
  styleUrls: ['./promo-codes.component.scss']
})
export class PromoCodesComponent implements OnInit {
  promoCodes: PromoCode[] = [];
  isLoading = false;
  showForm = false;
  errorMessage = '';
  successMessage = '';

  form: FormGroup;

  constructor(
    private promoService: PromoCodeService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      notes: [''] // notes is optional — no validators needed
    });
  }

  ngOnInit(): void { this.loadPromoCodes(); }

  loadPromoCodes(): void {
    this.isLoading = true;
    this.promoService.getCodesObservable().subscribe({
      next: (codes) => { this.promoCodes = codes; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load promo codes'; this.isLoading = false; }
    });
  }

  generateCode(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const notes = this.form.get('notes')?.value?.trim() || undefined;
    this.promoService.generateCodeObservable(notes).subscribe({
      next: (newCode) => {
        this.promoCodes.unshift(newCode);
        this.flashSuccess(`✅ Code generated: ${newCode.code}`);
        this.form.reset();
        this.showForm = false;
        this.isLoading = false;
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || err?.message || 'Unknown error';
        this.errorMessage = 'Failed to generate code: ' + msg;
        this.isLoading = false;
      }
    });
  }

  toggleCode(code: PromoCode): void {
    if (!code.id) return;
    const obs = code.active
      ? this.promoService.deactivateCodeObservable(code.id)
      : this.promoService.reactivateCodeObservable(code.id);
    obs.subscribe({
      next: (updated) => {
        const idx = this.promoCodes.findIndex(c => c.id === code.id);
        if (idx !== -1) this.promoCodes[idx] = updated;
        this.flashSuccess(`✅ Code ${updated.active ? 'activated' : 'deactivated'}`);
      },
      error: () => { this.errorMessage = 'Failed to update code'; }
    });
  }

  deleteCode(code: PromoCode): void {
    if (!code.id || !confirm(`Delete code ${code.code}?`)) return;
    this.promoService.deleteCodeObservable(code.id).subscribe({
      next: () => {
        this.promoCodes = this.promoCodes.filter(c => c.id !== code.id);
        this.flashSuccess('✅ Code deleted');
      },
      error: () => { this.errorMessage = 'Failed to delete code'; }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.form.reset();
  }

  getStatusBadge(code: PromoCode): string { return code.active ? '✅ Active' : '❌ Inactive'; }
  getStatusColor(code: PromoCode): string { return code.active ? '#22c55e' : '#ef4444'; }
  formatDate(date?: string): string {
    return date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  }

  private flashSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }
}
