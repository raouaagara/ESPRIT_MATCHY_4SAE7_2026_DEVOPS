import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked,
  HostListener
} from '@angular/core';
import { ChatbotService, ChatMessage } from '../../core/services/chatbot.service';

interface UIMessage {
  role:    'user' | 'bot';
  content: string;
  time:    string;
}

@Component({
  selector:    'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls:   ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesRef') private messagesRef!: ElementRef<HTMLDivElement>;
  @ViewChild('inputRef')    private inputRef!:    ElementRef<HTMLTextAreaElement>;

  // ── UI State
  isOpen      = false;
  isLoading   = false;
  userInput   = '';
  charCount   = 0;
  unreadCount = 0;
  hasOpened   = false;

  // ── Messages displayed
  messages: UIMessage[] = [];

  // ── API history (multi-turn)
  private history: ChatMessage[] = [];

  private shouldScroll = false;

  readonly MAX_CHARS = 500;

  readonly suggestions = [
    { icon: '📋', text: 'How to submit a proposal?' },
    { icon: '💰', text: 'How to set my rate?' },
    { icon: '⭐', text: 'How to improve my rating?' },
    { icon: '🔔', text: 'Why was my proposal rejected?' },
    { icon: '📈', text: 'Tips to attract more clients' },
    { icon: '🔒', text: 'How to secure my account?' },
  ];

  readonly quickStarts = [
    { icon: '🚀', text: 'Getting started on Matchy' },
    { icon: '💡', text: 'Optimize my profile' },
    { icon: '📊', text: 'Understand my statistics' },
    { icon: '🤝', text: 'Negotiate with a client' },
  ];

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {}

  // ── Toggle chat window
  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      if (!this.hasOpened) {
        this.hasOpened = true;
        setTimeout(() => this.sendWelcome(), 400);
      }
      setTimeout(() => this.inputRef?.nativeElement.focus(), 100);
    }
  }

  close(): void { this.isOpen = false; }

  // ── Welcome message (no API call)
  private sendWelcome(): void {
    this.pushBot(
      `👋 Hello and welcome to **Matchy**!\n\n` +
      `I'm your AI assistant. I can help you with:\n` +
      `- **Submitting and optimizing** your proposals\n` +
      `- **Improving your profile** to attract more clients\n` +
      `- **Understanding the features** of the platform\n` +
      `- **Tips** to succeed as a freelancer\n\n` +
      `What can I do for you today? 🚀`
    );
  }

  // ── Send message
  send(text?: string): void {
    const msg = (text ?? this.userInput).trim();
    if (!msg || this.isLoading || msg.length > this.MAX_CHARS) return;

    this.messages.push({ role: 'user', content: msg, time: this.now() });
    this.shouldScroll = true;
    this.history.push({ role: 'user', content: msg });

    this.userInput = '';
    this.charCount = 0;

    this.isLoading = true;

    this.chatbotService.sendMessage(this.history).subscribe({
      next: (res: any) => {
        const reply: string = res.content?.[0]?.text ?? 'Sorry, I could not respond.';
        this.history.push({ role: 'assistant', content: reply });
        this.pushBot(reply);
        this.isLoading = false;
      },
      error: () => {
        this.pushBot('🔌 Connection error. Please try again in a few moments.');
        this.isLoading = false;
      }
    });
  }

  sendSuggestion(text: string): void { this.send(text); }

  // ── Clear conversation
  clear(): void {
    this.messages = [];
    this.history  = [];
    setTimeout(() => this.sendWelcome(), 200);
  }

  // ── Keyboard handler
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  onInput(): void {
    this.charCount = this.userInput.length;
  }

  // ── Close on Escape
  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen) this.close(); }

  // ── Helpers
  private pushBot(content: string): void {
    this.messages.push({ role: 'bot', content, time: this.now() });
    this.shouldScroll = true;
    if (!this.isOpen) this.unreadCount++;
  }

  private scrollBottom(): void {
    const el = this.messagesRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private now(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatContent(raw: string): string {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }
}