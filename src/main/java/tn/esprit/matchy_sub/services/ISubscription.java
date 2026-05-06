package tn.esprit.matchy_sub.services;

import tn.esprit.matchy_sub.entities.Subscription;

import java.util.List;

public interface ISubscription {
    Subscription createSubscription(Subscription subscription);
    Subscription findById(Long id);
    List<Subscription> findAll();
    Subscription updateSubscription(Long id, Subscription subscription);
    void deleteSubscription(Long id);
    Subscription upgradeSubscription(Long userId, Long newPlanId);
}
