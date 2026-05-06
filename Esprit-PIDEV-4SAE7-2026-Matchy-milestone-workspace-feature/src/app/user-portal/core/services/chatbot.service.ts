import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, timeout } from 'rxjs';
import { environment } from '../../_env/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  text: string;
  success: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {

  private readonly API_URL = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  sendMessage(history: ChatMessage[]): Observable<any> {
    return this.http.post<ChatResponse>(this.API_URL, { history }).pipe(
      timeout(10000),
      map(res => {
        const text = String(res?.text ?? '').trim();
        const safeText = text || 'AI assistant returned an empty response. Please try again.';
        // On retourne le même format attendu par chatbot.component.ts
        return {
          content: [{ type: 'text', text: safeText }]
        };
      }),
      catchError(err => {
        console.error('Erreur ChatbotService:', err);
        return of({
          content: [{ type: 'text', text: '🔌 Groq service unavailable right now. Please try again.' }]
        });
      })
    );
  }
}