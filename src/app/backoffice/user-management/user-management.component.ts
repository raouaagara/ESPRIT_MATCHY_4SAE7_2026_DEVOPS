import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  activeTab = 'all';
  searchTerm = '';
  selectedRole = 'all';
  selectedStatus = 'all';
  showBanModal = false;
  selectedUser: any = null;

  tabs = [
    { id: 'all', label: 'All Users', count: 6 },
    { id: 'freelancers', label: 'Freelancers', count: 3 },
    { id: 'clients', label: 'Clients', count: 2 },
    { id: 'admins', label: 'Admins', count: 1 },
  ];

  users = [
    { id: 1, name: 'Karim Mansouri', email: 'karim@gmail.com', role: 'freelancer', city: 'Tunis', status: 'active', verified: true, rating: 4.9, projects: 12, joined: '2024-10-01', plan: 'pro' },
    { id: 2, name: 'Sara Belhaj', email: 'sara@gmail.com', role: 'freelancer', city: 'Sfax', status: 'active', verified: true, rating: 4.7, projects: 8, joined: '2024-11-15', plan: 'elite' },
    { id: 3, name: 'Ahmed Riahi', email: 'ahmed@gmail.com', role: 'client', city: 'Tunis', status: 'active', verified: false, rating: null, projects: 3, joined: '2025-01-10', plan: 'free' },
    { id: 4, name: 'Yasmine Karoui', email: 'yasmine@gmail.com', role: 'freelancer', city: 'Sousse', status: 'banned', verified: true, rating: 4.2, projects: 5, joined: '2024-09-01', plan: 'pro' },
    { id: 5, name: 'Mohamed Ben Ali', email: 'mba@gmail.com', role: 'client', city: 'Bizerte', status: 'inactive', verified: false, rating: null, projects: 1, joined: '2025-02-01', plan: 'free' },
    { id: 6, name: 'Admin Matchy', email: 'admin@matchy.tn', role: 'admin', city: 'Tunis', status: 'active', verified: true, rating: null, projects: 0, joined: '2024-01-01', plan: 'elite' },
  ];

  get filteredUsers() {
    return this.users.filter(u => {
      const matchTab = this.activeTab === 'all' ||
        (this.activeTab === 'freelancers' && u.role === 'freelancer') ||
        (this.activeTab === 'clients' && u.role === 'client') ||
        (this.activeTab === 'admins' && u.role === 'admin');
      const matchSearch = !this.searchTerm ||
        u.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchRole = this.selectedRole === 'all' || u.role === this.selectedRole;
      const matchStatus = this.selectedStatus === 'all' || u.status === this.selectedStatus;
      return matchTab && matchSearch && matchRole && matchStatus;
    });
  }

  ngOnInit(): void {}

  openBanModal(user: any): void {
    this.selectedUser = user;
    this.showBanModal = true;
  }

  confirmBan(): void {
    if (this.selectedUser) {
      this.selectedUser.status = this.selectedUser.status === 'banned' ? 'active' : 'banned';
    }
    this.showBanModal = false;
    this.selectedUser = null;
  }

  verifyUser(user: any): void {
    user.verified = true;
  }

  getInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getRoleClass(role: string): string {
    return { admin: 'danger', client: 'primary', freelancer: 'success' }[role] || 'primary';
  }

  getPlanClass(plan: string): string {
    return { free: 'muted', pro: 'primary', elite: 'warning' }[plan] || 'primary';
  }
}
