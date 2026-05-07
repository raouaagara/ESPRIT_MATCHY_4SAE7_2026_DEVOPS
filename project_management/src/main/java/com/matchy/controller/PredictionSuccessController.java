package com.matchy.controller;

import com.matchy.entity.PredictionSuccessEntity;
import com.matchy.entity.Project;
import com.matchy.repository.ProjectRepository;
import com.matchy.service.PredictionSuccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PredictionSuccessController {

    private final PredictionSuccessService predictionService;
    private final ProjectRepository projectRepository;

    // ============================================
    // Calculer la prédiction
    // POST /api/predictions/{freelancerId}/{projectId}
    // ============================================
    @PostMapping("/{freelancerId}/{projectId}")
    public ResponseEntity<PredictionSuccessEntity> predictSuccess(
            @PathVariable Long freelancerId,
            @PathVariable Long projectId) {
        try {
            PredictionSuccessEntity prediction = predictionService
                    .predictSuccess(freelancerId, projectId);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ============================================
    // Récupérer une prédiction existante
    // GET /api/predictions/{freelancerId}/{projectId}
    // ============================================
    @GetMapping("/{freelancerId}/{projectId}")
    public ResponseEntity<PredictionSuccessEntity> getPrediction(
            @PathVariable Long freelancerId,
            @PathVariable Long projectId) {
        Optional<PredictionSuccessEntity> prediction = predictionService
                .getPrediction(freelancerId, projectId);
        return prediction.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ============================================
    // Toutes les prédictions d'un freelancer
    // GET /api/predictions/freelancer/{freelancerId}
    // ============================================
    @GetMapping("/freelancer/{freelancerId}")
    public ResponseEntity<List<PredictionSuccessEntity>> getFreelancerPredictions(
            @PathVariable Long freelancerId) {
        List<PredictionSuccessEntity> predictions = predictionService
                .getFreelancerPredictions(freelancerId);
        return ResponseEntity.ok(predictions);
    }

    // ============================================
    // Meilleures prédictions d'un freelancer
    // GET /api/predictions/freelancer/{freelancerId}/best
    // ============================================
    @GetMapping("/freelancer/{freelancerId}/best")
    public ResponseEntity<List<PredictionSuccessEntity>> getBestPredictions(
            @PathVariable Long freelancerId) {
        List<PredictionSuccessEntity> predictions = predictionService
                .getBestPredictions(freelancerId);
        return ResponseEntity.ok(predictions);
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> suggestBudgetAndDeadline(
            @RequestParam(required = false, defaultValue = "") String category,
            @RequestParam(required = false, defaultValue = "") String skills) {
        String key = category.toLowerCase().trim();
        int skillsCount = (int) List.of(skills.split(",")).stream().map(String::trim).filter(s -> !s.isBlank()).count();
        double skillFactor = Math.max(0, Math.min(6, skillsCount)) * 0.08;

        List<Project> byCategory = projectRepository.findAll().stream()
            .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category))
            .collect(Collectors.toList());

        List<Double> budgets = byCategory.stream()
            .map(Project::getBudget)
            .filter(b -> b != null && b > 0)
            .sorted(Comparator.naturalOrder())
            .collect(Collectors.toList());

        int baseBudget;
        int baseDays;
        if (budgets.size() >= 3) {
            baseBudget = (int) Math.round(budgets.get(budgets.size() / 2));
        } else if (key.contains("web")) {
            baseBudget = 900; baseDays = 18;
        } else if (key.contains("mobile")) {
            baseBudget = 1200; baseDays = 24;
        } else if (key.contains("design")) {
            baseBudget = 500; baseDays = 10;
        } else if (key.contains("marketing")) {
            baseBudget = 450; baseDays = 12;
        } else if (key.contains("data") || key.contains("ai")) {
            baseBudget = 1300; baseDays = 22;
        } else {
            baseBudget = 700; baseDays = 14;
        }
        if (budgets.isEmpty()) {
            // keep category baseline
        }

        List<Long> deadlineDurations = byCategory.stream()
            .map(project -> {
                try {
                    if (project.getDeadline() == null || project.getDeadline().isBlank() || project.getCreatedAt() == null) return null;
                    LocalDate deadlineDate = LocalDate.parse(project.getDeadline());
                    long days = ChronoUnit.DAYS.between(project.getCreatedAt().toLocalDate(), deadlineDate);
                    return days > 0 ? days : null;
                } catch (Exception e) {
                    return null;
                }
            })
            .filter(d -> d != null && d > 0)
            .sorted()
            .collect(Collectors.toList());

        if (deadlineDurations.size() >= 3) {
            baseDays = Math.toIntExact(deadlineDurations.get(deadlineDurations.size() / 2));
        } else if (key.contains("web")) {
            baseDays = 18;
        } else if (key.contains("mobile")) {
            baseDays = 24;
        } else if (key.contains("design")) {
            baseDays = 10;
        } else if (key.contains("marketing")) {
            baseDays = 12;
        } else if (key.contains("data") || key.contains("ai")) {
            baseDays = 22;
        } else {
            baseDays = 14;
        }

        boolean knownCategory =
                key.contains("web") || key.contains("mobile") || key.contains("design") ||
                key.contains("marketing") || key.contains("data") || key.contains("ai") ||
                key.contains("develop");
        boolean hasHistoricalData = !budgets.isEmpty() || !deadlineDurations.isEmpty();
        boolean richHistoricalData = budgets.size() >= 5 || deadlineDurations.size() >= 5;
        String confidence;
        if (richHistoricalData && (knownCategory || skillsCount >= 2)) {
            confidence = "HIGH";
        } else if (hasHistoricalData || knownCategory || skillsCount >= 1) {
            confidence = "MEDIUM";
        } else {
            confidence = "LOW";
        }

        double budgetMinFactor;
        double budgetMaxFactor;
        double daysMinFactor;
        double daysMaxFactor;
        switch (confidence) {
            case "HIGH":
                budgetMinFactor = 0.90;
                budgetMaxFactor = 1.12;
                daysMinFactor = 0.88;
                daysMaxFactor = 1.18;
                break;
            case "LOW":
                budgetMinFactor = 0.75;
                budgetMaxFactor = 1.35;
                daysMinFactor = 0.70;
                daysMaxFactor = 1.45;
                break;
            default: // MEDIUM
                budgetMinFactor = 0.85;
                budgetMaxFactor = 1.20;
                daysMinFactor = 0.80;
                daysMaxFactor = 1.30;
                break;
        }

        int recommendedBudget = (int) Math.round(baseBudget * (1 + skillFactor));
        int minBudget = Math.max(100, (int) Math.round(recommendedBudget * budgetMinFactor));
        int maxBudget = (int) Math.round(recommendedBudget * budgetMaxFactor);

        int recommendedDays = Math.max(3, (int) Math.round(baseDays * (1 + skillFactor * 0.7)));
        int minDays = Math.max(2, (int) Math.round(recommendedDays * daysMinFactor));
        int maxDays = (int) Math.round(recommendedDays * daysMaxFactor);

        Map<String, Object> budget = new LinkedHashMap<>();
        budget.put("min", minBudget);
        budget.put("recommended", recommendedBudget);
        budget.put("max", maxBudget);
        budget.put("confidence", confidence);

        Map<String, Object> deadline = new LinkedHashMap<>();
        deadline.put("minDays", minDays);
        deadline.put("recommendedDays", recommendedDays);
        deadline.put("maxDays", maxDays);
        deadline.put("confidence", confidence);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("budget", budget);
        result.put("deadline", deadline);
        return ResponseEntity.ok(result);
    }
}