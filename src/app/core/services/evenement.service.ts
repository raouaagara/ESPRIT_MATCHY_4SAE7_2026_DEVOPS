import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evenement, EvenementCreateDTO, EvenementType } from '../models/evenement.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EvenementService {
  private apiUrl = `${environment.apiUrl}/evenements`;

  constructor(private http: HttpClient) {}

  createEvenement(evenement: EvenementCreateDTO): Observable<Evenement> {
    return this.http.post<Evenement>(this.apiUrl, evenement);
  }

  updateEvenement(id: number, evenement: EvenementCreateDTO): Observable<Evenement> {
    return this.http.put<Evenement>(`${this.apiUrl}/${id}`, evenement);
  }

  deleteEvenement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEvenementById(id: number): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.apiUrl}/${id}`);
  }

  getAllEvenements(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(this.apiUrl);
  }

  getEvenementsByType(type: EvenementType): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiUrl}/type/${type}`);
  }

  getUpcomingEvenements(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.apiUrl}/upcoming`);
  }

  participateInEvenement(id: number): Observable<Evenement> {
    return this.http.post<Evenement>(`${this.apiUrl}/${id}/participate`, {});
  }

  cancelParticipation(id: number): Observable<Evenement> {
    return this.http.post<Evenement>(`${this.apiUrl}/${id}/cancel-participation`, {});
  }
}
