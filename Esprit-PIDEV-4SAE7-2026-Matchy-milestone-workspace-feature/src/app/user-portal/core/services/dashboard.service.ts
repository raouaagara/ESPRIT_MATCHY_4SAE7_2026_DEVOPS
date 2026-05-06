import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../_env/environment';
import { DashboardStats, User } from '../models/models';
import { UserService } from './user.service';
import { ProjectService } from './project.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private http: HttpClient,
    private userService: UserService,
    private projectService: ProjectService
  ) {}

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      userStats: this.userService.getDashboardStats(),
      projectStats: this.projectService.getStats()
    }).pipe(
      map(({ userStats, projectStats }) => ({
        totalUsers: userStats.totalUsers || 0,
        totalClients: userStats.totalClients || 0,
        totalFreelancers: userStats.totalFreelancers || 0,
        totalAdmins: userStats.totalAdmins || 0,
        activeUsers: userStats.activeUsers || 0,
        verifiedFreelancers: userStats.verifiedFreelancers || 0,
        openProjects: projectStats.open || 0,
        completedProjects: projectStats.completed || 0,
        totalProjects: projectStats.total || 0,
        verificationRate: userStats.totalFreelancers > 0
          ? Math.round((userStats.verifiedFreelancers / userStats.totalFreelancers) * 100)
          : 0
      }))
    );
  }

  getRecentUsers(): Observable<User[]> {
    return this.userService.getAll();
  }

  getTopFreelancers(): Observable<User[]> {
    return this.userService.getByRole('FREELANCER').pipe(
      map(users => users
        .filter(u => u.rating != null)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10)
        .map(u => ({ ...u, badge: (u.rating || 0) >= 4.5 ? '⭐ Top Rated' : undefined }))
      )
    );
  }
}
