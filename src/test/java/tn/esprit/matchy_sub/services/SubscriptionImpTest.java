package tn.esprit.matchy_sub.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.matchy_sub.client.UserClient;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.entities.PlanType;
import tn.esprit.matchy_sub.entities.Subscription;
import tn.esprit.matchy_sub.entities.SubscriptionStatus;
import tn.esprit.matchy_sub.repositories.PlanRepository;
import tn.esprit.matchy_sub.repositories.SubscriptionRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionImpTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private UserClient userClient;

    @InjectMocks
    private SubscriptionImp subscriptionService;

    private Subscription subscription;
    private Plan proPlan;
    private Plan basicPlan;

    @BeforeEach
    void setUp() {
        proPlan = new Plan();
        proPlan.setId(1L);
        proPlan.setName(PlanType.PRO);
        proPlan.setPrice(100.0);

        basicPlan = new Plan();
        basicPlan.setId(2L);
        basicPlan.setName(PlanType.FREE);
        basicPlan.setPrice(0.0);

        subscription = new Subscription();
        subscription.setId(1L);
        subscription.setUserId(1L);
        subscription.setPlan(proPlan);
    }

    @Test
    void createSubscription_TrialEligible() {
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(subscription);
        when(userClient.getUser(1L)).thenReturn(Map.of("name", "John Doe", "email", "john@example.com"));

        Subscription created = subscriptionService.createSubscription(subscription);

        assertNotNull(created);
        assertTrue(created.getIsTrial());
        assertEquals(SubscriptionStatus.TRIAL, created.getStatus());
        assertNotNull(created.getTrialStartDate());
        assertNotNull(created.getTrialEndDate());
        assertEquals("John Doe", created.getUserName());
        assertEquals("john@example.com", created.getUserEmail());
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
    }

    @Test
    void createSubscription_NotTrialEligible() {
        Subscription freeSub = new Subscription();
        freeSub.setId(2L);
        freeSub.setUserId(2L);
        freeSub.setPlan(basicPlan);

        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(freeSub);

        Subscription created = subscriptionService.createSubscription(freeSub);

        assertNotNull(created);
        assertFalse(created.getIsTrial());
        assertEquals(SubscriptionStatus.PENDING, created.getStatus());
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
    }

    @Test
    void upgradeSubscription() {
        Subscription activeSub = new Subscription();
        activeSub.setId(1L);
        activeSub.setUserId(1L);
        activeSub.setStatus(SubscriptionStatus.ACTIVE);
        
        when(planRepository.findById(2L)).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Arrays.asList(activeSub));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Subscription newSub = subscriptionService.upgradeSubscription(1L, 2L);

        assertNotNull(newSub);
        assertEquals(1L, newSub.getUserId());
        assertEquals(proPlan, newSub.getPlan());
        assertEquals(100.0, newSub.getPriceAtPurchase());
        assertEquals(SubscriptionStatus.PENDING, newSub.getStatus());
        
        assertEquals(SubscriptionStatus.CANCELLED, activeSub.getStatus()); // Old active sub cancelled
        verify(subscriptionRepository, times(2)).save(any(Subscription.class));
    }

    @Test
    void findById() {
        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(subscription));

        Subscription found = subscriptionService.findById(1L);

        assertNotNull(found);
        assertEquals(1L, found.getId());
        verify(subscriptionRepository, times(1)).findById(1L);
    }
}
