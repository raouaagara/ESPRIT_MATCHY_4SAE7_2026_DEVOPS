import { Component, EventEmitter, Output } from '@angular/core';
import { EvenementService } from '../../../core/services/evenement.service';
import { EvenementCreateDTO, EvenementType } from '../../../core/models/evenement.model';

@Component({
  selector: 'app-create-event-modal',
  templateUrl: './create-event-modal.component.html',
  styleUrls: ['./create-event-modal.component.scss']
})
export class CreateEventModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() eventCreated = new EventEmitter<void>();

  isOpen = false;
  loading = false;
  errorMessage = '';

  // Form data
  formData: EvenementCreateDTO = {
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'CERTIFICATION' as EvenementType,
    maxParticipants: 100
  };

  eventTypes = [
    { value: 'CERTIFICATION', label: 'Certification' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'NETWORKING', label: 'Networking' },
    { value: 'FREELANCE_OPPORTUNITY', label: 'Freelance Opportunity' },
    { value: 'RECOMMENDATION', label: 'Recommendation' }
  ];

  constructor(private evenementService: EvenementService) {}

  open(): void {
    this.isOpen = true;
    this.resetForm();
  }

  closeModal(): void {
    this.isOpen = false;
    this.close.emit();
  }

  resetForm(): void {
    this.formData = {
      title: '',
      description: '',
      date: '',
      location: '',
      type: 'CERTIFICATION' as EvenementType,
      maxParticipants: 100
    };
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Convert date string to ISO datetime format for backend (set time to noon to avoid timezone issues)
    const eventData = {
      ...this.formData,
      date: this.formData.date ? `${this.formData.date}T12:00:00` : ''
    };

    console.log('Submitting event data:', eventData);

    this.evenementService.createEvenement(eventData).subscribe({
      next: (response) => {
        console.log('Event created successfully:', response);
        this.loading = false;
        this.eventCreated.emit();
        this.closeModal();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating event:', error);
        console.error('Error details:', error.error);
        
        // Show more specific error message
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
        } else if (error.status === 400) {
          // Try to extract validation error message
          if (error.error && typeof error.error === 'object') {
            const errorMsg = error.error.message || error.error.error || JSON.stringify(error.error);
            this.errorMessage = `Invalid data: ${errorMsg}`;
          } else {
            this.errorMessage = error.error?.message || 'Invalid data. Please check all fields.';
          }
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Failed to create event. Please try again.';
        }
      }
    });
  }

  validateForm(): boolean {
    if (!this.formData.title || this.formData.title.trim().length === 0) {
      this.errorMessage = 'Title is required';
      return false;
    }
    if (!this.formData.description || this.formData.description.trim().length === 0) {
      this.errorMessage = 'Description is required';
      return false;
    }
    if (!this.formData.date) {
      this.errorMessage = 'Date is required';
      return false;
    }
    if (!this.formData.location || this.formData.location.trim().length === 0) {
      this.errorMessage = 'Location is required';
      return false;
    }
    if (!this.formData.maxParticipants || this.formData.maxParticipants < 1) {
      this.errorMessage = 'Max participants must be at least 1';
      return false;
    }
    return true;
  }
}
