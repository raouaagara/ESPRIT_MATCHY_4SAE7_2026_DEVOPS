import { Component, OnInit } from '@angular/core';
import { EvenementService } from '../../core/services/evenement.service';
import { Evenement } from '../../core/models/evenement.model';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'webinar' | 'workshop' | 'meetup' | 'conference' | 'certification' | 'training' | 'networking' | 'freelance';
  icon: string;
  color: string;
  attendees: number;
  maxAttendees: number;
  isFeatured: boolean;
  isOnline: boolean;
}

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  activeFilter = 'all';
  filters = ['all', 'certification', 'workshop', 'training', 'networking', 'freelance'];
  events: Event[] = [];
  loading = true;

  // Registration modal
  showRegistrationModal = false;
  selectedEventId = 0;
  selectedEventTitle = '';

  constructor(private evenementService: EvenementService) {}

  get filteredEvents(): Event[] {
    return this.events.filter(e => this.activeFilter === 'all' || e.type === this.activeFilter);
  }

  get featuredEvent(): Event | undefined {
    return this.events.find(e => e.isFeatured);
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.evenementService.getAllEvenements().subscribe({
      next: (data: Evenement[]) => {
        this.events = data.map((e, index) => this.mapToEvent(e, index));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      }
    });
  }

  mapToEvent(evenement: Evenement, index: number): Event {
    const eventDate = new Date(evenement.date);
    const typeMap: any = {
      'CERTIFICATION': { type: 'certification', icon: '🎓', color: '#f59e0b' },
      'WORKSHOP': { type: 'workshop', icon: '🎨', color: '#a855f7' },
      'TRAINING': { type: 'training', icon: '📚', color: '#06b6d4' },
      'NETWORKING': { type: 'networking', icon: '☕', color: '#22c55e' },
      'FREELANCE_OPPORTUNITY': { type: 'freelance', icon: '💼', color: '#4f6ef7' },
      'RECOMMENDATION': { type: 'webinar', icon: '⭐', color: '#ec4899' }
    };

    const mapped = typeMap[evenement.type] || { type: 'conference', icon: '📅', color: '#6366f1' };

    return {
      id: evenement.id || 0,
      title: evenement.title,
      description: evenement.description || '',
      date: eventDate.toISOString().split('T')[0],
      time: eventDate.toTimeString().substring(0, 5),
      location: evenement.location || 'Online',
      type: mapped.type,
      icon: mapped.icon,
      color: mapped.color,
      attendees: evenement.currentParticipants || 0,
      maxAttendees: evenement.maxParticipants || 100,
      isFeatured: index === 0,
      isOnline: evenement.location?.toLowerCase().includes('online') || false
    };
  }

  participateInEvent(eventId: number): void {
    this.evenementService.participateInEvenement(eventId).subscribe({
      next: () => {
        this.loadEvents();
      },
      error: (error) => {
        console.error('Error participating in event:', error);
        alert('Failed to register for event');
      }
    });
  }

  openRegistrationModal(event: Event): void {
    this.selectedEventId = event.id;
    this.selectedEventTitle = event.title;
    this.showRegistrationModal = true;
  }

  closeRegistrationModal(): void {
    this.showRegistrationModal = false;
  }

  onRegistrationSuccess(): void {
    this.loadEvents();
  }

  getAttendancePercent(event: Event): number {
    return Math.round((event.attendees / event.maxAttendees) * 100);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}
