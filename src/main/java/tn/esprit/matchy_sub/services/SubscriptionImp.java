package tn.esprit.matchy_sub.services;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.matchy_sub.client.UserClient;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.entities.PlanType;
import tn.esprit.matchy_sub.entities.Subscription;
import tn.esprit.matchy_sub.entities.SubscriptionStatus;
import tn.esprit.matchy_sub.repositories.PlanRepository;
import tn.esprit.matchy_sub.repositories.SubscriptionRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class SubscriptionImp implements ISubscription {
    public final SubscriptionRepository subscriptionRepository;
    public final PlanRepository planRepository;
    public final UserClient userClient;

    @Override
    public Subscription createSubscription(Subscription subscription) {
        subscription.setStartDate(LocalDateTime.now());
        if (subscription.getEndDate() == null) {
            subscription.setEndDate(LocalDateTime.now().plusMonths(1));
        }

        // Reload plan if only id given
        if (subscription.getPlan() != null && subscription.getPlan().getName() == null) {
            planRepository.findById(subscription.getPlan().getId()).ifPresent(subscription::setPlan);
        }

        boolean isTrialEligible = subscription.getPlan() != null
                && subscription.getPlan().getName() != null
                && (subscription.getPlan().getName() == PlanType.PRO
                    || subscription.getPlan().getName() == PlanType.PREMIUM);

        if (isTrialEligible) {
            subscription.setIsTrial(true);
            subscription.setTrialStartDate(LocalDateTime.now());
            subscription.setTrialEndDate(LocalDateTime.now().plusDays(7));
            subscription.setStatus(SubscriptionStatus.TRIAL);
        } else {
            subscription.setIsTrial(false);
            subscription.setStatus(SubscriptionStatus.PENDING);
        }

        Subscription saved = subscriptionRepository.save(subscription);
        try {
            enrich(saved);
        } catch (Exception e) {
            // Enrichment is non-critical
        }
        return saved;
    }

    @Override
    public Subscription upgradeSubscription(Long userId, Long newPlanId) {
        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé : " + newPlanId));

        List<Subscription> userSubs = subscriptionRepository.findByUserId(userId).stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE
                          || s.getStatus() == SubscriptionStatus.TRIAL)
                .toList();

        for (Subscription currentSub : userSubs) {
            currentSub.setStatus(SubscriptionStatus.CANCELLED);
            subscriptionRepository.save(currentSub);
        }

        Subscription newSubscription = new Subscription();
        newSubscription.setUserId(userId);
        newSubscription.setPlan(newPlan);
        newSubscription.setPriceAtPurchase(newPlan.getPrice());
        newSubscription.setStartDate(LocalDateTime.now());
        newSubscription.setEndDate(LocalDateTime.now().plusMonths(1));
        newSubscription.setStatus(SubscriptionStatus.PENDING);

        Subscription saved = subscriptionRepository.save(newSubscription);
        enrich(saved);
        return saved;
    }

    @Override
    public Subscription updateSubscription(Long id, Subscription subscription) {
        if (!subscriptionRepository.existsById(id)) {
            throw new RuntimeException("Modification impossible : ID introuvable");
        }
        subscription.setId(id);
        Subscription saved = subscriptionRepository.save(subscription);
        enrich(saved);
        return saved;
    }

    @Override
    public Subscription findById(Long id) {
        Subscription s = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Souscription " + id + " non trouvée"));
        enrich(s);
        return s;
    }

    @Override
    public List<Subscription> findAll() {
        List<Subscription> all = subscriptionRepository.findAll();
        all.forEach(this::enrich);
        return all;
    }

    @Override
    public void deleteSubscription(Long id) {
        subscriptionRepository.deleteById(id);
    }

    public List<Subscription> findByUserId(Long userId) {
        List<Subscription> all = subscriptionRepository.findByUserId(userId);
        all.forEach(this::enrich);
        return all;
    }

    /** Hydrate userName/userEmail transient fields from matchy backend. */
    public void enrich(Subscription s) {
        if (s == null || s.getUserId() == null) return;
        Map<String, Object> u = userClient.getUser(s.getUserId());
        if (u != null) {
            Object name = u.getOrDefault("name", u.get("fullName"));
            Object email = u.get("email");
            if (name != null) s.setUserName(String.valueOf(name));
            if (email != null) s.setUserEmail(String.valueOf(email));
        }
    }
}
