import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';

export interface EventLocation {
  id: number;
  title: string;
  location: string;
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
}

@Component({
  selector: 'app-location-map',
  templateUrl: './location-map.component.html',
  styleUrls: ['./location-map.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationMapComponent {
  @Input() events: EventLocation[] = [];
  @Output() closed = new EventEmitter<void>();

  isVisible = false;
  selectedEvent: EventLocation | null = null;

  show(event?: EventLocation): void {
    this.isVisible = true;
    if (event) {
      this.selectedEvent = event;
    }
  }

  hide(): void {
    this.isVisible = false;
    this.selectedEvent = null;
    this.closed.emit();
  }

  getMapUrl(event: EventLocation): string {
    if (event.latitude && event.longitude) {
      // Google Maps embed URL with marker
      return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${event.latitude},${event.longitude}&zoom=15`;
    } else {
      // Fallback: search by location name
      const query = encodeURIComponent(event.location);
      return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${query}&zoom=15`;
    }
  }

  // For demo purposes, we'll use OpenStreetMap (no API key needed)
  getOpenStreetMapUrl(event: EventLocation): string {
    if (event.latitude && event.longitude) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.01},${event.latitude - 0.01},${event.longitude + 0.01},${event.latitude + 0.01}&layer=mapnik&marker=${event.latitude},${event.longitude}`;
    }
    return '';
  }

  openInGoogleMaps(event: EventLocation): void {
    if (event.latitude && event.longitude) {
      window.open(`https://www.google.com/maps?q=${event.latitude},${event.longitude}`, '_blank');
    } else {
      const query = encodeURIComponent(event.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  }

  get offlineEvents(): EventLocation[] {
    return this.events.filter(e => !e.isOnline);
  }

  get onlineEvents(): EventLocation[] {
    return this.events.filter(e => e.isOnline);
  }
}
