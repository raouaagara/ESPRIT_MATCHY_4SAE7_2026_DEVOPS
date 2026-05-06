import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DashboardStats, KpiDataPoint, User, Project } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  getStats(): Observable<DashboardStats> {
    return of({
      totalUsers: 0,
      totalClients: 0,
      totalFreelancers: 0,
      verifiedFreelancers: 0,
      openProjects: 3,
      completedProjects: 0,
      totalProjects: 5,
      verificationRate: 0
    });
  }

  getKpiData(): Observable<KpiDataPoint[]> {
    return of([
      { label: 'Users', value: 0 },
      { label: 'Clients', value: 0 },
      { label: 'Freelancers', value: 0 },
      { label: 'Verified', value: 0 },
      { label: 'Clients', value: 0 },
      { label: 'Terminal', value: 0 }
    ]);
  }

  getRecentUsers(): Observable<User[]> {
    return of([]);
  }

  getTopFreelancers(): Observable<User[]> {
    return of([]);
  }
}
