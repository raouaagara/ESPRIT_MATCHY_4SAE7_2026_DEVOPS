import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../_env/environment';
import {
  CompletenessResult,
  ReactivityResult,
  OverloadResult,
  MarketStat,
  AvailabilityResult
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class FreelancerStatsService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCompleteness(userId: string | number): Observable<CompletenessResult> {
    return this.http.get<CompletenessResult>(`${this.api}/profiles/${userId}/completeness`);
  }

  getReactivity(userId: string | number): Observable<ReactivityResult> {
    return this.http.get<ReactivityResult>(`${this.api}/freelancers/${userId}/reactivity`);
  }

  getOverload(userId: string | number): Observable<OverloadResult> {
    return this.http.get<OverloadResult>(`${this.api}/freelancers/${userId}/overload`);
  }

  getAvailability(userId: string | number): Observable<AvailabilityResult> {
    return this.http.get<AvailabilityResult>(`${this.api}/availability/${userId}`);
  }

  getMarketHeatmap(): Observable<MarketStat[]> {
    return this.http.get<MarketStat[]>(`${this.api}/market/heatmap`);
  }
}
