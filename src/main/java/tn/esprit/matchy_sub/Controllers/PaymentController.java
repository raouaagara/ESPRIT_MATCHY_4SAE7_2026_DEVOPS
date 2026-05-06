package tn.esprit.matchy_sub.Controllers;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.matchy_sub.entities.Payment;
import tn.esprit.matchy_sub.entities.PaymentMethod;
import tn.esprit.matchy_sub.entities.Subscription;
import tn.esprit.matchy_sub.repositories.SubscriptionRepository;
import tn.esprit.matchy_sub.services.EmailService;
import tn.esprit.matchy_sub.services.PaymentImp;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@AllArgsConstructor
public class PaymentController {
    public final PaymentImp paymentImp;
    public final EmailService emailService;
    public final SubscriptionRepository subscriptionRepository;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Payment payment = new Payment();

            if (body.get("amount") != null) {
                payment.setAmount(Double.parseDouble(body.get("amount").toString()));
            }
            payment.setCurrency(body.getOrDefault("currency", "TND").toString());

            if (body.get("transactionRef") != null) {
                payment.setTransactionRef(body.get("transactionRef").toString());
            }
            if (body.get("cardholderName") != null) {
                payment.setCardholderName(body.get("cardholderName").toString());
            }
            if (body.get("rib") != null) {
                String rib = body.get("rib").toString().replaceAll("\\s", "");
                if (!rib.isEmpty()) {
                    payment.setRib(rib.length() > 50 ? rib.substring(0, 50) : rib);
                }
            }
            if (body.get("bankName") != null) {
                payment.setBankName(body.get("bankName").toString());
            }
            if (body.get("accountHolder") != null) {
                payment.setAccountHolder(body.get("accountHolder").toString());
            }

            if (body.get("method") != null) {
                try {
                    payment.setMethod(PaymentMethod.valueOf(body.get("method").toString().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    payment.setMethod(PaymentMethod.CARD);
                }
            }

            if (body.get("subscription") instanceof Map) {
                Map<?, ?> subMap = (Map<?, ?>) body.get("subscription");
                if (subMap.get("id") != null) {
                    Long subId = Long.parseLong(subMap.get("id").toString());
                    Subscription sub = subscriptionRepository.findById(subId).orElse(null);
                    payment.setSubscription(sub);
                }
            }

            if (body.get("userId") != null) {
                payment.setUserId(Long.parseLong(body.get("userId").toString()));
            }

            if (body.get("promoCode") != null) {
                payment.setPromoCode(body.get("promoCode").toString());
            }
            if (body.get("discountAmountTnd") != null) {
                payment.setDiscountAmountTnd(Double.parseDouble(body.get("discountAmountTnd").toString()));
            }
            // Store user info directly — no Feign lookup needed
            if (body.get("userName") != null) {
                payment.setUserName(body.get("userName").toString());
            }
            if (body.get("userEmail") != null) {
                payment.setUserEmail(body.get("userEmail").toString());
            }

            Payment saved = paymentImp.create(payment);

            try {
                emailService.sendPaymentReceivedEmail(saved);
            } catch (Exception emailEx) {
                System.err.println("[PaymentController] Email send failed: " + emailEx.getMessage());
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Payment creation failed: " + e.getMessage());
        }
    }

    @GetMapping
    public List<Payment> getAll() {
        return paymentImp.getAll();
    }

    @GetMapping("/{id}")
    public Payment getById(@PathVariable Long id) {
        return paymentImp.getById(id);
    }

    @GetMapping("/pending")
    public List<Payment> getPendingPayments() {
        return paymentImp.getPendingPayments();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approvePayment(
            @PathVariable Long id,
            @RequestParam(required = false) Long adminId,
            @RequestParam(required = false) String adminNotes) {
        try {
            Payment approved = paymentImp.approvePayment(id, adminId, adminNotes);
            try { emailService.sendPaymentApprovedEmail(approved); }
            catch (Exception e) { System.err.println("[PaymentController] approval email failed: " + e.getMessage()); }
            return ResponseEntity.ok(approved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectPayment(
            @PathVariable Long id,
            @RequestParam(required = false) Long adminId,
            @RequestParam String reason) {
        try {
            Payment rejected = paymentImp.rejectPayment(id, adminId, reason);
            try { emailService.sendPaymentRejectedEmail(rejected, reason); }
            catch (Exception e) { System.err.println("[PaymentController] rejection email failed: " + e.getMessage()); }
            return ResponseEntity.ok(rejected);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        paymentImp.delete(id);
    }
}
