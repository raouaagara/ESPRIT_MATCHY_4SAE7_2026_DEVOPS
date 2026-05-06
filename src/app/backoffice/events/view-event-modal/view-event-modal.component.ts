import { Component } from '@angular/core';

@Component({
  selector: 'app-view-event-modal',
  templateUrl: './view-event-modal.component.html',
  styleUrls: ['./view-event-modal.component.scss']
})
export class ViewEventModalComponent {
  isOpen = false;
  event: any = null;

  open(event: any): void {
    this.event = event;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    this.event = null;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
