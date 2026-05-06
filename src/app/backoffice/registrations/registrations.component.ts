import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RegistrationService } from '../../core/services/registration.service';
import { Registration, RegistrationStatus } from '../../core/models/registration.model';

@Component({
  selector: 'app-registrations',
  templateUrl: './registrations.component.html',
  styleUrls: ['./registrations.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RegistrationsComponent implements OnInit {
  registrations: Registration[] = [];
  filteredRegistrations: Registration[] = [];
  currentFilter: string = 'ALL';

  allCount = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  constructor(private registrationService: RegistrationService) {}

  ngOnInit(): void {
    this.loadRegistrations();
  }

  loadRegistrations(): void {
    this.registrationService.getAllRegistrations().subscribe({
      next: (data) => {
        this.registrations = data;
        this.updateCounts();
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
      }
    });
  }

  updateCounts(): void {
    this.allCount = this.registrations.length;
    this.pendingCount = this.registrations.filter(r => r.status === RegistrationStatus.PENDING).length;
    this.approvedCount = this.registrations.filter(r => r.status === RegistrationStatus.APPROVED).length;
    this.rejectedCount = this.registrations.filter(r => r.status === RegistrationStatus.REJECTED).length;
  }

  filterByStatus(status: string): void {
    this.currentFilter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.currentFilter === 'ALL') {
      this.filteredRegistrations = [...this.registrations];
    } else {
      this.filteredRegistrations = this.registrations.filter(r => r.status === this.currentFilter);
    }
  }

  approveRegistration(id: number): void {
    if (!confirm('Approve this registration? The participant counter will be updated.')) { return; }
    this.registrationService.approveRegistration(id).subscribe({
      next: () => this.loadRegistrations(),
      error: (error) => alert(error.error?.message || 'Failed to approve registration')
    });
  }

  rejectRegistration(id: number): void {
    if (!confirm('Reject this registration?')) { return; }
    this.registrationService.rejectRegistration(id).subscribe({
      next: () => this.loadRegistrations(),
      error: (error) => alert(error.error?.message || 'Failed to reject registration')
    });
  }

  deleteRegistration(id: number): void {
    if (!confirm('Delete this registration? This action cannot be undone.')) { return; }
    this.registrationService.deleteRegistration(id).subscribe({
      next: () => this.loadRegistrations(),
      error: () => alert('Failed to delete registration')
    });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}
