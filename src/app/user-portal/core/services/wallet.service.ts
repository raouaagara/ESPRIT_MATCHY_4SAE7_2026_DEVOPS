import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Wallet, Transaction } from '../models/wallet.model';
import { environment } from '../../_env/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  private apiUrl = `${environment.apiUrl}/wallet`;

  constructor(private http: HttpClient) {}

  getWallet(userId: number): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.apiUrl}/${userId}`);
  }

  rechargerWallet(userId: number, montant: number): Observable<Wallet> {
    return this.http.post<Wallet>(`${this.apiUrl}/recharger`, { userId, montant });
  }

  bloquerMontant(clientId: number, projectId: number, montant: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/bloquer`, { clientId, projectId, montant });
  }

  payerFreelancer(clientId: number, freelancerId: number, projectId: number, montant: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/payer`, { clientId, freelancerId, projectId, montant });
  }

  rembourserClient(clientId: number, projectId: number, montant: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/rembourser`, { clientId, projectId, montant });
  }

  getHistoriqueClient(clientId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/historique/client/${clientId}`);
  }

  getHistoriqueFreelancer(freelancerId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/historique/freelancer/${freelancerId}`);
  }

  getHistoriqueProjet(projectId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/historique/projet/${projectId}`);
  }

  getRevenusFreelancer(freelancerId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/revenus/${freelancerId}`);
  }

  getCommissionsAdmin(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/commissions`);
  }

  reconcilier(userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/reconcilier/${userId}`);
  }
}