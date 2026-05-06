import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
//import { Assessment, Question, AssessmentResult } from '../models/content.model';
import { Assessment } from "../models/content.model";
import { Question, AssessmentResult } from "../models/content-models";
import { Certification } from "../models/certification.model";
import { AssessmentService } from "../services/assessment.service";
import { CertificationService } from "../services/certification.service";
import { AuthService } from "../services/auth.service";
import { NotificationService } from "../services/notification.service";

@Component({
  selector: "app-assessment-test",
  templateUrl: "./assessment-test.component.html",
  styleUrls: ["./assessment-test.component.scss"],
})
export class AssessmentTestComponent implements OnInit {
  assessment: Assessment | null = null;
  contentId: number = 0;
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  showResult: boolean = false;
  result: AssessmentResult | null = null;
  loading: boolean = true;
  userId: number = 1;

  // Notification de certificat envoyé par email
  showEmailNotification: boolean = false;

  passed: boolean = false;
  userScore: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assessmentService: AssessmentService,
    private certificationService: CertificationService,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const cu: any = this.authService.currentUser;
    this.userId =
      cu?.id ??
      cu?.userId ??
      1;
    const contentIdStr = this.route.snapshot.paramMap.get("contentId");
    if (contentIdStr) {
      this.contentId = +contentIdStr;
      console.log("assessment-test ngOnInit - contentId:", this.contentId);
      this.loadAssessmentForContent(this.contentId);
    } else {
      console.warn("assessment-test ngOnInit - no contentId found in route");
      this.loading = false;
    }
  }

  loadAssessmentForContent(contentId: number): void {
    console.log("Loading assessment for content ID:", contentId);
    this.assessmentService.getAssessmentByContentId(contentId).subscribe({
      next: (assessment) => {
        console.log("Assessment loaded:", assessment);
        this.assessment = assessment;
        this.parseQuestions();
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading assessment:", err);
        this.assessment = null;
        this.loading = false;
      },
    });
  }

  parseQuestions(): void {
    if (!this.assessment || !this.assessment.questions) {
      this.questions = [];
      return;
    }

    try {
      const parsed = JSON.parse(this.assessment.questions);
      if (Array.isArray(parsed)) {
        this.questions = parsed.map((q: any) => ({
          question: q.question || "",
          correctAnswer: q.correctAnswer || "",
          userAnswer: "",
          isCorrect: false,
        }));
      } else {
        console.warn("Parsed questions is not an array");
        this.questions = [];
      }
    } catch (error) {
      console.error("Failed to parse questions JSON:", error);
      console.log("Raw questions string:", this.assessment.questions);
      this.questions = [];
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitAssessment(): void {
    if (!this.assessment || this.questions.length === 0) return;

    let correctCount = 0;
    this.questions.forEach((q) => {
      const userAns = (q.userAnswer || "").trim().toLowerCase();
      const correctAns = (q.correctAnswer || "").trim().toLowerCase();
      q.isCorrect = userAns === correctAns;
      if (q.isCorrect) correctCount++;
    });

    const totalQuestions = this.questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= this.assessment.passingScore;

    this.result = {
      totalQuestions,
      correctAnswers: correctCount,
      incorrectAnswers: totalQuestions - correctCount,
      score: scorePercentage,
      passed,
      passingScore: this.assessment.passingScore,
    };

    this.passed = passed;
    this.userScore = scorePercentage;
    this.showResult = true;

    if (passed) {
      this.createCertification(scorePercentage);
      // Afficher la notification "Certificat envoyé par email"
      this.showEmailNotification = true;
      setTimeout(() => {
        this.showEmailNotification = false;
      }, 8000); // disparaît après 8 secondes
    }
  }

  createCertification(score: number): void {
    if (!this.assessment) return;

    const newCertification: Certification = {
      score,
      validity: "1 year",
      verifiedBy: "System",
      userId:
        (this.authService.currentUser as any)?.id ??
        (this.authService.currentUser as any)?.userId ??
        this.userId,
      contentId: this.contentId,
      assessmentId: this.assessment.assessmentId,
    };

    console.log("📋 Sending certification to backend:", newCertification);
    this.certificationService.createCertification(newCertification).subscribe({
      next: (cert) => {
        console.log("✅ Certification created successfully:", cert);
        console.log(
          "📧 Backend should now be generating PDF and sending email...",
        );

        this.authService.checkAuth();

        // 🔔 Ajouter une notification
        const courseName =
          this.assessment?.content?.title ||
          this.assessment?.contentTitle ||
          "Course";
        const userName = this.authService.currentUser?.name || "User";
        this.notificationService.addCertificateNotification(
          userName,
          courseName,
        );

        if (score === 100) {
          this.notificationService.addNotification(
            "success",
            "🏅 Perfect Score Badge unlocked",
            `${userName} has earned the Perfect Score Badge for a 100% assessment result.`,
            "🏆",
            { type: "badge", badge: "Perfect Score Badge" },
          );
        }
      },
      error: (err) => {
        console.error("❌ Failed to create certification:", err);
      },
    });
  }

  retryAssessment(): void {
    this.currentQuestionIndex = 0;
    this.showResult = false;
    this.result = null;
    this.passed = false;
    this.userScore = 0;
    this.showEmailNotification = false;

    this.questions.forEach((q) => {
      q.userAnswer = "";
      q.isCorrect = false;
    });
  }

  goBack(): void {
    this.router.navigate(["/content", this.contentId]);
  }

  // Getters
  get currentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get progress(): number {
    if (this.questions.length === 0) return 0;
    return Math.round(
      ((this.currentQuestionIndex + 1) / this.questions.length) * 100,
    );
  }

  isAllQuestionsAnswered(): boolean {
    return this.questions.every(
      (q) => q.userAnswer && q.userAnswer.trim() !== "",
    );
  }
}
