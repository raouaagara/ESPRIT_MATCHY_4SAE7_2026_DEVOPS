package tn.esprit.matchy_sub.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.matchy_sub.entities.Subscription;
import tn.esprit.matchy_sub.entities.SubscriptionStatus;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByStatus(SubscriptionStatus status);
    List<Subscription> findByUserId(Long userId);
    List<Subscription> findByIsTrialTrueAndStatusAndTrialEndDateBefore(
            SubscriptionStatus status, LocalDateTime now);
}
