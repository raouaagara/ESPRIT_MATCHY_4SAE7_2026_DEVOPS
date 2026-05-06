import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../_env/environment';
import { Proposal } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProposalService {
  private api = `${environment.apiUrl}/proposals`;

  constructor(private http: HttpClient) {}

  getAll(projectId?: string | number, freelancerId?: string | number): Observable<Proposal[]> {
    let params: any = {};
    if (projectId) params['projectId'] = projectId;
    if (freelancerId) params['freelancerId'] = freelancerId;
    return this.http.get<Proposal[]>(this.api, { params });
  }

  getById(id: number): Observable<Proposal> {
    return this.http.get<Proposal>(`${this.api}/${id}`);
  }

  create(proposal: Partial<Proposal>): Observable<Proposal> {
    return this.http.post<Proposal>(this.api, proposal);
  }

  updateStatus(id: number, status: string, feedback?: string): Observable<Proposal> {
    return this.http.patch<Proposal>(`${this.api}/${id}/status`, { status, feedback });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.api}/stats`);
  }
}
