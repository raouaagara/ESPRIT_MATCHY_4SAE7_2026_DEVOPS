import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FrontofficeRoutingModule } from './frontoffice-routing.module';

// Layout
import { FoLayoutComponent } from './layout/fo-layout.component';
import { FoNavbarComponent } from './layout/fo-navbar/fo-navbar.component';
import { FoFooterComponent } from './layout/fo-footer/fo-footer.component';

// Pages
import { HomeComponent } from './home/home.component';
import { AltHomeComponent } from './alt-home/alt-home.component';
import { CoursesResourcesComponent } from './courses-resources/courses-resources.component';
import { EventsComponent } from './events/events.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { ProjectsMilestonesComponent } from './projects-milestones/projects-milestones.component';
import { SubscriptionManagementComponent } from './subscription-management/subscription-management.component';
import { SubscriptionAbonnementComponent } from './subscription-abonnement/subscription-abonnement.component';
import { SubscriptionPaymentComponent } from './subscription-payment/subscription-payment.component';
import { CurrencySelectorComponent } from './components/currency-selector/currency-selector.component';
import { PaymentSuccessModalComponent } from './components/payment-success-modal/payment-success-modal.component';
import { JobSelectorComponent } from './components/job-selector/job-selector.component';
import { MySubscriptionComponent } from './my-subscription/my-subscription.component';
import { AvailableProjectsComponent } from './available-projects/available-projects.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { MyApplicationsComponent } from './my-applications/my-applications.component';
import { AiRecommendationsComponent } from './ai-recommendations/ai-recommendations.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RegistrationModalComponent } from './events/registration-modal/registration-modal.component';
import { ChatAssistantComponent } from './chat-assistant/chat-assistant.component';

// Content / Assessment / Certification (integrated from teammate's content workspace)
import { ContentListComponent } from './content-list/content-list.component';
import { ContentDetailComponent } from './content-detail/content-detail.component';
import { AssessmentTestComponent } from './assessment-test/assessment-test.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { ContentCardComponent } from './shared/content-card/content-card.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { ModalComponent } from './shared/modal/modal.component';
import { NotificationPanelComponent } from './shared/notification-panel/notification-panel.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentFailComponent } from './payment-fail/payment-fail.component';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    FoLayoutComponent,
    FoNavbarComponent,
    FoFooterComponent,
    HomeComponent,
    AltHomeComponent,
    CoursesResourcesComponent,
    EventsComponent,
    RegistrationModalComponent,
    ProfileSettingsComponent,
    ProjectsMilestonesComponent,
    SubscriptionManagementComponent,
    SubscriptionAbonnementComponent,
    SubscriptionPaymentComponent,
    CurrencySelectorComponent,
    PaymentSuccessModalComponent,
    JobSelectorComponent,
    MySubscriptionComponent,
    AvailableProjectsComponent,
    ProjectDetailsComponent,
    MyApplicationsComponent,
    AiRecommendationsComponent,
    ChatAssistantComponent,
    ContentListComponent,
    ContentDetailComponent,
    AssessmentTestComponent,
    FavoritesComponent,
    ContentCardComponent,
    LoadingSpinnerComponent,
    ModalComponent,
    NotificationPanelComponent,
    PaymentSuccessComponent,
    PaymentFailComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FrontofficeRoutingModule
  ],
  exports: [
    SubscriptionPaymentComponent,
    CurrencySelectorComponent,
    PaymentSuccessModalComponent,
    JobSelectorComponent
  ]
})
export class FrontofficeModule {}
