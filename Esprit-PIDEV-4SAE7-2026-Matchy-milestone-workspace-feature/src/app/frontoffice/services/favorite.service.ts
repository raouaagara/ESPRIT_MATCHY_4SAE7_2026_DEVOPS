import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Favorite } from '../models/favorite.model';
import { Content } from '../models/content.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = `${environment.apiUrl}/Favorite`;

  constructor(private http: HttpClient) {}

  /**
   * Ajouter un contenu aux favoris
   */
  addFavorite(userId: string, contentId: number): Observable<Favorite> {
    return this.http.post<Favorite>(`${this.apiUrl}/add/${userId}/${contentId}`, {});
  }

  /**
   * Supprimer un contenu des favoris
   */
  removeFavorite(userId: string, contentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${userId}/${contentId}`);
  }

  /**
   * Vérifier si un contenu est favori
   */
  isFavorite(userId: string, contentId: number): Observable<{ isFavorite: boolean }> {
    return this.http.get<{ isFavorite: boolean }>(`${this.apiUrl}/check/${userId}/${contentId}`);
  }

  /**
   * Récupérer tous les favoris d'un utilisateur
   */
  getUserFavorites(userId: string): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Récupérer les contenus favoris d'un utilisateur
   */
  getUserFavoriteContents(userId: string): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/user/${userId}/contents`);
  }

  /**
   * Compter les favoris d'un utilisateur
   */
  countUserFavorites(userId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/user/${userId}/count`);
  }
}