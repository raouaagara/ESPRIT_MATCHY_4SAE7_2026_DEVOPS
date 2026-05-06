import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button 
      class="theme-toggle-switch" 
      (click)="toggleTheme()"
      [class.dark]="isDark"
      [attr.aria-label]="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      title="{{ isDark ? 'Light Mode' : 'Dark Mode' }}"
    >
      <span class="toggle-track">
        <span class="toggle-thumb">
          <span class="thumb-icon">{{ isDark ? '🌙' : '☀️' }}</span>
        </span>
      </span>
    </button>
  `,
  styleUrls: ['./theme-toggle.component.scss']
})
export class ThemeToggleComponent implements OnInit {
  isDark = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDark = isDark;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }
}
