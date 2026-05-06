// ═══════════════════════════════════════════════════════════════════
// PREDICTION — Méthodes à ajouter dans ClProjectsComponent
// ═══════════════════════════════════════════════════════════════════

// 1. Ajouter dans les imports
import { PredictionService, CombinedPrediction } from '../../core/services/prediction.service';

// 2. Ajouter dans la classe (propriétés)
isPredicting  = false;
prediction:   CombinedPrediction | null = null;
predictError  = '';

// 3. Ajouter dans le constructor
// private predictionService: PredictionService,

// 4. Méthodes à ajouter dans la classe

loadPrediction(): void {
  if (!this.newProject.category) return;

  this.isPredicting = true;
  this.prediction   = null;
  this.predictError = '';

  const skills = this.skillsInput
    ? this.skillsInput.split(',').map(s => s.trim()).filter(s => s)
    : [];

  this.predictionService.predict(this.newProject.category!, skills).subscribe({
    next: (data) => {
      this.prediction   = data;
      this.isPredicting = false;
    },
    error: (err: any) => {
      this.predictError = 'Could not load prediction. Try again.';
      this.isPredicting = false;
    }
  });
}

applyBudget(): void {
  if (!this.prediction) return;
  this.newProject.budget = this.prediction.budget.recommended;
}

applyDeadline(): void {
  if (!this.prediction) return;
  const today = new Date();
  today.setDate(today.getDate() + this.prediction.deadline.recommendedDays);
  // Format YYYY-MM-DD pour l'input date
  this.newProject.deadline = today.toISOString().split('T')[0];
}

// Helpers pour la range bar du budget
getBudgetLeftPct(): number {
  if (!this.prediction) return 0;
  const { min, max } = this.prediction.budget;
  if (max === min) return 0;
  return 0; // la barre commence toujours à gauche (min)
}

getBudgetWidthPct(): number {
  if (!this.prediction) return 0;
  return 100; // la barre s'étend de min à max = 100%
}

getBudgetRecommendedPct(): number {
  if (!this.prediction) return 50;
  const { min, max, recommended } = this.prediction.budget;
  if (max === min) return 50;
  return Math.round(((recommended - min) / (max - min)) * 100);
}
