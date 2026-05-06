package tn.esprit.matchy_sub.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@EqualsAndHashCode
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonIgnoreProperties({"payments"})
    private Subscription subscription;

    /** ID of user from matchy_db. */
    private Long userId;

    private Double amount;
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PaymentStatus status;

    private LocalDateTime transactionDate;

    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;

    /** Admin user ID who approved the payment (matchy_db). */
    private Long approvedByUserId;

    private String adminNotes;
    private String transactionRef;

    private String lastFourDigits;
    private String cardholderName;

    @Column(length = 50)
    private String rib;
    private String bankName;
    private String accountHolder;

    private String promoCode;
    private Double discountAmountTnd;

    /** Stored at payment creation time — no need for Feign lookup. */
    private String userName;

    /** Stored at payment creation time — no need for Feign lookup. */
    private String userEmail;
}
