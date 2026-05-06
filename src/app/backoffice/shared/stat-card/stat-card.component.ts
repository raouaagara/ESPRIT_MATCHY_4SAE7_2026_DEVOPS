import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() icon = '';
  @Input() iconBg = '#4f6ef7';
  @Input() label = '';
  @Input() subLabel = '';
  @Input() value: number | string = 0;
  @Input() suffix = '';
  @Input() borderColor = '';
}
