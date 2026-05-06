import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrationService } from '../../../core/services/registration.service';
import { Registration, RegistrationStatus } from '../../../core/models/registration.model';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NotificationBellComponent implements OnInit {
  isOpen = false;
  pendingRegistrations: Registration[] = [];
  pendingCount = 0;

  constructor(
    private registrationService: RegistrationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingRegistrations();
    // Refresh every 30 seconds
    setInterval(() => {
      this.loadPendingRegistrations();
    }, 30000);
  }

  loadPendingRegistrations(): void {
    this.registrationService.getAllRegistrations().subscribe({
      next: (registrations) => {
        this.pendingRegistrations = registrations
          .filter(r => r.status === RegistrationStatus.PENDING)
          .slice(0, 5); // Show only the latest 5
        this.pendingCount = registrations.filter(r => r.status === RegistrationStatus.PENDING).length;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  goToRegistrations(): void {
    this.closeDropdown();
    this.router.navigate(['/backoffice/registrations']);
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell-container')) {
      this.closeDropdown();
    }
  }
}
