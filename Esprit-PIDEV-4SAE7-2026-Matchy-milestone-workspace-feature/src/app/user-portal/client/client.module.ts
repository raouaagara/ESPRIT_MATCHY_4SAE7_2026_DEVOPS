import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClientRoutingModule } from './client-routing.module';
import { ClLayoutComponent } from './layout/cl-layout.component';
import { ClSidebarComponent } from './layout/cl-sidebar/cl-sidebar.component';
import { ClHeaderComponent } from './layout/cl-header/cl-header.component';
import { ClDashboardComponent } from './dashboard/dashboard.component';
import { ClProjectsComponent } from './projects/projects.component';
import { ClProposalsComponent } from './proposals/proposals.component';
import { NotificationsPageComponent } from './notifications/notifications.component';
import { ClProfileComponent } from './profile/profile.component';
import { PaymentModalComponent } from '../payment-modal.component';
import { ClientChatbotComponent } from './chatbot/chatbot.component';
import { EscrowPaymentComponent } from './projects/escrow-payment/escrow-payment.component';

@NgModule({
  declarations: [
    ClLayoutComponent,
    ClSidebarComponent,
    ClHeaderComponent,
    ClDashboardComponent,
    ClProjectsComponent,
    ClProposalsComponent,
    NotificationsPageComponent,
    ClProfileComponent,
    PaymentModalComponent,
    ClientChatbotComponent,
    EscrowPaymentComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ClientRoutingModule,
  ]
})
export class ClientModule {}
