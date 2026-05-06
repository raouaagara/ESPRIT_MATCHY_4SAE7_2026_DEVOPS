import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isOpen = false;
  title = 'Confirm Action';
  message = 'Are you sure you want to proceed?';
  confirmText = 'Confirm';
  cancelText = 'Cancel';
  icon = '⚠️';
  type: 'danger' | 'warning' | 'info' = 'warning';

  open(options?: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    type?: 'danger' | 'warning' | 'info';
  }): void {
    if (options) {
      this.title = options.title || this.title;
      this.message = options.message || this.message;
      this.confirmText = options.confirmText || this.confirmText;
      this.cancelText = options.cancelText || this.cancelText;
      this.icon = options.icon || this.icon;
      this.type = options.type || this.type;
    }
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  onConfirm(): void {
    this.confirmed.emit();
    this.close();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.close();
  }
}
