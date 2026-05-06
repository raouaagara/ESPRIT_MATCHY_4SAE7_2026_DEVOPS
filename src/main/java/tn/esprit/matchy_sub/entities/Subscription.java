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
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double priceAtPurchase;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private Boolean isTrial;
    private LocalDateTime trialStartDate;
    private LocalDateTime trialEndDate;

    /** ID of user from matchy_db (no FK — separate microservice). */
    private Long userId;

    @ManyToOne
    @JsonIgnoreProperties({"subscriptions"})
    private Plan plan;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SubscriptionStatus status;

    /** Stored at subscription creation time. */
    private String userName;

    /** Stored at subscription creation time. */
    private String userEmail;
}
