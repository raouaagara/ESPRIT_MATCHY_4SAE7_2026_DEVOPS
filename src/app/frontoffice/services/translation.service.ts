import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContentTranslation, Language } from '../models/translation.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private apiUrl = `${environment.apiUrl}/Translation`;

  private languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  constructor(private http: HttpClient) {}

  translateContent(contentId: number, targetLanguage: string): Observable<ContentTranslation> {
    return this.http.post<ContentTranslation>(
      `${this.apiUrl}/translate/${contentId}/${targetLanguage}`,
      {}
    );
  }

  getTranslation(contentId: number, languageCode: string): Observable<ContentTranslation> {
    return this.http.get<ContentTranslation>(`${this.apiUrl}/${contentId}/${languageCode}`);
  }

  getAllTranslations(contentId: number): Observable<ContentTranslation[]> {
    return this.http.get<ContentTranslation[]>(`${this.apiUrl}/all/${contentId}`);
  }

  getSupportedLanguages(): Language[] {
    return this.languages;
  }

  getLanguageName(code: string): string {
    const lang = this.languages.find(l => l.code === code);
    return lang ? lang.name : code;
  }

  getLanguageFlag(code: string): string {
    const lang = this.languages.find(l => l.code === code);
    return lang ? lang.flag : '🌐';
  }
}