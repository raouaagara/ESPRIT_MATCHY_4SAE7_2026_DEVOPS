import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../frontoffice/services/auth.service';
import { NotificationsService } from '../../../frontoffice/services/notifications.service';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-bo-sidebar',
  templateUrl: './bo-sidebar.component.html',
  styleUrls: ['./bo-sidebar.component.scss']
})
export class BoSidebarComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/backoffice/dashboard' },
    { label: 'Notifications', icon: '🔔', route: '/backoffice/notifications', badge: 0 },
    { label: 'History', icon: '📜', route: '/backoffice/history' },
    { label: 'Workspace Manager', icon: '💼', route: '/backoffice/workspace-manager' },
    { label: 'Users', icon: '👥', route: '/backoffice/users' },
    { label: 'Projects', icon: '📁', route: '/backoffice/projects' },
    { label: 'Company Projects', icon: '🏢', route: '/backoffice/company-projects' },
    { label: 'Courses & Resources', icon: '📚', route: '/backoffice/courses-resources' },
    { label: 'Content', icon: '📖', route: '/backoffice/content-management' },
    { label: 'Assessments', icon: '📝', route: '/backoffice/assessment-management' },
    { label: 'Certifications', icon: '🎓', route: '/backoffice/certification-management' },
    { label: 'Events', icon: '📅', route: '/backoffice/events' },
    { label: 'Registrations', icon: '📝', route: '/backoffice/registrations' },
    { label: 'Profile Settings', icon: '⚙️', route: '/backoffice/profile-settings' },
    { label: 'Milestones', icon: '🎯', route: '/backoffice/projects-milestones' },
    { label: 'Subscriptions', icon: '💳', route: '/backoffice/subscription-management' },
    { label: 'Payments', icon: '💰', route: '/backoffice/subscription-pay' },
    { label: 'Promo Codes', icon: '🎁', route: '/backoffice/promo-codes' },
    { label: 'User Management', icon: '🛡️', route: '/backoffice/user-management' },
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    public authService: AuthService, 
    private router: Router,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated && this.authService.currentUser) {
      this.notificationsService.startPolling(this.authService.currentUser.id, 'company');
      
      const sub = this.notificationsService.unreadCount$.subscribe(count => {
        const notifItem = this.navItems.find(item => item.route === '/backoffice/notifications');
        if (notifItem) {
          notifItem.badge = count;
        }
      });
      this.subscriptions.push(sub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
