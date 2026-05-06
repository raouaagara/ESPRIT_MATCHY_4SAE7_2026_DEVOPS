import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegistrationService } from '../../../core/services/registration.service';
import { RegistrationCreate } from '../../../core/models/registration.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registration-modal',
  templateUrl: './registration-modal.component.html',
  styleUrls: ['./registration-modal.component.scss']
})
export class RegistrationModalComponent {
  @Input() evenementId!: number;
  @Input() evenementTitle!: string;
  @Output() close = new EventEmitter<void>();
  @Output() registered = new EventEmitter<void>();

  registrationForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService,
    private auth: AuthService
  ) {
    const user = this.auth.currentUser;
    this.registrationForm = this.fb.group({
      firstName: [user?.name?.split(' ')[0] ?? '', [Validators.required, Validators.minLength(2)]],
      lastName: [user?.name?.split(' ').slice(1).join(' ') ?? '', [Validators.required, Validators.minLength(2)]],
      email: [user?.email ?? '', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      this.errorMessage = 'You must be logged in to register for an event.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registrationData: RegistrationCreate = {
      ...this.registrationForm.value,
      userId: Number(user.id),
      evenementId: this.evenementId
    };

    this.registrationService.createRegistration(registrationData).subscribe({
      next: () => {
        this.successMessage = 'Registration submitted successfully! Waiting for admin approval.';
        this.isSubmitting = false;
        setTimeout(() => {
          this.registered.emit();
          this.onClose();
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to submit registration. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get f() {
    return this.registrationForm.controls;
  }
}
