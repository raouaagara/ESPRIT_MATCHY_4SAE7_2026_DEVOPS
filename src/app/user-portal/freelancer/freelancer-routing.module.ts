import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlLayoutComponent } from './layout/fl-layout.component';
import { FlDashboardComponent } from './dashboard/dashboard.component';
import { FlProjectsComponent } from './projects/projects.component';
import { FlProposalsComponent } from './proposals/proposals.component';
import { FlNotificationsComponent } from './notifications/notifications.component';
import { FlProfileComponent } from './profile/profile.component';
import { FreelancerGuard } from '../core/guards/auth.guard';
import { GamificationComponent } from './gamification/gamification.component';

const routes: Routes = [
  {
    path: '',
    component: FlLayoutComponent,
    canActivate: [FreelancerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: FlDashboardComponent },
      { path: 'projects', component: FlProjectsComponent },
      { path: 'proposals', component: FlProposalsComponent },
      { path: 'notifications', component: FlNotificationsComponent },
      { path: 'profile', component: FlProfileComponent },
      { path: 'badges', component: GamificationComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FreelancerRoutingModule {}
