import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  activeTab = 'profile';
  tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'skills', label: 'Skills', icon: '🎯' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  profileForm!: FormGroup;
  securityForm!: FormGroup;
  saveSuccess = false;

  skills: string[] = ['Angular', 'React', 'UI/UX Design', 'Node.js'];
  newSkill = '';
  selectedJobIds: string[] = ['frontend-dev'];

  notifications = {
    emailProjects: true,
    emailMessages: true,
    emailPayments: true,
    pushProjects: false,
    pushMessages: true,
    pushPayments: false,
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['Admin', Validators.required],
      lastName: ['Matchy', Validators.required],
      email: ['admin@matchy.tn', [Validators.required, Validators.email]],
      phone: ['+216 55 000 000'],
      city: ['Tunis'],
      bio: ['Freelance platform administrator & passionate about connecting Tunisian talent.'],
      website: ['https://matchy.tn'],
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.saveSuccess = true;
      setTimeout(() => this.saveSuccess = false, 3000);
    }
  }

  addSkill(): void {
    const skill = this.newSkill.trim();
    if (skill && !this.skills.includes(skill)) {
      this.skills.push(skill);
      this.newSkill = '';
    }
  }

  removeSkill(skill: string): void {
    this.skills = this.skills.filter(s => s !== skill);
  }

  getInitials(): string {
    const f = this.profileForm.get('firstName')?.value || '';
    const l = this.profileForm.get('lastName')?.value || '';
    return (f[0] || '') + (l[0] || '');
  }
}
