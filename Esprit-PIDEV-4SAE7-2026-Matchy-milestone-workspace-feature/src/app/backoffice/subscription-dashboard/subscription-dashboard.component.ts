import { Component } from '@angular/core';

@Component({
  selector: 'app-bo-subscription-dashboard',
  templateUrl: './subscription-dashboard.component.html',
  styleUrls: ['./subscription-dashboard.component.scss']
})
export class BoSubscriptionDashboardComponent {
  kpis = [
    { label: 'MRR', value: '12 450 TND', sub: '+8% ce mois', tone: 'v' },
    { label: 'Actifs', value: '234', sub: 'abonnés', tone: 'g' },
    { label: 'En attente', value: '18', sub: 'paiements', tone: 'a' },
    { label: 'Churn', value: '3,2%', sub: 'ce mois', tone: 'r' }
  ];

  mrrSeries = [8, 9, 10, 9.5, 11, 12, 11.2, 12.1, 12.4, 12.45, 12.5, 12.45];
}
