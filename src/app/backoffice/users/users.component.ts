import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../frontoffice/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  selectedRole: string = 'all';
  selectedStatus: string = 'all';
  isLoading = false;
  errorMessage = '';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: (rows) => {
        this.users = (rows || []).map(r => this.toUser(r));
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[BO users] failed to load', err);
        this.errorMessage = 'Failed to load users.';
        this.users = [];
        this.filteredUsers = [];
        this.isLoading = false;
      }
    });
  }

  private toUser(r: any): User {
    const allowedRole = ['admin', 'client', 'freelancer'] as const;
    const role = (allowedRole as readonly string[]).includes(String(r.role).toLowerCase())
      ? (String(r.role).toLowerCase() as User['role'])
      : 'client';
    const allowedStatus = ['active', 'inactive', 'banned'] as const;
    const rawStatus = String(r.status || 'active').toLowerCase();
    const status = (allowedStatus as readonly string[]).includes(rawStatus)
      ? (rawStatus as User['status'])
      : (rawStatus === 'suspended' ? 'banned' : 'active');
    return {
      id: r.id,
      name: r.name || r.fullName || r.email,
      email: r.email,
      role,
      avatar: r.avatar || undefined,
      rating: r.rating ? Number(r.rating) : undefined,
      status,
      verified: !!r.verified,
      city: r.location || r.city || undefined,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
    };
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u => {
      const matchSearch = !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const matchRole = this.selectedRole === 'all' || u.role === this.selectedRole;
      const matchStatus = this.selectedStatus === 'all' || u.status === this.selectedStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  deleteUser(id: number | undefined): void {
    if (!id || !confirm('Delete this user?')) return;
    this.http.delete(`${environment.apiUrl}/users/${id}`).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        this.onSearch();
      },
      error: (err) => {
        console.error('[BO users] delete failed', err);
        alert('Failed to delete user.');
      }
    });
  }
}
