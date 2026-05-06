import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Content } from "../models/content.model";
import { ContentTranslation, Language } from "../models/translation.model";
import { ContentService } from "../services/content.service";
import { TranslationService } from "../services/translation.service";
import { UserService } from "../services/user.service";
import { PdfGeneratorService } from "../services/pdf-generator.service";
import { FavoriteService } from "../services/favorite.service";
import { NotificationService } from "../services/notification.service";
import { User } from "../models/content-models";

@Component({
  selector: "app-content-detail",
  templateUrl: "./content-detail.component.html",
  styleUrls: ["./content-detail.component.scss"],
})
export class ContentDetailComponent implements OnInit {
  content: Content | null = null;
  author: User | null = null;
  loading: boolean = true;
  downloadingPdf: boolean = false;

  // Traduction - MODE INLINE
  showTranslation: boolean = false; // Afficher/cacher la traduction
  selectedLanguage: string = ""; // Langue sélectionnée
  availableLanguages: Language[] = [];
  currentTranslation: ContentTranslation | null = null;
  translating: boolean = false;
  showLanguageDropdown: boolean = false;

  // Favoris
  isFavorite: boolean = false;
  processingFavorite: boolean = false;
  currentUserId: string = "1";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private translationService: TranslationService,
    private userService: UserService,
    private pdfGenerator: PdfGeneratorService,
    private favoriteService: FavoriteService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.loadContent(+id);
      this.availableLanguages = this.translationService.getSupportedLanguages();
    }
  }

  loadContent(id: number): void {
    this.contentService.getContentById(id).subscribe({
      next: (content) => {
        this.content = content;

        if (content.authorId) {
          this.loadAuthor(content.authorId);
        }

        this.checkIfFavorite(id);
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading content:", error);
        this.loading = false;
      },
    });
  }

  loadAuthor(authorId: number): void {
    this.userService.getUserById(authorId).subscribe({
      next: (user) => {
        this.author = user;
      },
      error: (err) => {
        console.error("Error loading author:", err);
      },
    });
  }

  // ========================================
  // TRADUCTION - MODE INLINE
  // ========================================

  toggleLanguageDropdown(): void {
    this.showLanguageDropdown = !this.showLanguageDropdown;
  }

  translateToLanguage(languageCode: string): void {
    if (!this.content) return;

    this.selectedLanguage = languageCode;
    this.showLanguageDropdown = false;
    this.translating = true;

    // Essayer de récupérer la traduction existante
    this.translationService
      .getTranslation(this.content.contentId!, languageCode)
      .subscribe({
        next: (translation) => {
          if (translation) {
            console.log("✅ Translation loaded from cache:", translation);
            this.currentTranslation = translation;
            this.showTranslation = true;
          } else {
            // Si pas de traduction, en créer une
            this.createTranslation(languageCode);
          }
          this.translating = false;
        },
        error: () => {
          // Si erreur, créer une nouvelle traduction
          this.createTranslation(languageCode);
        },
      });
  }

  createTranslation(languageCode: string): void {
    if (!this.content) return;

    console.log("🌍 Creating new translation for:", languageCode);

    this.translationService
      .translateContent(this.content.contentId!, languageCode)
      .subscribe({
        next: (translation) => {
          console.log("✅ Translation created:", translation);
          this.currentTranslation = translation;
          this.showTranslation = true;
          this.translating = false;

          // Notification
          this.notificationService.addNotification(
            "success",
            "🌍 Translation Complete",
            `Content translated to ${this.translationService.getLanguageName(languageCode)}`,
          );
        },
        error: (error) => {
          console.error("❌ Error translating content:", error);
          this.translating = false;
          alert("Error translating content. Please try again.");
        },
      });
  }

  hideTranslation(): void {
    this.showTranslation = false;
    this.currentTranslation = null;
    this.selectedLanguage = "";
  }

  getSelectedLanguageFlag(): string {
    if (!this.selectedLanguage) return "🌐";
    return this.translationService.getLanguageFlag(this.selectedLanguage);
  }

  getSelectedLanguageName(): string {
    if (!this.selectedLanguage) return "Select Language";
    return this.translationService.getLanguageName(this.selectedLanguage);
  }

  // ========================================
  // FAVORIS
  // ========================================

  checkIfFavorite(contentId: number): void {
    this.favoriteService.isFavorite(this.currentUserId, contentId).subscribe({
      next: (response) => {
        this.isFavorite = response.isFavorite;
      },
      error: (err) => {
        console.error("Error checking favorite:", err);
      },
    });
  }

  toggleFavorite(): void {
    if (!this.content || this.processingFavorite) return;

    this.processingFavorite = true;

    if (this.isFavorite) {
      this.favoriteService
        .removeFavorite(this.currentUserId, this.content.contentId!)
        .subscribe({
          next: () => {
            this.isFavorite = false;
            this.processingFavorite = false;

            this.notificationService.addNotification(
              "info",
              "❌ Removed from Favorites",
              `"${this.content?.title}" has been removed from your favorites.`,
            );
          },
          error: (err) => {
            console.error("Error removing favorite:", err);
            this.processingFavorite = false;
            alert("❌ Error removing from favorites");
          },
        });
    } else {
      this.favoriteService
        .addFavorite(this.currentUserId, this.content.contentId!)
        .subscribe({
          next: () => {
            this.isFavorite = true;
            this.processingFavorite = false;

            this.notificationService.addNotification(
              "success",
              "⭐ Added to Favorites",
              `"${this.content?.title}" has been added to your favorites!`,
            );
          },
          error: (err) => {
            console.error("Error adding favorite:", err);
            this.processingFavorite = false;
            alert("❌ Error adding to favorites");
          },
        });
    }
  }

  // ========================================
  // PDF
  // ========================================

  downloadResources(): void {
    if (!this.content) {
      this.notificationService.addNotification(
        "error",
        "❌ Download Error",
        "No content available to download.",
      );
      return;
    }

    this.downloadingPdf = true;

    try {
      this.pdfGenerator.downloadContentAsPdf(this.content, this.author?.name);

      setTimeout(() => {
        this.notificationService.addNotification(
          "success",
          "📥 PDF Downloaded",
          `"${this.content?.title}" has been downloaded as PDF!`,
        );
      }, 500);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      this.notificationService.addNotification(
        "error",
        "❌ PDF Generation Failed",
        "An error occurred while generating the PDF. Please try again.",
      );
    } finally {
      this.downloadingPdf = false;
    }
  }

  // ========================================
  // NAVIGATION
  // ========================================

  goBack(): void {
    this.router.navigate(["/content-list"]);
  }

  takeAssessment(): void {
    if (this.content?.contentId != null) {
      this.router.navigate([
        "/assessment",
        this.content.contentId,
      ]);
    }
  }

  // ========================================
  // HELPERS
  // ========================================

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
