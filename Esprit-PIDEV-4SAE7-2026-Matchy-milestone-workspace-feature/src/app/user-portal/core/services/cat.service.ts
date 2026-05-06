import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryModel {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private api = 'http://localhost:8080/api/categories';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CategoryModel[]> {
    return this.http.get<CategoryModel[]>(this.api);
  }

  getActive(): Observable<CategoryModel[]> {
    return this.http.get<CategoryModel[]>(`${this.api}?active=true`);
  }

  getById(id: number): Observable<CategoryModel> {
    return this.http.get<CategoryModel>(`${this.api}/${id}`);
  }

  create(category: CategoryModel): Observable<CategoryModel> {
    return this.http.post<CategoryModel>(this.api, category);
  }

  update(id: number, category: CategoryModel): Observable<CategoryModel> {
    return this.http.put<CategoryModel>(`${this.api}/${id}`, category);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  toggleActive(id: number): Observable<CategoryModel> {
    return this.http.patch<CategoryModel>(`${this.api}/${id}/toggle`, {});
  }

  getStats(): Observable<{ total: number; active: number }> {
    return this.http.get<{ total: number; active: number }>(`${this.api}/stats`);
  }
}