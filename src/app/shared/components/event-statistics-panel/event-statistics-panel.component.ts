import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
import { RegistrationService } from '../../../core/services/registration.service';
import { Registration, RegistrationStatus } from '../../../core/models/registration.model';

export interface EventStatistics {
  eventId: number;
  eventTitle: string;
  eventCapacity: number;
  totalRegistrations: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  fillRate: number;
}

@Component({
  selector: 'app-event-statistics-panel',
  templateUrl: './event-statistics-panel.component.html',
  styleUrls: ['./event-statistics-panel.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EventStatisticsPanelComponent implements OnInit {
  @Input() eventId: number = 0;
  @Input() eventTitle: string = '';
  @Input() eventCapacity: number = 0;
  @Output() closed = new EventEmitter<void>();

  isVisible = false;
  isLoading = true;
  statistics: EventStatistics | null = null;

  constructor(private registrationService: RegistrationService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  show(): void {
    this.isVisible = true;
    this.loadStatistics();
  }

  hide(): void {
    this.isVisible = false;
    this.closed.emit();
  }

  loadStatistics(): void {
    this.isLoading = true;
    
    this.registrationService.getAllRegistrations().subscribe({
      next: (registrations) => {
        const eventRegistrations = registrations.filter(r => r.evenementId === this.eventId);
        
        const totalRegistrations = eventRegistrations.length;
        const approvedCount = eventRegistrations.filter(r => r.status === RegistrationStatus.APPROVED).length;
        const pendingCount = eventRegistrations.filter(r => r.status === RegistrationStatus.PENDING).length;
        const rejectedCount = eventRegistrations.filter(r => r.status === RegistrationStatus.REJECTED).length;
        const fillRate = this.eventCapacity > 0 ? (approvedCount / this.eventCapacity) * 100 : 0;

        this.statistics = {
          eventId: this.eventId,
          eventTitle: this.eventTitle,
          eventCapacity: this.eventCapacity,
          totalRegistrations,
          approvedCount,
          pendingCount,
          rejectedCount,
          fillRate: Math.min(fillRate, 100) // Cap at 100%
        };

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoading = false;
      }
    });
  }

  getFillRateColor(): string {
    if (!this.statistics) return '#9370db';
    
    const rate = this.statistics.fillRate;
    if (rate >= 90) return '#ff4757'; // Red - almost full
    if (rate >= 70) return '#ffa502'; // Orange - filling up
    if (rate >= 50) return '#2ed573'; // Green - good
    return '#9370db'; // Purple - low
  }

  getFillRateLabel(): string {
    if (!this.statistics) return 'Low';
    
    const rate = this.statistics.fillRate;
    if (rate >= 90) return 'Almost Full';
    if (rate >= 70) return 'Filling Up';
    if (rate >= 50) return 'Good';
    return 'Low';
  }

  refresh(): void {
    this.loadStatistics();
  }
}
