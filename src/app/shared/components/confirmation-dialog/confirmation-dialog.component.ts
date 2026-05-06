import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfirmationDialogComponent {
  @Input() config: ConfirmationConfig = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'OK',
    cancelText: 'Cancel',
    type: 'info',
    icon: '❓'
  };
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isVisible = false;

  show(): void {
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  onConfirm(): void {
    this.confirmed.emit();
    this.hide();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.hide();
  }

  getIcon(): string {
    if (this.config.icon) return this.config.icon;
    
    switch (this.config.type) {
      case 'danger': return '🗑️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return '❓';
    }
  }
}
