package tn.esprit.matchy_sub.services;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.matchy_sub.client.UserClient;
import tn.esprit.matchy_sub.entities.Payment;
import tn.esprit.matchy_sub.entities.PaymentStatus;
import tn.esprit.matchy_sub.entities.Subscription;
import tn.esprit.matchy_sub.entities.SubscriptionStatus;
import tn.esprit.matchy_sub.repositories.PaymentRepository;
import tn.esprit.matchy_sub.repositories.SubscriptionRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class PaymentImp implements IPayment {
    public final PaymentRepository paymentRepository;
    public final SubscriptionRepository subscriptionRepository;
    public final UserClient userClient;

    @Override
    @Transactional
    public Payment create(Payment payment) {
        payment.setTransactionDate(LocalDateTime.now());
        payment.setSubmittedAt(LocalDateTime.now());
        payment.setStatus(PaymentStatus.PENDING);
        return paymentRepository.save(payment);
    }

    @Override
    @Transactional
    public Payment approvePayment(Long id, Long adminId, String adminNotes) {
        Payment payment = getById(id);
        if (adminId != null) payment.setApprovedByUserId(adminId);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setApprovedAt(LocalDateTime.now());
        payment.setAdminNotes(adminNotes);
        Payment approved = paymentRepository.save(payment);

        if (payment.getSubscription() != null) {
            Subscription sub = payment.getSubscription();
            sub.setStatus(SubscriptionStatus.ACTIVE);
            subscriptionRepository.save(sub);
        }
        enrich(approved);
        return approved;
    }

    @Override
    @Transactional
    public Payment rejectPayment(Long id, Long adminId, String reason) {
        Payment payment = getById(id);
        if (adminId != null) payment.setApprovedByUserId(adminId);
        payment.setStatus(PaymentStatus.FAILED);
        payment.setApprovedAt(LocalDateTime.now());
        payment.setAdminNotes(reason);
        Payment rejected = paymentRepository.save(payment);
        enrich(rejected);
        return rejected;
    }

    @Override
    public List<Payment> getPendingPayments() {
        List<Payment> pending = paymentRepository.findByStatus(PaymentStatus.PENDING);
        pending.forEach(this::enrich);
        return pending;
    }

    @Override
    @Transactional
    public Payment update(Long id, Payment payment) {
        if (!paymentRepository.existsById(id)) {
            throw new RuntimeException("Paiement " + id + " inexistant");
        }
        Payment existing = getById(id);
        payment.setId(id);
        Payment updated = paymentRepository.save(payment);

        if (updated.getSubscription() != null) {
            Subscription sub = updated.getSubscription();
            if (updated.getStatus() == PaymentStatus.COMPLETED
                    && existing.getStatus() != PaymentStatus.COMPLETED) {
                sub.setStatus(SubscriptionStatus.ACTIVE);
                subscriptionRepository.save(sub);
            }
            if (updated.getAmount() != null && existing.getAmount() != null
                    && !updated.getAmount().equals(existing.getAmount())) {
                sub.setPriceAtPurchase(updated.getAmount());
                subscriptionRepository.save(sub);
            }
        }
        enrich(updated);
        return updated;
    }

    @Override
    public Payment getById(Long id) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé : " + id));
        enrich(p);
        return p;
    }

    @Override
    public List<Payment> getAll() {
        List<Payment> all = paymentRepository.findAll();
        all.forEach(this::enrich);
        return all;
    }

    @Override
    public void delete(Long id) {
        if (!paymentRepository.existsById(id)) {
            throw new RuntimeException("Impossible de supprimer : ID inconnu");
        }
        paymentRepository.deleteById(id);
    }

    public void enrich(Payment p) {
        if (p == null || p.getUserId() == null) return;
        Map<String, Object> u = userClient.getUser(p.getUserId());
        if (u != null) {
            Object name = u.getOrDefault("name", u.get("fullName"));
            Object email = u.get("email");
            if (name != null) p.setUserName(String.valueOf(name));
            if (email != null) p.setUserEmail(String.valueOf(email));
        }
    }
}
