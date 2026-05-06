package tn.esprit.matchy_sub.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.matchy_sub.client.UserClient;
import tn.esprit.matchy_sub.entities.*;
import tn.esprit.matchy_sub.repositories.PaymentRepository;
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
@DisplayName("PaymentImp — Tests CRUD + Logique Métier")
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private UserClient userClient;

    @InjectMocks
    private PaymentImp paymentService;

    private Payment pendingPayment;
    private Subscription subscription;
    private Plan proPlan;

    @BeforeEach
    void setUp() {
        proPlan = Plan.builder().id(2L).name(PlanType.PRO).price(29.0).build();

        subscription = Subscription.builder()
                .id(1L).userId(1L).plan(proPlan)
                .status(SubscriptionStatus.PENDING).build();

        pendingPayment = Payment.builder()
                .id(1L).userId(1L).amount(29.0).currency("TND")
                .method(PaymentMethod.CARD).status(PaymentStatus.PENDING)
                .subscription(subscription).build();
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create")
    class CreatePayment {

        @Test
        @DisplayName("create — définit transactionDate, submittedAt et status PENDING")
        void create_setsTimestampsAndPendingStatus() {
            Payment input = Payment.builder().userId(1L).amount(29.0).build();
            when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Payment result = paymentService.create(input);

            assertThat(result.getStatus()).isEqualTo(PaymentStatus.PENDING);
            assertThat(result.getTransactionDate()).isNotNull();
            assertThat(result.getSubmittedAt()).isNotNull();
            assertThat(result.getTransactionDate()).isBeforeOrEqualTo(LocalDateTime.now());
        }

        @Test
        @DisplayName("create — sauvegarde le paiement")
        void create_savesPayment() {
            when(paymentRepository.save(any())).thenReturn(pendingPayment);

            Payment result = paymentService.create(pendingPayment);

            assertThat(result).isNotNull();
            verify(paymentRepository).save(pendingPayment);
        }
    }

    // ─── APPROVE ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("approvePayment — Logique Métier Avancée")
    class ApprovePayment {

        @Test
        @DisplayName("approve — passe le paiement à COMPLETED")
        void approve_setsCompleted() {
            when(paymentRepository.findById(1L)).thenReturn(Optional.of(pendingPayment));
            when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            Payment result = paymentService.approvePayment(1L, 99L, "OK");

            assertThat(result.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
            assertThat(result.getApprovedAt()).isNotNull();
            assertThat(result.getAdminNotes()).isEqualTo("OK");
            assertThat(result.getApprovedByUserId()).isEqualTo(99L);
        }

        @Test
        @DisplayName("approve — met la subscription associée à ACTIVE")
        void approve_activatesLinkedSubscription() {
            when(paymentRepository.findById(1L)).thenReturn(Optional.of(pendingPayment));
            when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            paymentService.approvePayment(1L, null, null);

            assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
            verify(subscriptionRepository).save(subscription);
        }

        @Test
        @DisplayName("approve — paiement sans subscription → ne plante pas")
        void approve_noSubscription_doesNotThrow() {
            Payment paymentNoSub = Payment.builder()
                    .id(2L).userId(1L).amount(29.0)
                    .status(PaymentStatus.PENDING).build(); // subscription = null
            when(paymentRepository.findById(2L)).thenReturn(Optional.of(paymentNoSub));
            when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            assertThatCode(() -> paymentService.approvePayment(2L, null, null))
                    .doesNotThrowAnyException();
            verify(subscriptionRepository, never()).save(any());
        }

        @Test
        @DisplayName("approve — paiement introuvable → RuntimeException")
        void approve_throwsWhenNotFound() {
            when(paymentRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.approvePayment(99L, null, null))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Paiement non trouvé");
        }
    }

    // ─── REJECT ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("rejectPayment — Logique Métier Avancée")
    class RejectPayment {

        @Test
        @DisplayName("reject — passe le paiement à FAILED")
        void reject_setsFailed() {
            when(paymentRepository.findById(1L)).thenReturn(Optional.of(pendingPayment));
            when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            Payment result = paymentService.rejectPayment(1L, 99L, "Fraude détectée");

            assertThat(result.getStatus()).isEqualTo(PaymentStatus.FAILED);
            assertThat(result.getAdminNotes()).isEqualTo("Fraude détectée");
            assertThat(result.getApprovedByUserId()).isEqualTo(99L);
        }

        @Test
        @DisplayName("reject — ne modifie pas la subscription")
        void reject_doesNotChangeSubscriptionStatus() {
            when(paymentRepository.findById(1L)).thenReturn(Optional.of(pendingPayment));
            when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            paymentService.rejectPayment(1L, null, "Rejeté");

            assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.PENDING); // inchangé
            verify(subscriptionRepository, never()).save(any());
        }
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById / getAll / getPendingPayments")
    class ReadOperations {

        @Test
        @DisplayName("getById — retourne le paiement enrichi")
        void getById_returnsEnrichedPayment() {
            when(paymentRepository.findById(1L)).thenReturn(Optional.of(pendingPayment));
            when(userClient.getUser(1L)).thenReturn(Map.of("name", "Ahmed", "email", "ahmed@test.tn"));

            Payment result = paymentService.getById(1L);

            assertThat(result.getUserName()).isEqualTo("Ahmed");
            assertThat(result.getUserEmail()).isEqualTo("ahmed@test.tn");
        }

        @Test
        @DisplayName("getById — lève RuntimeException si introuvable")
        void getById_throwsWhenNotFound() {
            when(paymentRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.getById(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Paiement non trouvé");
        }

        @Test
        @DisplayName("getAll — retourne tous les paiements enrichis")
        void getAll_returnsAllEnriched() {
            Payment p2 = Payment.builder().id(2L).userId(2L).amount(69.0).build();
            when(paymentRepository.findAll()).thenReturn(Arrays.asList(pendingPayment, p2));
            when(userClient.getUser(anyLong())).thenReturn(null);

            List<Payment> result = paymentService.getAll();

            assertThat(result).hasSize(2);
            verify(userClient, times(2)).getUser(anyLong());
        }

        @Test
        @DisplayName("getPendingPayments — retourne uniquement les paiements PENDING")
        void getPendingPayments_returnsOnlyPending() {
            when(paymentRepository.findByStatus(PaymentStatus.PENDING))
                    .thenReturn(List.of(pendingPayment));
            when(userClient.getUser(anyLong())).thenReturn(null);

            List<Payment> result = paymentService.getPendingPayments();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(PaymentStatus.PENDING);
        }
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update — Logique Métier Avancée")
    class UpdatePayment {

        @Test
        @DisplayName("update — passage à COMPLETED active la subscription")
        void update_completedActivatesSubscription() {
            Payment updatedPayment = Payment.builder()
                    .id(1L).userId(1L).amount(29.0)
                    .status(PaymentStatus.COMPLETED)
                    .subscription(subscription).build();

            when(paymentRepository.existsById(1L)).thenReturn(true);
            when(paymentRepository.findById(1L)).thenReturn(Optional.of(pendingPayment));
            when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            paymentService.update(1L, updatedPayment);

            assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        }

        @Test
        @DisplayName("update — changement de montant met à jour priceAtPurchase de la subscription")
        void update_amountChangeUpdatesPriceAtPurchase() {
            subscription.setPriceAtPurchase(29.0);
            Payment updatedPayment = Payment.builder()
                    .id(1L).userId(1L).amount(39.0) // nouveau montant
                    .status(PaymentStatus.PENDING)
                    .subscription(subscription).build();

            when(paymentRepository.existsById(1L)).thenReturn(true);
            when(paymentRepository.findById(1L)).thenReturn(Optional.of(pendingPayment));
            when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userClient.getUser(anyLong())).thenReturn(null);

            paymentService.update(1L, updatedPayment);

            assertThat(subscription.getPriceAtPurchase()).isEqualTo(39.0);
        }

        @Test
        @DisplayName("update — ID inexistant → RuntimeException")
        void update_throwsWhenNotFound() {
            when(paymentRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> paymentService.update(99L, new Payment()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("inexistant");
        }
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete — appelle deleteById si le paiement existe")
    void delete_callsDeleteById() {
        when(paymentRepository.existsById(1L)).thenReturn(true);
        doNothing().when(paymentRepository).deleteById(1L);

        paymentService.delete(1L);

        verify(paymentRepository).deleteById(1L);
    }

    @Test
    @DisplayName("delete — lève RuntimeException si ID inconnu")
    void delete_throwsWhenNotFound() {
        when(paymentRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> paymentService.delete(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Impossible de supprimer");
    }
}
