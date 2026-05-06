import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Registration, RegistrationCreate, RegistrationStatus } from '../models/registration.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private apiUrl = `${environment.apiUrl}/registrations`;

  constructor(private http: HttpClient) {}

  createRegistration(registration: RegistrationCreate): Observable<Registration> {
    return this.http.post<Registration>(this.apiUrl, registration);
  }

  getRegistrationById(id: number): Observable<Registration> {
    return this.http.get<Registration>(`${this.apiUrl}/${id}`);
  }

  getAllRegistrations(): Observable<Registration[]> {
    return this.http.get<Registration[]>(this.apiUrl);
  }

  getRegistrationsByEvenement(evenementId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/evenement/${evenementId}`);
  }

  getRegistrationsByUser(userId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/user/${userId}`);
  }

  getRegistrationsByStatus(status: RegistrationStatus): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/status/${status}`);
  }

  approveRegistration(id: number): Observable<Registration> {
    return this.http.put<Registration>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectRegistration(id: number): Observable<Registration> {
    return this.http.put<Registration>(`${this.apiUrl}/${id}/reject`, {});
  }

  deleteRegistration(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getApprovedCount(evenementId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/evenement/${evenementId}/approved-count`);
  }
}
