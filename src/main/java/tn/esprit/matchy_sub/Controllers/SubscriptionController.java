package tn.esprit.matchy_sub.Controllers;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.entities.PlanType;
import tn.esprit.matchy_sub.entities.Subscription;
import tn.esprit.matchy_sub.repositories.PlanRepository;
import tn.esprit.matchy_sub.services.SubscriptionImp;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscription")
@AllArgsConstructor
public class SubscriptionController {
    public final SubscriptionImp subscriptionService;
    public final PlanRepository planRepository;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Subscription subscription = new Subscription();

            if (body.get("priceAtPurchase") != null) {
                subscription.setPriceAtPurchase(Double.parseDouble(body.get("priceAtPurchase").toString()));
            }
            if (body.get("userId") != null) {
                subscription.setUserId(Long.parseLong(body.get("userId").toString()));
            }

            // Resolve plan: try by id first, then by planName
            Plan resolvedPlan = null;
            if (body.get("plan") instanceof Map) {
                Map<?, ?> planMap = (Map<?, ?>) body.get("plan");
                if (planMap.get("id") != null) {
                    try {
                        long planId = Long.parseLong(planMap.get("id").toString());
                        resolvedPlan = planRepository.findById(planId).orElse(null);
                    } catch (NumberFormatException ignored) {}
                }
            }
            if (resolvedPlan == null && body.get("planName") != null) {
                try {
                    String rawName = body.get("planName").toString().toUpperCase().trim();
                    // Handle slugs like "PRO", "PREMIUM", "FREE"
                    PlanType pt = PlanType.valueOf(rawName);
                    resolvedPlan = planRepository.findByName(pt).orElse(null);
                } catch (Exception ignored) {}
            }
            subscription.setPlan(resolvedPlan);

            // Store user info directly
            if (body.get("userName") != null) {
                subscription.setUserName(body.get("userName").toString());
            }
            if (body.get("userEmail") != null) {
                subscription.setUserEmail(body.get("userEmail").toString());
            }

            Subscription saved = subscriptionService.createSubscription(subscription);
            // Return the saved subscription directly — avoid a second DB call that could fail
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Subscription creation failed: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public Subscription getById(@PathVariable Long id) {
        return subscriptionService.findById(id);
    }

    @GetMapping
    public List<Subscription> getAll() {
        return subscriptionService.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Subscription> getByUser(@PathVariable Long userId) {
        return subscriptionService.findByUserId(userId);
    }

    @PutMapping("/{id}")
    public Subscription update(@PathVariable Long id, @RequestBody Subscription subscription) {
        return subscriptionService.updateSubscription(id, subscription);
    }

    @PostMapping("/upgrade")
    public ResponseEntity<?> upgradeSubscription(
            @RequestParam Long userId,
            @RequestParam Long newPlanId) {
        try {
            return ResponseEntity.ok(subscriptionService.upgradeSubscription(userId, newPlanId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        subscriptionService.deleteSubscription(id);
    }

    /**
     * Internal endpoint used by event-service (via OpenFeign) to check
     * whether a user currently has an active or trial subscription.
     * Returns 200 with the subscription, or 404 if none found.
     */
    @GetMapping("/user/{userId}/active")
    public ResponseEntity<?> getActiveSubscription(@PathVariable Long userId) {
        try {
            List<tn.esprit.matchy_sub.entities.Subscription> subs = subscriptionService.findByUserId(userId);
            return subs.stream()
                    .filter(s -> s.getStatus() == tn.esprit.matchy_sub.entities.SubscriptionStatus.ACTIVE
                              || s.getStatus() == tn.esprit.matchy_sub.entities.SubscriptionStatus.TRIAL)
                    .findFirst()
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching active subscription: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/trial-status")
    public ResponseEntity<?> getTrialStatus(@PathVariable Long id) {
        try {
            Subscription sub = subscriptionService.findById(id);
            if (sub.getIsTrial() == null || !sub.getIsTrial()) {
                return ResponseEntity.ok(Map.of("isTrial", false));
            }
            long daysRemaining = 0;
            if (sub.getTrialEndDate() != null) {
                daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(
                        java.time.LocalDateTime.now(), sub.getTrialEndDate());
                daysRemaining = Math.max(0, daysRemaining);
            }
            return ResponseEntity.ok(Map.of(
                    "isTrial", true,
                    "status", sub.getStatus().name(),
                    "daysRemaining", daysRemaining,
                    "trialEndDate", sub.getTrialEndDate() != null ? sub.getTrialEndDate().toString() : null,
                    "isExpired", sub.getStatus() == tn.esprit.matchy_sub.entities.SubscriptionStatus.EXPIRED
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
