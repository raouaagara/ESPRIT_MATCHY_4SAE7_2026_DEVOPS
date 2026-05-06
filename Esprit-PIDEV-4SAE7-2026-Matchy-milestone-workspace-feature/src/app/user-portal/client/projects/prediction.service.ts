// prediction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../_env/environment';

export interface BudgetPrediction {
  min:         number;
  max:         number;
  average:     number;
  median:      number;
  recommended: number;
  confidence:  'HIGH' | 'MEDIUM' | 'LOW' | 'NO_DATA';
  basedOn:     number;
  message:     string;
}

export interface DeadlinePrediction {
  minDays:         number;
  maxDays:         number;
  medianDays:      number;
  recommendedDays: number;
  onTimeRate:      number;
  confidence:      'HIGH' | 'MEDIUM' | 'LOW' | 'NO_DATA';
  basedOn:         number;
  message:         string;
}

export interface CombinedPrediction {
  budget:   BudgetPrediction;
  deadline: DeadlinePrediction;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {

  private api = environment.apiUrl.replace('/projects', '');

  constructor(private http: HttpClient) {}

  // Appel unique — budget + deadline en même temps
  predict(category: string, skills: string[]): Observable<CombinedPrediction> {
    let params = new HttpParams().set('category', category);
    if (skills.length > 0) {
      params = params.set('skills', skills.join(','));
    }
    return this.http.get<CombinedPrediction>(`${this.api}/predictions/all`, { params });
  }

  predictBudget(category: string, skills: string[]): Observable<BudgetPrediction> {
    let params = new HttpParams().set('category', category);
    if (skills.length > 0) params = params.set('skills', skills.join(','));
    return this.http.get<BudgetPrediction>(`${this.api}/predictions/budget`, { params });
  }

  predictDeadline(category: string, skills: string[]): Observable<DeadlinePrediction> {
    let params = new HttpParams().set('category', category);
    if (skills.length > 0) params = params.set('skills', skills.join(','));
    return this.http.get<DeadlinePrediction>(`${this.api}/predictions/deadline`, { params });
  }
}
