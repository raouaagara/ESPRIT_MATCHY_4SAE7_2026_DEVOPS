import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FreelancerRoutingModule } from './freelancer-routing.module';
import { FlLayoutComponent } from './layout/fl-layout.component';
import { FlNavbarComponent } from './layout/fl-sidebar/fl-sidebar.component';
import { FlHeaderComponent } from './layout/fl-header/fl-header.component';
import { FlDashboardComponent } from './dashboard/dashboard.component';
import { FlProjectsComponent } from './projects/projects.component';
import { FlProposalsComponent } from './proposals/proposals.component';
import { FlNotificationsComponent } from './notifications/notifications.component';
import { FlProfileComponent } from './profile/profile.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { GamificationComponent } from './gamification/gamification.component';

@NgModule({
  declarations: [
    FlLayoutComponent,
    FlNavbarComponent,
    FlHeaderComponent,
    FlDashboardComponent,
    FlProjectsComponent,
    FlProposalsComponent,
    FlNotificationsComponent,
    FlProfileComponent,
    ChatbotComponent,
    GamificationComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    FreelancerRoutingModule,
  ]
})
export class FreelancerModule {}
