import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked,
  HostListener
} from '@angular/core';
import { ChatbotService, ChatMessage } from '../../core/services/chatbot.service';
import { AuthService } from '../../core/services/auth.service';

interface UIMessage {
  role:    'user' | 'bot';
  content: string;
  time:    string;
}

interface BadgeToast {
  icon: string;
  name: string;
  desc: string;
}

@Component({
  selector:    'app-client-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls:   ['./chatbot.component.scss']
})
export class ClientChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesRef') private messagesRef!: ElementRef<HTMLDivElement>;
  @ViewChild('inputRef')    private inputRef!:    ElementRef<HTMLTextAreaElement>;

  isOpen      = false;
  isLoading   = false;
  userInput   = '';
  charCount   = 0;
  unreadCount = 0;
  hasOpened   = false;

  badgeToast: BadgeToast | null = null;
  private toastTimer: any;

  messages: UIMessage[] = [];
  private history: ChatMessage[] = [];
  private shouldScroll = false;
  private badgeCheckInterval: any;

  private knownBadges: string[] = [];

  readonly MAX_CHARS = 500;

  readonly allBadgeDefs: any[] = [
    { icon: '🚀', name: 'First Project',  desc: 'Posted your first project',     key: 'FIRST_PROJECT' },
    { icon: '📋', name: 'Active Client',  desc: 'Actively posting projects',      key: 'ACTIVE_CLIENT' },
    { icon: '💪', name: 'Power Client',   desc: 'Completed 5+ projects',          key: 'POWER_CLIENT'  },
    { icon: '🏆', name: 'Mega Client',    desc: 'Completed 10+ projects',         key: 'MEGA_CLIENT'   },
    { icon: '⭐', name: 'Loyal Client',   desc: 'Active for 30+ days',            key: 'LOYAL_CLIENT'  },
    { icon: '⚡', name: 'Speed Poster',   desc: 'Post 3 projects in 1 day',       key: 'SPEED_POSTER'  },
    { icon: '💎', name: 'VIP Client',     desc: 'Spend 5000+ TND',                key: 'VIP_CLIENT'    },
    { icon: '🌟', name: 'Top Reviewer',   desc: 'Leave 10+ reviews',              key: 'TOP_REVIEWER'  },
    { icon: '🤝', name: 'Team Player',    desc: 'Hire 5 different freelancers',   key: 'TEAM_PLAYER'   },
    { icon: '👑', name: 'Legend',         desc: 'Complete 25+ projects',          key: 'LEGEND'        },
  ];

  readonly suggestions = [
    { icon: '📋', text: 'How to post a project?' },
    { icon: '💰', text: 'How to set my budget?' },
    { icon: '🔍', text: 'How to find a freelancer?' },
    { icon: '⭐', text: 'How to leave a review?' }
  ];

  readonly quickStarts = [
    { icon: '📝', text: 'Post a new project' },
    { icon: '🤝', text: 'How to hire a freelancer?' },
    { icon: '💳', text: 'Payment methods' },
    { icon: '📊', text: 'Track my projects' }
  ];

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadInitialBadges();
    // Check for new badges every 30 seconds
    this.badgeCheckInterval = setInterval(() => this.checkNewBadges(), 30000);
  }

  ngOnDestroy() {
    if (this.badgeCheckInterval) clearInterval(this.badgeCheckInterval);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private loadInitialBadges() {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;
    fetch(`http://localhost:8081/api/badges/user/${userId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        this.knownBadges = data.map((b: any) => b.badgeType ?? b.key ?? b.name);
      })
      .catch(() => {});
  }

  private checkNewBadges() {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;
    fetch(`http://localhost:8081/api/badges/user/${userId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const currentKeys = data.map((b: any) => b.badgeType ?? b.key ?? b.name);
        const newBadges = currentKeys.filter((k: string) => !this.knownBadges.includes(k));

        if (newBadges.length > 0) {
          newBadges.forEach((key: string) => {
            const badgeDef = this.allBadgeDefs.find(b => b.key === key);
            if (badgeDef) {
              this.showBadgeToast(badgeDef);
              this.sendBadgeEmail(badgeDef);
            }
          });
          this.knownBadges = currentKeys;
        }
      })
      .catch(() => {});
  }

  showBadgeToast(badge: any) {
    this.badgeToast = badge;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.dismissToast(), 6000);
  }

  dismissToast() {
    this.badgeToast = null;
  }

  private sendBadgeEmail(badge: any) {
    const userId = this.authService.currentUser?.id;
    const email  = this.authService.currentUser?.email;
    if (!userId || !email) return;
    fetch(`http://localhost:8081/api/badges/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, badgeKey: badge.key, badgeName: badge.name, badgeDesc: badge.desc })
    }).catch(() => {});
  }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.isOpen) this.close(); }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.hasOpened = true;
      this.unreadCount = 0;
      setTimeout(() => this.inputRef?.nativeElement.focus(), 200);
    }
  }

  close() { this.isOpen = false; }

  onInput() {
    this.charCount = this.userInput.length;
    const ta = this.inputRef?.nativeElement;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  sendSuggestion(text: string) {
    this.userInput = text;
    this.send();
  }

  send() {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ role: 'user', content: text, time });
    this.history.push({ role: 'user', content: text });

    this.userInput = '';
    this.charCount = 0;
    this.shouldScroll = true;

    if (this.inputRef?.nativeElement) {
      this.inputRef.nativeElement.style.height = 'auto';
    }

    this.isLoading = true;
    this.chatbotService.sendMessage(this.history).subscribe({
      next: (res: any) => {
        const botText = res?.content?.[0]?.text ?? 'No response.';
        const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.messages.push({ role: 'bot', content: botText, time: botTime });
        this.history.push({ role: 'assistant', content: botText });
        this.isLoading = false;
        this.shouldScroll = true;
        if (!this.isOpen) this.unreadCount++;
      },
      error: () => {
        this.messages.push({ role: 'bot', content: '🔌 Connection error. Please try again.', time: new Date().toLocaleTimeString() });
        this.isLoading = false;
        this.shouldScroll = true;
      }
    });
  }

  formatContent(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private scrollToBottom() {
    const el = this.messagesRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  clearChat() {
    this.messages = [];
    this.history = [];
  }
}