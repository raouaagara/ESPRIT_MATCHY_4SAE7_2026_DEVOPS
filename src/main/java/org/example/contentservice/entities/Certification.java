package org.example.contentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@ToString(exclude = {"user", "content", "assessment"})
@AllArgsConstructor
@NoArgsConstructor
public class Certification implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer certificationId;

    private Float score;

    private LocalDateTime issuedAt;

    private String validity;

    private String verifiedBy;

    // ✅ Seulement avec EAGER, pas de @JoinColumn
    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"assessment", "hibernateLazyInitializer", "handler"})
    private Content content;

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"content", "hibernateLazyInitializer", "handler"})
    private Assessment assessment;

    @Transient
    private Integer userId;

    @Transient
    private Integer contentId;

    @Transient
    private Integer assessmentId;

    @PrePersist
    protected void onCreate() {
        if (issuedAt == null) {
            issuedAt = LocalDateTime.now();
        }
    }
}