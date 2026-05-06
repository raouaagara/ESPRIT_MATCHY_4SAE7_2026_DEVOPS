import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { EvenementService } from '../../../core/services/evenement.service';
import { EventRefreshService } from '../../../core/services/event-refresh.service';
import { LocationMapComponent, EventLocation } from '../location-map/location-map.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-location-icon',
  templateUrl: './location-icon.component.html',
  styleUrls: ['./location-icon.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationIconComponent implements OnInit, OnDestroy {
  @ViewChild('locationMap', { static: false }) locationMap?: LocationMapComponent;
  
  events: EventLocation[] = [];
  offlineEventsCount = 0;
  onlineEventsCount = 0;
  private refreshSubscription?: Subscription;

  constructor(
    private evenementService: EvenementService,
    private eventRefreshService: EventRefreshService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    
    // Subscribe to refresh events
    this.refreshSubscription = this.eventRefreshService.refresh$.subscribe(() => {
      this.loadEvents();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadEvents(): void {
    this.evenementService.getAllEvenements().subscribe({
      next: (data) => {
        this.events = data.map(e => ({
          id: e.id!,
          title: e.title,
          location: e.location || 'Online',
          isOnline: e.location?.toLowerCase().includes('online') || !e.location,
          latitude: undefined, // You can add coordinates to your event model
          longitude: undefined
        }));

        this.offlineEventsCount = this.events.filter(e => !e.isOnline).length;
        this.onlineEventsCount = this.events.filter(e => e.isOnline).length;
      },
      error: (error) => {
        console.error('Error loading events:', error);
      }
    });
  }

  openLocationMap(): void {
    if (this.locationMap) {
      this.locationMap.show();
    }
  }
}
