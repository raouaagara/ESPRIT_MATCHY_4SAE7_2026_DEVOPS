import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-cl-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class ClDashboardComponent implements OnInit {

  isLoading = true;
  badges: any[] = [];

  allBadges = [
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

  get mergedBadges() {
    const earnedKeys = this.badges.map((b: any) => b.badgeType ?? b.key ?? b.name);
    // Fallback: unlock based on stats if API returns empty
    return this.allBadges.map(b => {
      let earned = earnedKeys.includes(b.key);
      if (!earned) {
        if (b.key === 'FIRST_PROJECT')  earned = this.stats.total >= 1;
        if (b.key === 'ACTIVE_CLIENT')  earned = this.stats.total >= 3;
        if (b.key === 'POWER_CLIENT')   earned = this.stats.completed >= 5;
        if (b.key === 'MEGA_CLIENT')    earned = this.stats.completed >= 10;
        if (b.key === 'LEGEND')         earned = this.stats.completed >= 25;
      }
      return { ...b, locked: !earned };
    });
  }

  get earnedCount() {
    return this.mergedBadges.filter(b => !b.locked).length;
  }

  stats = {
    total: 0, open: 0, inProgress: 0, completed: 0, unreadNotifs: 0, delivered: 0
  };

  projects: any[] = [];
  deliveredProjects: any[] = [];
  notifications: any[] = [];

  showDeliveryModal = false;
  selectedDelivery: any = null;
  revisionMessage = '';
  showRevisionInput = false;

  showPaymentModal = false;
  paymentStep: 'form' | 'processing' | 'success' = 'form';
  paymentMethod: 'card' | 'flouci' | 'virement' = 'card';
  paymentError = '';

  cardNumber = '';
  cardHolder = '';
  cardExpiry = '';
  cardCvc = '';

  readonly SERVICE_FEE_RATE = 0.05;

  constructor(
    public authService: AuthService,
    private projectService: ProjectService,
    private notifService: NotificationService,
  ) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    const userId = this.authService.currentUser?.id;
    this.projectService.getAll(undefined, userId).subscribe({
      next: (projects) => {
        this.projects = projects.slice(0, 5);
        this.stats.total = projects.length;
        this.stats.open = projects.filter((p: any) => p.status?.toLowerCase() === 'open').length;
        this.stats.inProgress = projects.filter((p: any) => ['in_progress','in progress'].includes(p.status?.toLowerCase())).length;
        this.stats.completed = projects.filter((p: any) => p.status?.toLowerCase() === 'completed').length;
        this.deliveredProjects = projects.filter((p: any) => p.status?.toLowerCase() === 'delivered');
        this.stats.delivered = this.deliveredProjects.length;
        this.isLoading = false;
        if (userId) {
          fetch('http://localhost:8081/api/badges/client/project-posted', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId: userId, totalProjects: this.stats.total })
            }).then(() => {
              fetch('http://localhost:8081/api/badges/user/' + userId)
                .then(r => r.json()).then(data => { this.badges = data; }).catch(() => {});
            }).catch(() => {
              fetch('http://localhost:8081/api/badges/user/' + userId)
                .then(r => r.json()).then(data => { this.badges = data; }).catch(() => {});
            });
        }
      },
      error: () => {
        this.isLoading = false;
        if (userId) {
          fetch('http://localhost:8081/api/badges/client/project-posted', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId: userId, totalProjects: this.stats.total })
            }).then(() => {
              fetch('http://localhost:8081/api/badges/user/' + userId)
                .then(r => r.json()).then(data => { this.badges = data; }).catch(() => {});
            }).catch(() => {
              fetch('http://localhost:8081/api/badges/user/' + userId)
                .then(r => r.json()).then(data => { this.badges = data; }).catch(() => {});
            });
        }
      }
    });
    if (userId) {
      this.notifService.getForUser(userId).subscribe({
        next: (notifs) => {
          this.notifications = notifs.slice(0, 5);
          this.stats.unreadNotifs = notifs.filter((n: any) => !n.read).length;
        },
        error: () => {}
      });
    }
  }

  openDelivery(project: any): void {
    this.selectedDelivery = project;
    this.showDeliveryModal = true;
    this.showRevisionInput = false;
    this.revisionMessage = '';
  }

  closeDeliveryModal(): void {
    this.showDeliveryModal = false;
    this.selectedDelivery = null;
  }

  requestRevision(): void {
    if (!this.selectedDelivery || !this.revisionMessage.trim()) return;
    this.projectService.requestRevision(
      this.selectedDelivery.id, this.revisionMessage, Number(this.authService.currentUser!.id)
    ).subscribe({
      next: () => { this.closeDeliveryModal(); this.loadData(); },
      error: (err: any) => console.error('Revision error', err)
    });
  }

  getFreelancerAmount(): number { return Number(this.selectedDelivery?.budget) || 0; }
  getServiceFee(): number { return +(this.getFreelancerAmount() * this.SERVICE_FEE_RATE).toFixed(2); }
  getTotalAmount(): number { return +(this.getFreelancerAmount() + this.getServiceFee()).toFixed(2); }

  openPaymentModal(): void {
    this.showDeliveryModal = false;
    this.showPaymentModal = true;
    this.paymentStep = 'form';
    this.paymentMethod = 'card';
    this.paymentError = '';
    this.cardNumber = '';
    this.cardHolder = '';
    this.cardExpiry = '';
    this.cardCvc = '';
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentStep = 'form';
    this.paymentError = '';
  }

  processPayment(): void {
    if (this.paymentMethod === 'card') {
      if (!this.cardNumber || this.cardNumber.replace(/s/g, '').length < 16 ||
        !this.cardHolder.trim() || !this.cardExpiry || this.cardExpiry.length < 5 ||
        !this.cardCvc || this.cardCvc.length < 3) {
        this.paymentError = 'Veuillez remplir tous les champs correctement.';
        return;
      }
    }
    this.paymentError = '';
    this.paymentStep = 'processing';
    const clientId = Number(this.authService.currentUser!.id);
    this.projectService.completeProject(
      this.selectedDelivery.id, clientId, this.selectedDelivery.acceptedProposalId ?? 0
    ).subscribe({
      next: () => { this.paymentStep = 'success'; },
      error: (err: any) => {
        console.error('Payment error', err);
        this.paymentStep = 'form';
        this.paymentError = 'Une erreur est survenue.';
      }
    });
  }

  finishPayment(): void { this.closePaymentModal(); this.selectedDelivery = null; this.loadData(); }

  formatCardNumber(event: any): void {
    let val = event.target.value.replace(/D/g, '').substring(0, 16);
    this.cardNumber = val.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(event: any): void {
    let val = event.target.value.replace(/D/g, '').substring(0, 4);
    if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
    this.cardExpiry = val;
  }

  getStatusClass(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'open') return 'badge-open';
    if (s === 'in_progress' || s === 'in progress') return 'badge-progress';
    if (s === 'completed') return 'badge-done';
    if (s === 'cancelled') return 'badge-cancelled';
    if (s === 'delivered') return 'badge-delivered';
    return 'badge-open';
  }
}


