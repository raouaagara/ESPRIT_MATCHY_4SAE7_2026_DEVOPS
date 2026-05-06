import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardStats, KpiDataPoint, User, Project } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  constructor(private readonly http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      users:    this.http.get<any[]>(`${environment.apiUrl}/users`).pipe(catchError(() => of([]))),
      projects: this.http.get<any[]>(`${environment.apiUrl}/projects`).pipe(catchError(() => of([])))
    }).pipe(
      map(({ users, projects }) => {
        const totalUsers       = users.length;
        const totalClients     = users.filter((u: any) => (u.role || '').toUpperCase() === 'CLIENT').length;
        const totalFreelancers = users.filter((u: any) => (u.role || '').toUpperCase() === 'FREELANCER').length;
        const verifiedFreelancers = users.filter((u: any) =>
          (u.role || '').toUpperCase() === 'FREELANCER' && u.verified
        ).length;
        const openProjects      = projects.filter((p: any) => (p.status || '').toLowerCase() === 'open').length;
        const completedProjects = projects.filter((p: any) => (p.status || '').toLowerCase() === 'closed').length;
        const totalProjects     = projects.length;
        const verificationRate  = totalFreelancers > 0
          ? Math.round((verifiedFreelancers / totalFreelancers) * 100)
          : 0;
        return {
          totalUsers, totalClients, totalFreelancers,
          verifiedFreelancers, openProjects, completedProjects,
          totalProjects, verificationRate
        };
      }),
      catchError(() => of({
        totalUsers: 0, totalClients: 0, totalFreelancers: 0,
        verifiedFreelancers: 0, openProjects: 0, completedProjects: 0,
        totalProjects: 0, verificationRate: 0
      }))
    );
  }

  getKpiData(): Observable<KpiDataPoint[]> {
    return this.getStats().pipe(
      map(s => [
        { label: 'Users',       value: s.totalUsers },
        { label: 'Clients',     value: s.totalClients },
        { label: 'Freelancers', value: s.totalFreelancers },
        { label: 'Verified',    value: s.verifiedFreelancers },
        { label: 'Open',        value: s.openProjects },
        { label: 'Completed',   value: s.completedProjects }
      ])
    );
  }

  getRecentUsers(): Observable<User[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users`).pipe(
      map(rows => rows.slice(0, 10).map((u: any): User => ({
        id:        u.id,
        name:      u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email:     u.email,
        role:      (u.role || 'freelancer').toLowerCase(),
        status:    (u.status || 'active').toLowerCase(),
        verified:  !!u.verified,
        avatar:    u.avatar || undefined,
        rating:    u.rating ?? undefined,
        projects:  u.projects ?? 0,
        city:      u.location || undefined,
        badge:     undefined,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
      }))),
      catchError(() => of([] as User[]))
    );
  }

  getTopFreelancers(): Observable<User[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users`).pipe(
      map(rows => rows
        .filter((u: any) => (u.role || '').toUpperCase() === 'FREELANCER')
        .slice(0, 10)
        .map((u: any): User => ({
          id:        u.id,
          name:      u.name || u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email:     u.email,
          role:      'freelancer',
          status:    (u.status || 'active').toLowerCase(),
          verified:  !!u.verified,
          avatar:    u.avatar || undefined,
          rating:    u.rating ?? undefined,
          projects:  u.projects ?? 0,
          city:      u.location || undefined,
          badge:     u.verified ? '✓ Verified' : undefined,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
        }))
      ),
      catchError(() => of([] as User[]))
    );
  }
}
