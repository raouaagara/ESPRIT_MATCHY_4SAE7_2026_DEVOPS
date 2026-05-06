import { Component, OnInit, ViewChild } from '@angular/core';
import { EvenementService } from '../../core/services/evenement.service';
import { ExportService } from '../../core/services/export.service';
import { EventRefreshService } from '../../core/services/event-refresh.service';
import { Evenement, EvenementType } from '../../core/models/evenement.model';
import { CreateEventModalComponent } from './create-event-modal/create-event-modal.component';
import { ViewEventModalComponent } from './view-event-modal/view-event-modal.component';
import { EditEventModalComponent } from './edit-event-modal/edit-event-modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { EventStatisticsPanelComponent } from '../../shared/components/event-statistics-panel/event-statistics-panel.component';

@Component({
  selector: 'app-bo-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class BoEventsComponent implements OnInit {
  @ViewChild(CreateEventModalComponent, { static: false }) createModal?: CreateEventModalComponent;
  @ViewChild(ViewEventModalComponent, { static: false }) viewModal?: ViewEventModalComponent;
  @ViewChild(EditEventModalComponent, { static: false }) editModal?: EditEventModalComponent;
  @ViewChild(ConfirmModalComponent, { static: false }) confirmModal?: ConfirmModalComponent;
  @ViewChild('statisticsPanel', { static: false }) statisticsPanel?: EventStatisticsPanelComponent;
  
  searchTerm = '';
  selectedType = 'all';
  types = ['all', 'CERTIFICATION', 'WORKSHOP', 'TRAINING', 'NETWORKING', 'FREELANCE_OPPORTUNITY', 'RECOMMENDATION'];
  events: any[] = [];
  loading = true;
  eventToDelete: number | null = null;
  exporting = false;

  // For statistics panel
  selectedEventId: number = 0;
  selectedEventTitle: string = '';
  selectedEventCapacity: number = 0;

  constructor(
    private evenementService: EvenementService,
    private exportService: ExportService,
    private eventRefreshService: EventRefreshService
  ) {}

  get filteredEvents() {
    return this.events.filter(e => {
      const matchType = this.selectedType === 'all' || e.type === this.selectedType;
      const matchSearch = !this.searchTerm || e.title.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.evenementService.getAllEvenements().subscribe({
      next: (data: Evenement[]) => {
        this.events = data.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          type: e.type,
          date: e.date,
          location: e.location || 'Online',
          attendees: e.currentParticipants || 0,
          maxAttendees: e.maxParticipants || 100,
          status: e.status || 'ACTIVE',
          isOnline: e.location?.toLowerCase().includes('online') || false
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      }
    });
  }

  viewEvent(event: any): void {
    if (this.viewModal) {
      this.viewModal.open(event);
    }
  }

  openStatistics(event: any): void {
    this.selectedEventId = event.id;
    this.selectedEventTitle = event.title;
    this.selectedEventCapacity = event.maxAttendees;
    
    if (this.statisticsPanel) {
      this.statisticsPanel.show();
    }
  }

  editEvent(event: any): void {
    if (this.editModal) {
      this.editModal.open(event);
    }
  }

  deleteEvent(id: number): void {
    this.eventToDelete = id;
    if (this.confirmModal) {
      this.confirmModal.open({
        title: 'Delete Event',
        message: 'Are you sure you want to delete this event? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        icon: '🗑️',
        type: 'danger'
      });
    }
  }

  onDeleteConfirmed(): void {
    if (this.eventToDelete !== null) {
      this.evenementService.deleteEvenement(this.eventToDelete).subscribe({
        next: () => {
          this.loadEvents();
          // Notify other components to refresh
          this.eventRefreshService.triggerRefresh();
          this.eventToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          alert('Failed to delete event');
          this.eventToDelete = null;
        }
      });
    }
  }

  onDeleteCancelled(): void {
    this.eventToDelete = null;
  }

  getAttendancePercent(e: any): number {
    return Math.round((e.attendees / e.maxAttendees) * 100);
  }

  createEvent(): void {
    if (this.createModal) {
      this.createModal.open();
    }
  }

  onEventCreated(): void {
    this.loadEvents();
    // Notify other components to refresh
    this.eventRefreshService.triggerRefresh();
  }

  onEventUpdated(): void {
    this.loadEvents();
    // Notify other components to refresh
    this.eventRefreshService.triggerRefresh();
  }

  exportToCSV(): void {
    this.exporting = true;
    setTimeout(() => {
      const dataToExport = this.exportService.formatEventsForExport(this.filteredEvents);
      this.exportService.exportToCSV(dataToExport, 'events-export');
      this.exporting = false;
    }, 300);
  }

  exportToExcel(): void {
    this.exporting = true;
    setTimeout(() => {
      const dataToExport = this.exportService.formatEventsForExport(this.filteredEvents);
      this.exportService.exportToExcel(dataToExport, 'events-export');
      this.exporting = false;
    }, 300);
  }

  exportToPDF(): void {
    this.exporting = true;
    setTimeout(() => {
      const dataToExport = this.exportService.formatEventsForExport(this.filteredEvents);
      this.exportService.exportToPDF(dataToExport, 'events-export');
      this.exporting = false;
    }, 300);
  }
}
