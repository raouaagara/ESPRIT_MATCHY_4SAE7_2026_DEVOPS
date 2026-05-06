import { Component, EventEmitter, Output } from '@angular/core';
import { EvenementService } from '../../../core/services/evenement.service';
import { EvenementCreateDTO, EvenementType } from '../../../core/models/evenement.model';

@Component({
  selector: 'app-edit-event-modal',
  templateUrl: './edit-event-modal.component.html',
  styleUrls: ['./edit-event-modal.component.scss']
})
export class EditEventModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() eventUpdated = new EventEmitter<void>();

  isOpen = false;
  loading = false;
  errorMessage = '';
  eventId: number = 0;

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

  open(event: any): void {
    this.eventId = event.id;
    
    // Convert date to YYYY-MM-DD format
    const dateObj = new Date(event.date);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    this.formData = {
      title: event.title,
      description: event.description || '',
      date: dateStr,
      location: event.location,
      type: event.type as EvenementType,
      maxParticipants: event.maxAttendees
    };
    
    this.isOpen = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.isOpen = false;
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const eventData = {
      ...this.formData,
      date: this.formData.date ? `${this.formData.date}T12:00:00` : ''
    };

    this.evenementService.updateEvenement(this.eventId, eventData).subscribe({
      next: () => {
        this.loading = false;
        this.eventUpdated.emit();
        this.closeModal();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating event:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server.';
        } else if (error.status === 400) {
          if (error.error && typeof error.error === 'object') {
            const errorMsg = error.error.message || error.error.error || JSON.stringify(error.error);
            this.errorMessage = `Invalid data: ${errorMsg}`;
          } else {
            this.errorMessage = 'Invalid data. Please check all fields.';
          }
        } else if (error.status === 404) {
          this.errorMessage = 'Event not found.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Failed to update event.';
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
