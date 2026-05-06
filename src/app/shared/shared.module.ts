import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { CustomDatepickerComponent } from './components/custom-datepicker/custom-datepicker.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { LocationMapComponent } from './components/location-map/location-map.component';
import { LocationIconComponent } from './components/location-icon/location-icon.component';
import { SafePipe } from './pipes/safe.pipe';

@NgModule({
  declarations: [
    ThemeToggleComponent,
    CustomDatepickerComponent,
    ConfirmationDialogComponent,
    NotificationBellComponent,
    LocationMapComponent,
    LocationIconComponent,
    SafePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    ThemeToggleComponent,
    CustomDatepickerComponent,
    ConfirmationDialogComponent,
    NotificationBellComponent,
    LocationMapComponent,
    LocationIconComponent,
    SafePipe
  ]
})
export class SharedModule {}
