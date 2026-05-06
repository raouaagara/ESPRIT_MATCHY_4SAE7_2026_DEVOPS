import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FavoriteService } from "../services/favorite.service";
import { NotificationService } from "../services/notification.service";
import { Content } from "../models/content.model";

@Component({
  selector: "app-favorites",
  templateUrl: "./favorites.component.html",
  styleUrls: ["./favorites.component.scss"],
})
export class FavoritesComponent implements OnInit {
  favoriteContents: Content[] = [];
  loading: boolean = true;
  currentUserId: string = "1"; // ⚠️ À remplacer par l'ID de l'utilisateur connecté
  removingFavoriteId: number | null = null;

  constructor(
    private favoriteService: FavoriteService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  /**
   * Charger les contenus favoris
   */
  loadFavorites(): void {
    this.loading = true;

    this.favoriteService.getUserFavoriteContents(this.currentUserId).subscribe({
      next: (contents) => {
        this.favoriteContents = contents;
        this.loading = false;
        console.log("✅ Favoris chargés:", contents.length);
      },
      error: (err) => {
        console.error("❌ Erreur chargement favoris:", err);
        this.loading = false;
      },
    });
  }

  /**
   * Supprimer un favori
   */
  removeFavorite(content: Content, event: Event): void {
    event.stopPropagation(); // Empêcher la navigation vers le détail

    if (!confirm(`Retirer "${content.title}" de vos favoris ?`)) {
      return;
    }

    this.removingFavoriteId = content.contentId!;

    this.favoriteService
      .removeFavorite(this.currentUserId, content.contentId!)
      .subscribe({
        next: () => {
          console.log("✅ Favori supprimé");

          // Retirer de la liste sans recharger
          this.favoriteContents = this.favoriteContents.filter(
            (c) => c.contentId !== content.contentId,
          );

          this.removingFavoriteId = null;

          // 🔔 Notification via NotificationService
          this.notificationService.addNotification(
            "info",
            "❌ Removed from Favorites",
            `"${content.title}" has been removed from your favorites.`,
            "⭐",
          );
        },
        error: (err) => {
          console.error("❌ Erreur suppression:", err);
          this.removingFavoriteId = null;

          this.notificationService.addNotification(
            "error",
            "❌ Error",
            "An error occurred while removing the favorite. Please try again.",
            "❌",
          );
        },
      });
  }

  /**
   * Naviguer vers le détail d'un contenu
   */
  viewContent(contentId: number): void {
    this.router.navigate(["/content", contentId]);
  }

  /**
   * Retour à la liste des contenus
   */
  goBack(): void {
    this.router.navigate(["/content-list"]);
  }

  /**
   * Obtenir l'icône selon le type
   */
  getContentIcon(type: string): string {
    switch (type) {
      case "COURS":
        return "📚";
      case "ARTICLE":
        return "📝";
      case "VIDEO":
        return "🎥";
      default:
        return "📄";
    }
  }

  /**
   * Obtenir la classe CSS du badge
   */
  getContentBadgeClass(type: string): string {
    switch (type) {
      case "COURS":
        return "badge-cours";
      case "ARTICLE":
        return "badge-article";
      case "VIDEO":
        return "badge-video";
      default:
        return "badge-default";
    }
  }
}
