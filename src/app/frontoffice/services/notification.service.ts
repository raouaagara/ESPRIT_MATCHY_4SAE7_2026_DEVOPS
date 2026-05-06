import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "error" | "certificate";
  icon: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadNotifications();
  }

  private getStorageKey(): string {
    const rawUser = localStorage.getItem("matchy_user");
    if (!rawUser) {
      return "notifications_anonymous";
    }

    try {
      const user = JSON.parse(rawUser);
      const identity = user?.email || user?.id || user?.userId || "anonymous";
      return `notifications_${identity}`;
    } catch {
      return "notifications_anonymous";
    }
  }

  // Charger les notifications du localStorage
  private loadNotifications(): void {
    const stored = localStorage.getItem(this.getStorageKey());
    if (stored) {
      const notifications = JSON.parse(stored).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount();
    }
  }

  // Ajouter une nouvelle notification
  addNotification(
    type: "success" | "info" | "warning" | "error" | "certificate",
    title: string,
    message: string,
    icon: string = "📢",
    data?: any,
  ): void {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      icon,
      title,
      message,
      timestamp: new Date(),
      read: false,
      data,
    };

    const current = this.notificationsSubject.value;
    const updated = [notification, ...current];
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
    this.updateUnreadCount();
  }

  // Ajouter une notification de certificat (automatisée)
  addCertificateNotification(userName: string, courseName: string): void {
    this.addNotification(
      "certificate",
      "🏆 Certificat Généré",
      `Félicitations ${userName}! Votre certificat pour "${courseName}" a été généré et envoyé par email.`,
      "🎓",
      { type: "certificate", courseName },
    );
  }

  // Marquer comme lue
  markAsRead(notificationId: string): void {
    const current = this.notificationsSubject.value;
    const updated = current.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
    this.updateUnreadCount();
  }

  // Marquer tout comme lue
  markAllAsRead(): void {
    const current = this.notificationsSubject.value;
    const updated = current.map((n) => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
    this.updateUnreadCount();
  }

  // Supprimer une notification
  deleteNotification(notificationId: string): void {
    const current = this.notificationsSubject.value;
    const updated = current.filter((n) => n.id !== notificationId);
    this.notificationsSubject.next(updated);
    this.saveNotifications(updated);
    this.updateUnreadCount();
  }

  // Supprimer tout
  clearAll(): void {
    this.notificationsSubject.next([]);
    localStorage.removeItem(this.getStorageKey());
    this.updateUnreadCount();
  }

  // Sauvegarder dans localStorage
  private saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(notifications));
  }

  refreshForCurrentUser(): void {
    this.loadNotifications();
  }

  // Mettre à jour le compte des non-lues
  private updateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter((n) => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  // Obtenir toutes les notifications
  getAll(): Notification[] {
    return this.notificationsSubject.value;
  }

  // Obtenir les non-lues
  getUnread(): Notification[] {
    return this.notificationsSubject.value.filter((n) => !n.read);
  }
}
