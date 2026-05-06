import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../_env/environment';

export interface Badge {
  id:          number;
  type:        string;
  title:       string;
  description: string;
  icon:        string;
  awardedAt:   string;
}

@Injectable({ providedIn: 'root' })
export class BadgeService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBadgesForUser(userId: number): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.api}/badges/user/${userId}`);
  }

  getProjectCount(clientId: number): Observable<number> {
    return this.http.get<number>(`${this.api}/projects/count/${clientId}`);
  }

  // ← Seul ajout : recalcule les badges pour les projets déjà existants
  recalculateBadges(clientId: number): Observable<any> {
    return this.http.post(`${this.api}/projects/recalculate-badges/${clientId}`, {});
  }
}