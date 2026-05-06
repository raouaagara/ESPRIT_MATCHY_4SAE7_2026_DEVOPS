import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-bo-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class BoProfileSettingsComponent {
  form: FormGroup;
  saved = false;
  settings = { maintenance: false, registration: true, emails: true, verification: true };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['Admin Matchy', Validators.required],
      email: ['admin@matchy.tn', [Validators.required, Validators.email]],
      phone: ['+216 55 000 000'],
      role: ['Super Admin'],
    });
  }

  save(): void {
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }
}
