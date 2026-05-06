import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FoLayoutComponent } from './layout/fo-layout.component';
import { HomeComponent } from './home/home.component';
import { AltHomeComponent } from './alt-home/alt-home.component';
import { CoursesResourcesComponent } from './courses-resources/courses-resources.component';
import { EventsComponent } from './events/events.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { ProjectsMilestonesComponent } from './projects-milestones/projects-milestones.component';
import { SubscriptionManagementComponent } from './subscription-management/subscription-management.component';
import { SubscriptionAbonnementComponent } from './subscription-abonnement/subscription-abonnement.component';
import { SubscriptionPaymentComponent } from './subscription-payment/subscription-payment.component';
import { MySubscriptionComponent } from './my-subscription/my-subscription.component';
import { AvailableProjectsComponent } from './available-projects/available-projects.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { MyApplicationsComponent } from './my-applications/my-applications.component';
import { AiRecommendationsComponent } from './ai-recommendations/ai-recommendations.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ChatAssistantComponent } from './chat-assistant/chat-assistant.component';
import { ContentListComponent } from './content-list/content-list.component';
import { ContentDetailComponent } from './content-detail/content-detail.component';
import { AssessmentTestComponent } from './assessment-test/assessment-test.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentFailComponent } from './payment-fail/payment-fail.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'alt-home', component: AltHomeComponent },
  {
    path: '',
    component: FoLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'home', redirectTo: '', pathMatch: 'full' },
      { path: 'courses-resources', component: CoursesResourcesComponent },
      { path: 'events', component: EventsComponent },
      { path: 'chat-assistant', component: ChatAssistantComponent },
      { path: 'content-list', component: ContentListComponent },
      { path: 'content/:id', component: ContentDetailComponent },
      { path: 'assessment/:contentId', component: AssessmentTestComponent },
      { path: 'favorites', component: FavoritesComponent },
      { path: 'projects', component: AvailableProjectsComponent },
      { path: 'projects/:id', component: ProjectDetailsComponent },
      { path: 'my-applications', component: MyApplicationsComponent },
      { path: 'ai-recommendations', component: AiRecommendationsComponent },
      { path: 'profile-settings', component: ProfileSettingsComponent },
      { path: 'projects-milestones', component: ProjectsMilestonesComponent },
      { path: 'subscription-management', component: SubscriptionManagementComponent },
      { path: 'my-subscription', component: MySubscriptionComponent },
      { path: 'subscription-abonnement/:planId/:planName', component: SubscriptionAbonnementComponent },
      { path: 'subscription-payment/:subscriptionId', component: SubscriptionPaymentComponent },
      { path: 'payment-success', component: PaymentSuccessComponent },
      { path: 'payment-fail', component: PaymentFailComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrontofficeRoutingModule {}