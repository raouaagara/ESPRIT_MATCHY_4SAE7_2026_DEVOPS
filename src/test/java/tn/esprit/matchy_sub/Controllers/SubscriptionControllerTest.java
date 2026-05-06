package tn.esprit.matchy_sub.Controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.entities.PlanType;
import tn.esprit.matchy_sub.entities.Subscription;
import tn.esprit.matchy_sub.entities.SubscriptionStatus;
import tn.esprit.matchy_sub.repositories.PlanRepository;
import tn.esprit.matchy_sub.services.SubscriptionImp;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SubscriptionControllerTest {

    @Mock
    private SubscriptionImp subscriptionService;

    @Mock
    private PlanRepository planRepository;

    @InjectMocks
    private SubscriptionController subscriptionController;

    private Subscription subscription;
    private Plan proPlan;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        proPlan = new Plan();
        proPlan.setId(1L);
        proPlan.setName(PlanType.PRO);
        
        subscription = new Subscription();
        subscription.setId(1L);
        subscription.setUserId(1L);
        subscription.setPlan(proPlan);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
    }

    @Test
    void createSubscription() {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", 1L);
        body.put("priceAtPurchase", 100.0);
        body.put("planName", "PRO");

        when(planRepository.findByName(PlanType.PRO)).thenReturn(Optional.of(proPlan));
        when(subscriptionService.createSubscription(any(Subscription.class))).thenReturn(subscription);

        ResponseEntity<?> response = subscriptionController.create(body);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(subscription, response.getBody());
    }

    @Test
    void getById() {
        when(subscriptionService.findById(1L)).thenReturn(subscription);

        Subscription result = subscriptionController.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getAll() {
        when(subscriptionService.findAll()).thenReturn(Arrays.asList(subscription));

        List<Subscription> result = subscriptionController.getAll();

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getByUser() {
        when(subscriptionService.findByUserId(1L)).thenReturn(Arrays.asList(subscription));

        List<Subscription> result = subscriptionController.getByUser(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getActiveSubscription_Found() {
        when(subscriptionService.findByUserId(1L)).thenReturn(Arrays.asList(subscription));

        ResponseEntity<?> response = subscriptionController.getActiveSubscription(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(subscription, response.getBody());
    }

    @Test
    void getActiveSubscription_NotFound() {
        Subscription inactiveSub = new Subscription();
        inactiveSub.setStatus(SubscriptionStatus.EXPIRED);
        when(subscriptionService.findByUserId(1L)).thenReturn(Arrays.asList(inactiveSub));

        ResponseEntity<?> response = subscriptionController.getActiveSubscription(1L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
