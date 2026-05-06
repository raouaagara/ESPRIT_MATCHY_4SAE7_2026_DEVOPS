import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { CertificationService } from "../../frontoffice/services/certification.service";
import { UserService } from "../../frontoffice/services/user.service";
import { ContentService } from "../../frontoffice/services/content.service";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-certification-management",
  templateUrl: "./certification-management.component.html",
  styleUrls: ["./certification-management.component.scss"],
})
export class CertificationManagementComponent implements OnInit {
  // Tab management
  activeTab: "admin" | "system" = "admin";

  // Certifications lists
  filteredCertifications: any[] = [];
  adminCertifications: any[] = [];
  systemCertifications: any[] = [];

  // Modal state
  showModal = false;
  isEditMode = false;

  // Current certification being edited/created
  currentCertification: any = {
    certificationId: null,
    userId: undefined,
    contentId: undefined,
    assessmentId: null,
    score: 0,
    issuedAt: new Date(),
    validity: "",
    verifiedBy: "",
  };

  // Reference data
  users: any[] = [];
  contents: any[] = [];

  constructor(
    private certificationService: CertificationService,
    private userService: UserService,
    private contentService: ContentService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadContents();
    this.loadCertifications();
  }

  // Load all certifications and split them
  loadCertifications(): void {
    this.certificationService.getAllCertifications().subscribe({
      next: (data: any[]) => {
        this.filteredCertifications = data;

        // Split certifications based on verifiedBy field
        this.adminCertifications = data.filter(
          (cert: any) =>
            cert.verifiedBy &&
            cert.verifiedBy.toLowerCase() !== "system" &&
            cert.verifiedBy.toLowerCase() !== "automated",
        );

        this.systemCertifications = data.filter(
          (cert: any) =>
            cert.verifiedBy &&
            (cert.verifiedBy.toLowerCase() === "system" ||
              cert.verifiedBy.toLowerCase() === "automated"),
        );

        console.log(
          "Total certifications:",
          this.filteredCertifications.length,
        );
        console.log("Admin certifications:", this.adminCertifications.length);
        console.log("System certifications:", this.systemCertifications.length);
      },
      error: (err: any) => {
        console.error("Error loading certifications:", err);
        alert("Failed to load certifications. Please try again.");
      },
    });
  }

  // Load users for dropdown — pulled from matchy_db via the matchy backend
  // (NOT from content_db.users). The api-gateway routes /api/users → backend-service.
  loadUsers(): void {
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: (data: any[]) => {
        this.users = (data || []).map((u) => ({
          ...u,
          id: u?.id ?? u?.userId,
          name:
            (u?.name && u.name.trim()) ||
            `${u?.firstName || ""} ${u?.lastName || ""}`.trim() ||
            u?.email ||
            "Unknown User",
        }));
      },
      error: (err: any) => {
        console.error("Error loading users from matchy backend:", err);
      },
    });
  }

  // Load contents for dropdown
  loadContents(): void {
    this.contentService.getAllContents().subscribe({
      next: (data: any[]) => {
        this.contents = data;
      },
      error: (err: any) => {
        console.error("Error loading contents:", err);
      },
    });
  }

  // Resolve and display the most reliable user identity (email first)
  getUserDisplay(certification: any): string {
    const directEmail =
      certification?.user?.email ?? certification?.userEmail ?? "";
    if (typeof directEmail === "string" && directEmail.trim()) {
      return directEmail.trim();
    }

    const userId = Number(
      certification?.userId ??
        certification?.user?.id ??
        certification?.user?.userId,
    );
    const user = this.users.find((u) => Number(u?.id ?? u?.userId) === userId);

    const userEmail = typeof user?.email === "string" ? user.email.trim() : "";
    if (userEmail) {
      return userEmail;
    }

    const rawNames = [
      certification?.userName,
      certification?.user?.name,
      [certification?.user?.firstName, certification?.user?.lastName]
        .filter(Boolean)
        .join(" "),
      (user?.name || "").trim(),
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    ];

    const directName = rawNames.find(
      (n) => typeof n === "string" && n.trim() && n !== "undefined undefined",
    );
    if (directName) {
      return directName.trim();
    }

    return "Unknown User";
  }

  // Get content title by ID
  getContentTitle(contentId: number): string {
    const content = this.contents.find((c) => c.contentId === contentId);
    return content ? content.title : "Unknown Content";
  }

  // Get score badge class for styling
  getScoreBadgeClass(score: number): string {
    if (score >= 90) return "badge-excellent";
    if (score >= 80) return "badge-good";
    if (score >= 70) return "badge-average";
    return "badge-poor";
  }

  getUserBadges(certification: any): string[] {
    const userId = Number(
      certification?.userId ??
        certification?.user?.id ??
        certification?.user?.userId,
    );

    if (!Number.isFinite(userId)) {
      return [];
    }

    return this.certificationService.getBadgesForUser(userId);
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

  // Open create modal
  openCreateModal(): void {
    this.isEditMode = false;
    this.currentCertification = {
      certificationId: null,
      userId: undefined,
      contentId: undefined,
      assessmentId: null,
      score: 0,
      issuedAt: new Date(),
      validity: "",
      verifiedBy: "",
    };
    this.showModal = true;
  }

  // Open edit modal
  openEditModal(certification: any): void {
    this.isEditMode = true;
    this.currentCertification = { ...certification };
    this.showModal = true;
  }

  // Close modal
  closeModal(): void {
    this.showModal = false;
    this.currentCertification = {
      certificationId: null,
      userId: undefined,
      contentId: undefined,
      assessmentId: null,
      score: 0,
      issuedAt: new Date(),
      validity: "",
      verifiedBy: "",
    };
  }

  // Save certification (create or update)
  saveCertification(): void {
    // Ensure issuedAt is set
    if (!this.currentCertification.issuedAt) {
      this.currentCertification.issuedAt = new Date();
    }

    if (this.isEditMode) {
      // Update existing certification
      this.certificationService
        .updateCertification(this.currentCertification)
        .subscribe({
          next: () => {
            alert("Certification updated successfully!");
            this.loadCertifications();
            this.closeModal();
          },
          error: (err: any) => {
            console.error("Error updating certification:", err);
            alert("Failed to update certification. Please try again.");
          },
        });
    } else {
      // Create new certification
      this.certificationService
        .createCertification(this.currentCertification)
        .subscribe({
          next: () => {
            alert("Certification created successfully!");
            this.loadCertifications();
            this.closeModal();
          },
          error: (err: any) => {
            console.error("Error creating certification:", err);
            alert("Failed to create certification. Please try again.");
          },
        });
    }
  }

  // Delete certification
  deleteCertification(certification: any): void {
    const confirmDelete = confirm(
      `Are you sure you want to delete the certification for "${this.getUserDisplay(certification)}"?`,
    );

    if (confirmDelete) {
      this.certificationService
        .deleteCertification(certification.certificationId)
        .subscribe({
          next: () => {
            alert("Certification deleted successfully!");
            this.loadCertifications();
          },
          error: (err: any) => {
            console.error("Error deleting certification:", err);
            alert("Failed to delete certification. Please try again.");
          },
        });
    }
  }

  // View certification details
  viewCertification(certification: any): void {
    const message = `
Certification Details:
----------------------
ID: ${certification.certificationId}
User: ${this.getUserDisplay(certification)}
Content: ${this.getContentTitle(certification.contentId)}
Score: ${certification.score}%
Issued: ${new Date(certification.issuedAt).toLocaleDateString()}
Validity: ${certification.validity}
Verified By: ${certification.verifiedBy}
    `;
    alert(message);
  }
}
