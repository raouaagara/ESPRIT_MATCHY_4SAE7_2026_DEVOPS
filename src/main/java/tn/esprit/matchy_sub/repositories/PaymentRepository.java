package tn.esprit.matchy_sub.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.matchy_sub.entities.Payment;
import tn.esprit.matchy_sub.entities.PaymentStatus;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStatus(PaymentStatus status);
}
