import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface StatCard { value: string; label: string; }
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
  selector: 'app-alt-home',
  templateUrl: './alt-home.component.html',
  styleUrls: ['./alt-home.component.scss']
})
export class AltHomeComponent implements OnInit {

  stats: StatCard[] = [
    { value: '500+', label: 'Freelancers' },
    { value: '1200+', label: 'Projects' },
    { value: '98%', label: 'Satisfaction' }
  ];

  projectCards: ProjectCard[] = [
    { icon: '📦', iconBg: '#f59e0b', label: 'New project',         title: 'E-commerce mobile app',  sub: 'Budget: 2500 TND' },
    { icon: '✅', iconBg: '#22c55e', label: 'Project delivered!',  title: 'Restaurant website',      sub: '', stars: 5 },
    { icon: '🚀', iconBg: '#a855f7', label: '12 applications',     title: '',                        sub: 'Awaiting your review' }
  ];

  constructor(private router: Router, public authService: AuthService) {}

  ngOnInit(): void {}

  getStarted(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/register']);
    }
  }

  getStarsArray(n: number): number[] {
    return Array(n).fill(0);
  }
}
