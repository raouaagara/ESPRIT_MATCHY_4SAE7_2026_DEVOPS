package tn.esprit.matchy_sub.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.matchy_sub.client.UserClient;
import tn.esprit.matchy_sub.entities.*;
import tn.esprit.matchy_sub.repositories.PlanRepository;
import tn.esprit.matchy_sub.repositories.SubscriptionRepository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SubscriptionImp — Tests CRUD + Logique Métier")
class SubscriptionServiceTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private PlanRepository planRepository;
    @Mock private UserClient userClient;

    @InjectMocks
    private SubscriptionImp subscriptionService;

    private Plan freePlan;
    private Plan proPlan;
    private Plan premiumPlan;

    @BeforeEach
    void setUp() {
        freePlan = Plan.builder().id(1L).name(PlanType.FREE).price(0.0).active(true).build();
        proPlan  = Plan.builder().id(2L).name(PlanType.PRO).price(29.0).active(true).build();
        premiumPlan = Plan.builder().id(3L).name(PlanType.PREMIUM).price(69.0).active(true).build();
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createSubscription")
    class CreateSubscription {

        @Test
        @DisplayName("Plan PRO → statut TRIAL + période d'essai 7 jours")
        void proplan_setsTrial() {
            Subscription sub = Subscription.builder().userId(1L).plan(proPlan).build();
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(1L)).thenReturn(null);

            Subscription result = subscriptionService.createSubscription(sub);

            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.TRIAL);
            assertThat(result.getIsTrial()).isTrue();
            assertThat(result.getTrialEndDate()).isAfter(LocalDateTime.now());
            assertThat(result.getTrialEndDate())
                    .isBefore(LocalDateTime.now().plusDays(8));
        }

        @Test
        @DisplayName("Plan PREMIUM → statut TRIAL + période d'essai 7 jours")
        void premiumPlan_setsTrial() {
            Subscription sub = Subscription.builder().userId(1L).plan(premiumPlan).build();
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(1L)).thenReturn(null);

            Subscription result = subscriptionService.createSubscription(sub);

            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.TRIAL);
            assertThat(result.getIsTrial()).isTrue();
        }

        @Test
        @DisplayName("Plan FREE → statut PENDING, pas de trial")
        void freePlan_setsPending_noTrial() {
            Subscription sub = Subscription.builder().userId(1L).plan(freePlan).build();
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(1L)).thenReturn(null);

            Subscription result = subscriptionService.createSubscription(sub);

            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.PENDING);
            assertThat(result.getIsTrial()).isFalse();
            assertThat(result.getTrialStartDate()).isNull();
        }

        @Test
        @DisplayName("startDate est définie automatiquement")
        void create_setsStartDate() {
            Subscription sub = Subscription.builder().userId(1L).plan(freePlan).build();
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(1L)).thenReturn(null);

            Subscription result = subscriptionService.createSubscription(sub);

            assertThat(result.getStartDate()).isNotNull();
            assertThat(result.getStartDate()).isBeforeOrEqualTo(LocalDateTime.now());
        }

        @Test
        @DisplayName("endDate par défaut = startDate + 1 mois")
        void create_setsDefaultEndDate() {
            Subscription sub = Subscription.builder().userId(1L).plan(freePlan).build();
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(1L)).thenReturn(null);

            Subscription result = subscriptionService.createSubscription(sub);

            assertThat(result.getEndDate()).isAfter(LocalDateTime.now().plusDays(28));
        }

        @Test
        @DisplayName("Plan avec seulement l'ID → recharge le plan depuis le repo")
        void create_reloadsPlanById() {
            Plan planWithIdOnly = Plan.builder().id(2L).build(); // name = null
            Subscription sub = Subscription.builder().userId(1L).plan(planWithIdOnly).build();
            when(planRepository.findById(2L)).thenReturn(Optional.of(proPlan));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(1L)).thenReturn(null);

            Subscription result = subscriptionService.createSubscription(sub);

            assertThat(result.getPlan().getName()).isEqualTo(PlanType.PRO);
            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.TRIAL);
        }

        @Test
        @DisplayName("Enrichissement user — userName et userEmail remplis via UserClient")
        void create_enrichesUserInfo() {
            Subscription sub = Subscription.builder().userId(5L).plan(freePlan).build();
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(5L)).thenReturn(Map.of("name", "Ahmed Ben Ali", "email", "ahmed@test.tn"));

            Subscription result = subscriptionService.createSubscription(sub);

            assertThat(result.getUserName()).isEqualTo("Ahmed Ben Ali");
            assertThat(result.getUserEmail()).isEqualTo("ahmed@test.tn");
        }

        @Test
        @DisplayName("Enrichissement échoue → subscription créée quand même (fail-safe)")
        void create_enrichmentFailure_doesNotBlockCreation() {
            Subscription sub = Subscription.builder().userId(1L).plan(freePlan).build();
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenThrow(new RuntimeException("UserService down"));

            assertThatCode(() -> subscriptionService.createSubscription(sub))
                    .doesNotThrowAnyException();
        }
    }

    // ─── UPGRADE ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("upgradeSubscription — Logique Métier Avancée")
    class UpgradeSubscription {

        @Test
        @DisplayName("Upgrade annule les subscriptions ACTIVE et TRIAL existantes")
        void upgrade_cancelsPreviousActiveAndTrialSubs() {
            Subscription activeSub = Subscription.builder()
                    .id(10L).userId(1L).plan(proPlan).status(SubscriptionStatus.ACTIVE).build();
            Subscription trialSub = Subscription.builder()
                    .id(11L).userId(1L).plan(freePlan).status(SubscriptionStatus.TRIAL).build();

            when(planRepository.findById(3L)).thenReturn(Optional.of(premiumPlan));
            when(subscriptionRepository.findByUserId(1L))
                    .thenReturn(Arrays.asList(activeSub, trialSub));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            subscriptionService.upgradeSubscription(1L, 3L);

            assertThat(activeSub.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
            assertThat(trialSub.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
        }

        @Test
        @DisplayName("Upgrade ne touche pas les subscriptions PENDING ou EXPIRED")
        void upgrade_doesNotCancelPendingOrExpired() {
            Subscription pendingSub = Subscription.builder()
                    .id(12L).userId(1L).plan(freePlan).status(SubscriptionStatus.PENDING).build();

            when(planRepository.findById(2L)).thenReturn(Optional.of(proPlan));
            when(subscriptionRepository.findByUserId(1L)).thenReturn(List.of(pendingSub));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            subscriptionService.upgradeSubscription(1L, 2L);

            assertThat(pendingSub.getStatus()).isEqualTo(SubscriptionStatus.PENDING); // inchangé
        }

        @Test
        @DisplayName("Upgrade crée une nouvelle subscription PENDING avec le nouveau plan")
        void upgrade_createsNewPendingSubscription() {
            when(planRepository.findById(3L)).thenReturn(Optional.of(premiumPlan));
            when(subscriptionRepository.findByUserId(1L)).thenReturn(List.of());
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            Subscription result = subscriptionService.upgradeSubscription(1L, 3L);

            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.PENDING);
            assertThat(result.getPlan()).isEqualTo(premiumPlan);
            assertThat(result.getPriceAtPurchase()).isEqualTo(69.0);
        }

        @Test
        @DisplayName("Upgrade avec plan inexistant → RuntimeException")
        void upgrade_throwsWhenPlanNotFound() {
            when(planRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> subscriptionService.upgradeSubscription(1L, 99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Plan non trouvé");
        }
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findById / findAll / findByUserId")
    class ReadOperations {

        @Test
        @DisplayName("findById — retourne la subscription enrichie")
        void findById_returnsEnrichedSubscription() {
            Subscription sub = Subscription.builder().id(1L).userId(5L).plan(proPlan)
                    .status(SubscriptionStatus.ACTIVE).build();
            when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(sub));
            when(userClient.getUser(5L)).thenReturn(Map.of("name", "Test User", "email", "test@test.tn"));

            Subscription result = subscriptionService.findById(1L);

            assertThat(result.getUserName()).isEqualTo("Test User");
            assertThat(result.getUserEmail()).isEqualTo("test@test.tn");
        }

        @Test
        @DisplayName("findById — lève RuntimeException si introuvable")
        void findById_throwsWhenNotFound() {
            when(subscriptionRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> subscriptionService.findById(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("non trouvée");
        }

        @Test
        @DisplayName("findAll — retourne toutes les subscriptions enrichies")
        void findAll_returnsAllEnriched() {
            Subscription s1 = Subscription.builder().id(1L).userId(1L).plan(proPlan).build();
            Subscription s2 = Subscription.builder().id(2L).userId(2L).plan(freePlan).build();
            when(subscriptionRepository.findAll()).thenReturn(Arrays.asList(s1, s2));
            when(userClient.getUser(anyLong())).thenReturn(null);

            List<Subscription> result = subscriptionService.findAll();

            assertThat(result).hasSize(2);
            verify(userClient, times(2)).getUser(anyLong());
        }

        @Test
        @DisplayName("findByUserId — retourne les subscriptions de l'utilisateur")
        void findByUserId_returnsUserSubscriptions() {
            Subscription s1 = Subscription.builder().id(1L).userId(3L).plan(proPlan).build();
            Subscription s2 = Subscription.builder().id(2L).userId(3L).plan(premiumPlan).build();
            when(subscriptionRepository.findByUserId(3L)).thenReturn(Arrays.asList(s1, s2));
            when(userClient.getUser(3L)).thenReturn(null);

            List<Subscription> result = subscriptionService.findByUserId(3L);

            assertThat(result).hasSize(2);
            assertThat(result).allMatch(s -> s.getUserId().equals(3L));
        }
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateSubscription — met à jour et retourne la subscription")
    void updateSubscription_updatesAndReturns() {
        Subscription updated = Subscription.builder()
                .userId(1L).plan(premiumPlan).status(SubscriptionStatus.ACTIVE).build();
        when(subscriptionRepository.existsById(1L)).thenReturn(true);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.getUser(1L)).thenReturn(null);

        Subscription result = subscriptionService.updateSubscription(1L, updated);

        assertThat(result.getId()).isEqualTo(1L);
        verify(subscriptionRepository).save(updated);
    }

    @Test
    @DisplayName("updateSubscription — lève RuntimeException si ID introuvable")
    void updateSubscription_throwsWhenNotFound() {
        when(subscriptionRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> subscriptionService.updateSubscription(99L, new Subscription()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Modification impossible");
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteSubscription — appelle deleteById")
    void deleteSubscription_callsDeleteById() {
        doNothing().when(subscriptionRepository).deleteById(1L);

        subscriptionService.deleteSubscription(1L);

        verify(subscriptionRepository).deleteById(1L);
    }

    // ─── ENRICH ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("enrich — Hydratation des données utilisateur")
    class EnrichTests {

        @Test
        @DisplayName("enrich — remplit userName depuis 'name'")
        void enrich_fillsUserNameFromName() {
            Subscription sub = Subscription.builder().userId(1L).build();
            when(userClient.getUser(1L)).thenReturn(Map.of("name", "Ali Trabelsi", "email", "ali@test.tn"));

            subscriptionService.enrich(sub);

            assertThat(sub.getUserName()).isEqualTo("Ali Trabelsi");
            assertThat(sub.getUserEmail()).isEqualTo("ali@test.tn");
        }

        @Test
        @DisplayName("enrich — remplit userName depuis 'fullName' si 'name' absent")
        void enrich_fillsUserNameFromFullName() {
            Subscription sub = Subscription.builder().userId(1L).build();
            when(userClient.getUser(1L)).thenReturn(Map.of("fullName", "Sana Mansour", "email", "sana@test.tn"));

            subscriptionService.enrich(sub);

            assertThat(sub.getUserName()).isEqualTo("Sana Mansour");
        }

        @Test
        @DisplayName("enrich — ne fait rien si userId est null")
        void enrich_doesNothingWhenUserIdNull() {
            Subscription sub = Subscription.builder().build(); // userId = null

            subscriptionService.enrich(sub);

            verify(userClient, never()).getUser(any());
        }

        @Test
        @DisplayName("enrich — ne fait rien si UserClient retourne null")
        void enrich_doesNothingWhenUserClientReturnsNull() {
            Subscription sub = Subscription.builder().userId(1L).build();
            when(userClient.getUser(1L)).thenReturn(null);

            subscriptionService.enrich(sub);

            assertThat(sub.getUserName()).isNull();
            assertThat(sub.getUserEmail()).isNull();
        }
    }
}
