import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Content } from "../models/content.model";
import { ContentService } from "../services/content.service";
import { AuthService } from "../services/auth.service";
import { CertificationService } from "../services/certification.service";

@Component({
  selector: "app-content-list",
  templateUrl: "./content-list.component.html",
  styleUrls: ["./content-list.component.scss"],
})
export class ContentListComponent implements OnInit {
  private static readonly INTERMEDIATE_UNLOCK_BEGINNER_CERTS = 3;
  private static readonly ADVANCED_UNLOCK_INTERMEDIATE_CERTS = 5;

  contents: Content[] = [];
  filteredContents: Content[] = [];
  selectedFilter: string = "all";
  currentUserName = "Guest";
  private currentUserId: number | null = null;
  private currentUserEmail = "";
  currentUserBadges: string[] = [];
  currentUserCertificationCount = 0;
  beginnerCertificationCount = 0;
  intermediateCertificationCount = 0;
  primaryBadge = "";
  badgeSummary = "No badge yet";

  constructor(
    private contentService: ContentService,
    private router: Router,
    private authService: AuthService,
    private certificationService: CertificationService,
  ) {}

  ngOnInit(): void {
    this.authService.checkAuth();
    const cu: any = this.authService.currentUser;
    this.currentUserName =
      cu?.name ||
      `${cu?.firstName || ""} ${cu?.lastName || ""}`.trim() ||
      "Guest";

    const userId =
      cu?.id ?? cu?.userId;
    this.currentUserEmail = cu?.email || "";
    const userName = this.currentUserName;

    this.currentUserId = userId != null ? Number(userId) : null;

    if (this.currentUserId != null) {
      this.certificationService.getAllCertifications().subscribe({
        next: () => {
          const resolvedUserId = this.currentUserId;
          if (resolvedUserId == null) {
            this.currentUserBadges = [];
            this.primaryBadge = "";
            this.badgeSummary = "No badge yet";
            this.currentUserCertificationCount = 0;
            this.beginnerCertificationCount = 0;
            this.intermediateCertificationCount = 0;
            return;
          }

          this.refreshCertificationProgress();

          this.currentUserBadges = this.certificationService.getBadgesForUser(
            resolvedUserId,
            this.currentUserEmail,
            userName,
          );
          this.primaryBadge =
            this.certificationService.getPrimaryBadgeForUser(
              resolvedUserId,
              this.currentUserEmail,
              userName,
            ) || "";
          this.badgeSummary = this.primaryBadge || "No badge yet";
        },
        error: () => {
          this.currentUserCertificationCount = 0;
          this.beginnerCertificationCount = 0;
          this.intermediateCertificationCount = 0;
          this.currentUserBadges = [];
          this.primaryBadge = "";
          this.badgeSummary = "No badge yet";
        },
      });
    } else {
      this.currentUserCertificationCount = 0;
      this.beginnerCertificationCount = 0;
      this.intermediateCertificationCount = 0;
    }

    this.loadContents();
  }

  loadContents(): void {
    this.contentService.getAllContents().subscribe({
      next: (contents) => {
        this.contents = contents;
        this.filteredContents = contents;
        this.refreshCertificationProgress();
      },
      error: (error) => {
        console.error("Error loading contents:", error);
        this.contents = [];
        this.filteredContents = [];
      },
    });
  }

  filterContents(type: string): void {
    this.selectedFilter = type;
    if (type === "all") {
      this.filteredContents = this.contents;
    } else {
      this.filteredContents = this.contents.filter(
        (content) => content.type === type.toUpperCase(),
      );
    }
  }

  viewContent(content: Content): void {
    if (!content.contentId || !this.isContentUnlocked(content)) {
      return;
    }

    // ✅ Route absolue complète pour éviter les problèmes de navigation relative
    this.router.navigate(["/content", content.contentId]);
  }

  getContentLevel(content: Content): "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE" {
    return content.level;
  }

  isContentUnlocked(content: Content): boolean {
    const level = this.getContentLevel(content);

    if (level === "DEBUTANT") {
      return true;
    }

    if (level === "INTERMEDIAIRE") {
      return (
        this.beginnerCertificationCount >=
        ContentListComponent.INTERMEDIATE_UNLOCK_BEGINNER_CERTS
      );
    }

    return (
      this.intermediateCertificationCount >=
      ContentListComponent.ADVANCED_UNLOCK_INTERMEDIATE_CERTS
    );
  }

  getUnlockRemainingCertifications(content: Content): number {
    const level = this.getContentLevel(content);

    if (level === "DEBUTANT") {
      return 0;
    }

    if (level === "INTERMEDIAIRE") {
      return Math.max(
        0,
        ContentListComponent.INTERMEDIATE_UNLOCK_BEGINNER_CERTS -
          this.beginnerCertificationCount,
      );
    }

    return Math.max(
      0,
      ContentListComponent.ADVANCED_UNLOCK_INTERMEDIATE_CERTS -
        this.intermediateCertificationCount,
    );
  }

  getUnlockMessage(content: Content): string {
    const remaining = this.getUnlockRemainingCertifications(content);
    if (remaining <= 0 || this.isContentUnlocked(content)) {
      return "";
    }
    return `Debloquer dans ${remaining} certification${remaining > 1 ? "s" : ""}`;
  }

  getLevelLabel(content: Content): string {
    const level = this.getContentLevel(content);
    switch (level) {
      case "DEBUTANT":
        return "Niveau Debutant";
      case "INTERMEDIAIRE":
        return "Niveau Intermediaire";
      case "AVANCE":
      default:
        return "Niveau Avance";
    }
  }

  private findContentById(contentId?: number): Content | undefined {
    if (contentId == null) {
      return undefined;
    }
    const parsedId = Number(contentId);
    if (!Number.isFinite(parsedId)) {
      return undefined;
    }
    return this.contents.find(
      (content) => Number(content.contentId) === parsedId,
    );
  }

  private refreshCertificationProgress(): void {
    if (this.currentUserId == null) {
      this.currentUserCertificationCount = 0;
      this.beginnerCertificationCount = 0;
      this.intermediateCertificationCount = 0;
      return;
    }

    const certificationsForUser =
      this.certificationService.getCertificationsForUser(
        this.currentUserId,
        this.currentUserEmail,
        this.currentUserName,
      );

    this.currentUserCertificationCount = certificationsForUser.length;
    this.beginnerCertificationCount = certificationsForUser.filter(
      (certification) => {
        const content = this.findContentById(certification.contentId);
        return content?.level === "DEBUTANT";
      },
    ).length;
    this.intermediateCertificationCount = certificationsForUser.filter(
      (certification) => {
        const content = this.findContentById(certification.contentId);
        return content?.level === "INTERMEDIAIRE";
      },
    ).length;
  }

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

  getBadgeClass(badge: string): string {
    switch (badge) {
      case "Bronze Badge":
        return "badge-bronze";
      case "Silver Badge":
        return "badge-silver";
      case "Gold Badge":
        return "badge-gold";
      case "Perfect Score Badge":
        return "badge-perfect";
      default:
        return "badge-muted";
    }
  }
}
