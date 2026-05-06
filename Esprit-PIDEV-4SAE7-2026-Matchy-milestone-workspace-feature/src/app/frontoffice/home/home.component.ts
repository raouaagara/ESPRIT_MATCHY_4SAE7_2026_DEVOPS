import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface StatCard {
  value: string;
  label: string;
}

interface ProjectCard {
  icon: string;
  iconBg: string;
  label: string;
  title: string;
  sub: string;
  badge?: string;
  stars?: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  stats: StatCard[] = [
    { value: '500+', label: 'Freelancers' },
    { value: '1200+', label: 'Projects' },
    { value: '98%', label: 'Satisfaction' }
  ];

  projectCards: ProjectCard[] = [
    {
      icon: '📦',
      iconBg: '#f59e0b',
      label: 'New project',
      title: 'E-commerce mobile app',
      sub: 'Budget: 2500 TND'
    },
    {
      icon: '✅',
      iconBg: '#22c55e',
      label: 'Project delivered!',
      title: 'Restaurant website',
      sub: '',
      stars: 5
    },
    {
      icon: '🚀',
      iconBg: '#a855f7',
      label: '12 applications',
      title: '',
      sub: 'Awaiting your review'
    }
  ];

  constructor(private router: Router, public authService: AuthService) {}

  ngOnInit(): void {}

  getStarted(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/subscription-management']);
    } else {
      this.router.navigate(['/register']);
    }
  }

  goToLogin(): void {
    if (this.authService.isAuthenticated) {
      const isAdmin = this.authService.isAdmin;
      this.router.navigate([isAdmin ? '/backoffice/dashboard' : '/']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  explorePortal(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    const role = (this.authService.currentUser?.role || '').toLowerCase();
    if (role === 'freelancer') {
      this.router.navigate(['/portal/freelancer/dashboard']);
    } else if (role === 'client') {
      this.router.navigate(['/portal/client/dashboard']);
    } else {
      // admin or unknown role — default to client view
      this.router.navigate(['/portal/client/dashboard']);
    }
  }

  getStarsArray(n: number): number[] {
    return Array(n).fill(0);
  }
}
