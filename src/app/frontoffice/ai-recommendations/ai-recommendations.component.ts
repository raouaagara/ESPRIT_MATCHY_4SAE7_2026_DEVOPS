import { Component, OnInit } from '@angular/core';
import { AiRecommendationsService, ProjectRecommendation } from '../services/ai-recommendations.service';

@Component({
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
  styleUrls: ['./ai-recommendations.component.scss']
})
export class AiRecommendationsComponent implements OnInit {
  recommendations: ProjectRecommendation[] = [];
  loading = false;
  error: string | null = null;
  freelancerId = 1; // TODO: Get from auth service

  constructor(private aiService: AiRecommendationsService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.loading = true;
    this.error = null;

    this.aiService.getRecommendedProjects(this.freelancerId, 10).subscribe({
      next: (data) => {
        console.log('AI Recommendations loaded:', data);
        this.recommendations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading recommendations:', err);
        this.error = 'Failed to load recommendations. Please make sure the database migration has been run.';
        this.loading = false;
      }
    });
  }

  getMatchScoreColor(score: number): string {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // orange
    return '#ef4444'; // red
  }

  getMatchScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  }
}
