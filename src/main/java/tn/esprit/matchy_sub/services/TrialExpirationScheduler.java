package tn.esprit.matchy_sub.services;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tn.esprit.matchy_sub.entities.Subscription;
import tn.esprit.matchy_sub.entities.SubscriptionStatus;
import tn.esprit.matchy_sub.repositories.SubscriptionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Component
@AllArgsConstructor
@Slf4j
public class TrialExpirationScheduler {

    private final SubscriptionRepository subscriptionRepository;

    @Scheduled(fixedRate = 3600000) // every 1 hour
    public void expireTrials() {
        List<Subscription> expiredTrials = subscriptionRepository
                .findByIsTrialTrueAndStatusAndTrialEndDateBefore(
                        SubscriptionStatus.TRIAL,
                        LocalDateTime.now()
                );

        if (!expiredTrials.isEmpty()) {
            log.info("Expiring {} trial subscription(s)", expiredTrials.size());
            expiredTrials.forEach(sub -> {
                sub.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(sub);
                log.info("Trial expired for subscription ID: {}", sub.getId());
            });
        }
    }
}
