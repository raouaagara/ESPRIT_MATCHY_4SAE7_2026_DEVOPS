package tn.esprit.matchy_sub.services;

import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import tn.esprit.matchy_sub.client.UserClient;
import tn.esprit.matchy_sub.entities.Payment;
import tn.esprit.matchy_sub.entities.Subscription;

import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

@Service
@AllArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    private final UserClient userClient;
    private final String supportEmail = "support@matchy.tn";
    private final String frontendUrl = "http://localhost:4200";

    public void sendPaymentReceivedEmail(Payment payment) {
        try {
            Subscription subscription = payment.getSubscription();
            if (subscription == null || payment.getUserId() == null) {
                log.warn("sendPaymentReceivedEmail: missing subscription or userId");
                return;
            }
            UserInfo info = fetchUserInfo(payment.getUserId());
            if (info.email == null) {
                log.warn("sendPaymentReceivedEmail: could not fetch user email for userId: {}", payment.getUserId());
                return;
            }
            String subject = "⏳ Paiement reçu — En attente de confirmation | Matchy";
            sendHtmlEmail(info.email, subject, buildPendingTemplate(payment, subscription, info.firstName));
        } catch (Exception e) {
            log.error("Error sending payment received email", e);
        }
    }

    public void sendPaymentApprovedEmail(Payment payment) {
        try {
            Subscription subscription = payment.getSubscription();
            if (subscription == null || payment.getUserId() == null) return;
            UserInfo info = fetchUserInfo(payment.getUserId());
            if (info.email == null) return;
            String planName = subscription.getPlan() != null ? subscription.getPlan().getName().name() : "Matchy";
            String subject = "✅ Paiement confirmé — Votre abonnement " + planName + " est actif !";
            sendHtmlEmail(info.email, subject, buildApprovedTemplate(payment, subscription, info.firstName, planName));
        } catch (Exception e) {
            log.error("Error sending payment approved email", e);
        }
    }

    public void sendPaymentRejectedEmail(Payment payment, String reason) {
        try {
            Subscription subscription = payment.getSubscription();
            if (subscription == null || payment.getUserId() == null) return;
            UserInfo info = fetchUserInfo(payment.getUserId());
            if (info.email == null) return;
            String planName = subscription.getPlan() != null ? subscription.getPlan().getName().name() : "Matchy";
            String subject = "❌ Paiement non approuvé — " + planName + " | Matchy";
            sendHtmlEmail(info.email, subject, buildRejectedTemplate(payment, subscription, info.firstName, planName, reason));
        } catch (Exception e) {
            log.error("Error sending payment rejected email", e);
        }
    }

    private static class UserInfo {
        String email;
        String firstName;
    }

    private UserInfo fetchUserInfo(Long userId) {
        UserInfo info = new UserInfo();
        info.firstName = "User";
        Map<String, Object> u = userClient.getUser(userId);
        if (u != null) {
            Object email = u.get("email");
            if (email != null) info.email = String.valueOf(email);
            Object name = u.getOrDefault("name", u.get("fullName"));
            if (name != null) {
                String full = String.valueOf(name);
                int sp = full.indexOf(' ');
                info.firstName = sp > 0 ? full.substring(0, sp) : full;
            }
        }
        return info;
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("Matchy <" + supportEmail + ">");
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String formatDate(java.time.LocalDateTime dt) {
        if (dt == null) return "—";
        return dt.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy", Locale.ENGLISH));
    }

    private String formatAmount(double amount, String currency) {
        return String.format("%.2f %s", amount, currency != null ? currency : "TND");
    }

    private String txnRef(Payment payment) {
        return payment.getTransactionRef() != null
                ? "#" + payment.getTransactionRef()
                : "#TXN-" + payment.getId();
    }

    private String methodLabel(Payment payment) {
        if (payment.getMethod() == null) return "Bank Transfer";
        return switch (payment.getMethod().name().toUpperCase()) {
            case "CARD" -> "Visa / Mastercard";
            case "BANK_TRANSFER" -> "Virement bancaire";
            case "MOBILE" -> "Paiement mobile";
            case "PAYPAL" -> "PayPal";
            default -> payment.getMethod().name();
        };
    }

    private String wrapEmail(String headerColor, String headerContent, String bodyContent) {
        return ("<!DOCTYPE html><html><head><meta charset='UTF-8'/>"
                + "<style>body{margin:0;padding:0;background:#f4f4f4;font-family:Segoe UI,Arial,sans-serif;}"
                + ".wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);}"
                + ".header{background:" + headerColor + ";padding:40px 32px;text-align:center;color:#fff;}"
                + ".header h1{margin:0 0 6px;font-size:26px;}"
                + ".body{padding:32px;}"
                + ".divider{border:none;border-top:1px solid #e8e8e8;margin:20px 0;}"
                + ".amount-label{font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;}"
                + ".amount-value{font-size:36px;font-weight:700;color:" + headerColor + ";margin:4px 0 24px;}"
                + ".details-table{width:100%;border-collapse:collapse;}"
                + ".details-table tr td{padding:10px 0;font-size:14px;border-bottom:1px solid #f0f0f0;}"
                + ".details-table .label{color:#666;}.details-table .value{text-align:right;color:#222;font-weight:500;}"
                + ".btn{display:block;width:100%;box-sizing:border-box;background:" + headerColor + ";color:#fff;text-align:center;padding:16px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:700;margin-top:28px;}"
                + ".footer{text-align:center;padding:20px 32px 28px;font-size:12px;color:#aaa;}"
                + "</style></head><body><div class='wrapper'>"
                + "<div class='header'>" + headerContent + "</div>"
                + "<div class='body'>" + bodyContent + "</div>"
                + "<div class='footer'>Questions? Contact us at " + supportEmail + "<br/>&copy; 2026 Matchy Inc.</div>"
                + "</div></body></html>");
    }

    private String buildApprovedTemplate(Payment payment, Subscription sub, String firstName, String planName) {
        String header = "<h1>Payment Confirmed!</h1><p>Your transaction has been processed successfully</p>";
        String endDate = sub.getEndDate() != null ? formatDate(sub.getEndDate()) : "—";
        String body = "<p>Hi <strong>" + firstName + "</strong>, thank you for your payment.</p>"
                + "<hr class='divider'/><div class='amount-label'>AMOUNT PAID</div>"
                + "<div class='amount-value'>" + formatAmount(payment.getAmount(), payment.getCurrency()) + "</div>"
                + "<table class='details-table'>"
                + "<tr><td class='label'>Plan</td><td class='value'>" + planName + "</td></tr>"
                + "<tr><td class='label'>Transaction ID</td><td class='value'>" + txnRef(payment) + "</td></tr>"
                + "<tr><td class='label'>Date</td><td class='value'>" + formatDate(payment.getApprovedAt()) + "</td></tr>"
                + "<tr><td class='label'>Payment method</td><td class='value'>" + methodLabel(payment) + "</td></tr>"
                + "<tr><td class='label'>Subscription valid until</td><td class='value'>" + endDate + "</td></tr>"
                + "<tr><td class='label'>Status</td><td class='value'>Paid ✓</td></tr></table>"
                + "<a href='" + frontendUrl + "/my-subscription' class='btn'>View My Subscription</a>";
        return wrapEmail("#2e7d5e", header, body);
    }

    private String buildPendingTemplate(Payment payment, Subscription sub, String firstName) {
        String planName = sub.getPlan() != null ? sub.getPlan().getName().name() : "Matchy";
        String header = "<h1>Payment Received!</h1><p>Your payment is under review — we'll confirm within 24h</p>";
        String body = "<p>Hi <strong>" + firstName + "</strong>, we've received your payment.</p>"
                + "<hr class='divider'/><div class='amount-label'>AMOUNT SUBMITTED</div>"
                + "<div class='amount-value'>" + formatAmount(payment.getAmount(), payment.getCurrency()) + "</div>"
                + "<table class='details-table'>"
                + "<tr><td class='label'>Plan</td><td class='value'>" + planName + "</td></tr>"
                + "<tr><td class='label'>Transaction ID</td><td class='value'>" + txnRef(payment) + "</td></tr>"
                + "<tr><td class='label'>Date</td><td class='value'>" + formatDate(payment.getTransactionDate()) + "</td></tr>"
                + "<tr><td class='label'>Payment method</td><td class='value'>" + methodLabel(payment) + "</td></tr>"
                + "<tr><td class='label'>Status</td><td class='value'>Pending review ⏳</td></tr></table>"
                + "<a href='" + frontendUrl + "/my-subscription' class='btn'>View My Subscription</a>";
        return wrapEmail("#d97706", header, body);
    }

    private String buildRejectedTemplate(Payment payment, Subscription sub, String firstName, String planName, String reason) {
        String header = "<h1>Payment Not Approved</h1><p>Unfortunately we could not validate your payment</p>";
        String body = "<p>Hi <strong>" + firstName + "</strong>, your payment could not be approved.</p>"
                + "<hr class='divider'/><div class='amount-label'>AMOUNT</div>"
                + "<div class='amount-value'>" + formatAmount(payment.getAmount(), payment.getCurrency()) + "</div>"
                + "<table class='details-table'>"
                + "<tr><td class='label'>Plan</td><td class='value'>" + planName + "</td></tr>"
                + "<tr><td class='label'>Transaction ID</td><td class='value'>" + txnRef(payment) + "</td></tr>"
                + "<tr><td class='label'>Date</td><td class='value'>" + formatDate(payment.getTransactionDate()) + "</td></tr>"
                + "<tr><td class='label'>Payment method</td><td class='value'>" + methodLabel(payment) + "</td></tr>"
                + "<tr><td class='label'>Reason</td><td class='value'>" + (reason != null ? reason : "Contact support for details") + "</td></tr>"
                + "<tr><td class='label'>Status</td><td class='value'>Not approved ✗</td></tr></table>"
                + "<a href='" + frontendUrl + "/subscription-management' class='btn'>Retry Payment</a>";
        return wrapEmail("#dc2626", header, body);
    }
}
