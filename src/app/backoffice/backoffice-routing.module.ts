import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoLayoutComponent } from './layout/bo-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { ProjectsComponent } from './projects/projects.component';
import { BoLoginComponent } from './layout/bo-login/bo-login.component';
import { BoCoursesResourcesComponent } from './courses-resources/courses-resources.component';
import { BoEventsComponent } from './events/events.component';
import { BoProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { BoProjectsMilestonesComponent } from './projects-milestones/projects-milestones.component';
import { BoSubscriptionManagementComponent } from './subscription-management/subscription-management.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { BoSubscriptionPlanComponent } from './subscription-plan/subscription-plan.component';
import { SubscriptionPlanComparisonComponent } from './subscription-plan/subscription-plan-comparison/subscription-plan-comparison.component';
import { BoSubscriptionPayComponent } from './subscription-pay/subscription-pay.component';
import { BoSubscriptionDashboardComponent } from './subscription-dashboard/subscription-dashboard.component';
import { AdminGuard } from '../core/guards/auth.guard';
import { CompanyProjectsComponent } from './company-projects/company-projects.component';
import { ProjectMilestonesManagerComponent } from './project-milestones-manager/project-milestones-manager.component';
import { ReviewApplicationsComponent } from './review-applications/review-applications.component';
import { BoNotificationsComponent } from './notifications/notifications.component';
import { BoHistoryComponent } from './history/history.component';
import { WorkspaceManagerComponent } from './workspace-manager/workspace-manager.component';
import { RegistrationsComponent } from './registrations/registrations.component';
import { ContentManagementComponent } from './content-management/content-management.component';
import { AssessmentManagementComponent } from './assessment-management/assessment-management.component';
import { CertificationManagementComponent } from './certification-management/certification-management.component';
import { PromoCodesComponent } from './promo-codes/promo-codes.component';

const routes: Routes = [
  {
    path: 'login',
    component: BoLoginComponent
  },
  {
    path: '',
    component: BoLayoutComponent,
    // canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'notifications', component: BoNotificationsComponent },
      { path: 'history', component: BoHistoryComponent },
      { path: 'workspace-manager', component: WorkspaceManagerComponent },
      { path: 'users', component: UsersComponent },
      { path: 'projects', component: ProjectsComponent },
      { path: 'company-projects', component: CompanyProjectsComponent },
      { path: 'company-projects/:projectId/review', component: ReviewApplicationsComponent },
      { path: 'company-projects/:projectId/milestones', component: ProjectMilestonesManagerComponent },
      { path: 'courses-resources', component: BoCoursesResourcesComponent },
      { path: 'events', component: BoEventsComponent },
      { path: 'registrations', component: RegistrationsComponent },
      { path: 'content-management', component: ContentManagementComponent },
      { path: 'assessment-management', component: AssessmentManagementComponent },
      { path: 'certification-management', component: CertificationManagementComponent },
      { path: 'profile-settings', component: BoProfileSettingsComponent },
      { path: 'projects-milestones', component: BoProjectsMilestonesComponent },
      { path: 'subscription-management', component: BoSubscriptionManagementComponent },
      { path: 'user-management', component: UserManagementComponent },
      { path: 'subscription-plan', component: BoSubscriptionPlanComponent },
      { path: 'subscription-plan-comparison', component: SubscriptionPlanComparisonComponent },
      { path: 'subscription-pay', component: BoSubscriptionPayComponent },
      { path: 'subscriptions/dashboard', component: BoSubscriptionDashboardComponent },
      { path: 'promo-codes', component: PromoCodesComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackofficeRoutingModule { }
