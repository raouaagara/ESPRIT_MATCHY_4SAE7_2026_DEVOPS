import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService, ChatMessage } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat-assistant',
  templateUrl: './chat-assistant.component.html',
  styleUrls: ['./chat-assistant.component.scss']
})
export class ChatAssistantComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content: `👋 Hi! I'm **Matchy AI**, your smart event assistant.\n\nI can help you:\n- 🔍 Find events by date or type\n- 📅 Check what's happening today or this week\n- 💼 Answer freelancing questions\n- 📝 Guide you through registration\n\nWhat would you like to know?`,
      timestamp: new Date()
    }
  ];

  userInput = '';
  isLoading = false;
  private shouldScroll = false;

  // Quick suggestion chips
  suggestions = [
    "What events are happening today?",
    "Show me upcoming workshops",
    "Are there any online events?",
    "What certifications are available?",
    "How do I register for an event?"
  ];

  constructor(private chatService: ChatService, private router: Router) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;

    this.chatService.sendMessage(text).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.reply, timestamp: new Date() });
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: '⚠️ Sorry, I couldn\'t connect to the AI service. Please make sure the backend is running and try again.',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.shouldScroll = true;
      }
    });
  }

  useSuggestion(suggestion: string): void {
    this.userInput = suggestion;
    this.sendMessage();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  clearChat(): void {
    this.messages = [this.messages[0]]; // Keep welcome message
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  // Format markdown-like bold text
  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
