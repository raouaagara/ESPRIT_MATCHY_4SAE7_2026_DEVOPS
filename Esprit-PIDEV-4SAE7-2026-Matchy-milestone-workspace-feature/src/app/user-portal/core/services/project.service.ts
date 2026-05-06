import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../_env/environment';
import { Project } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private api = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getAll(status?: string, clientId?: string | number): Observable<Project[]> {
    let params: any = {};
    if (status)   params['status']   = status;
    if (clientId) params['clientId'] = clientId;
    return this.http.get<Project[]>(this.api, { params });
  }

  getOpen(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.api}/open`);
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.api}/${id}`);
  }

  create(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(this.api, project);
  }

  update(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.api}/${id}`, project);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  updateStatus(id: number, status: string): Observable<Project> {
    return this.http.patch<Project>(`${this.api}/${id}/status`, { status });
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.api}/stats`);
  }

  // ── Freelancer soumet le livrable ─────────────────
  deliver(id: number, deliveryLink: string, deliveryMessage?: string): Observable<Project> {
    return this.http.patch<Project>(`${this.api}/${id}/deliver`, {
      deliveryLink,
      deliveryMessage: deliveryMessage ?? ''
    });
  }

  // ── Client confirme + déclenche le paiement ───────
  completeProject(id: number, clientId: number, proposalId: number): Observable<Project> {
    return this.http.patch<Project>(`${this.api}/${id}/complete`, {
      clientId,
      proposalId
    });
  }

  // ── Client demande une révision ───────────────────
  requestRevision(id: number, revisionMessage: string, clientId: number): Observable<Project> {
    return this.http.patch<Project>(`${this.api}/${id}/revision`, {
      revisionMessage,
      clientId
    });
  }

  // ── Projets livrés en attente de confirmation ─────
  getDelivered(clientId: number): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.api}/delivered`, {
      params: { clientId }
    });
  }
}