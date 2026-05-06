package tn.esprit.matchy_sub.services;

import tn.esprit.matchy_sub.entities.Payment;

import java.util.List;

public interface IPayment {
    Payment create(Payment payment);
    Payment update(Long id, Payment payment);
    Payment getById(Long id);
    List<Payment> getAll();
    void delete(Long id);
    Payment approvePayment(Long id, Long adminId, String adminNotes);
    Payment rejectPayment(Long id, Long adminId, String reason);
    List<Payment> getPendingPayments();
}
