package com.matchy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "badges")
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BadgeType type;

    private String title;
    private String description;
    private String icon;
    private LocalDateTime earnedAt;

    @PrePersist
    protected void onCreate() { earnedAt = LocalDateTime.now(); }

    public enum BadgeType {
        RISING_TALENT,   // 1er projet complété
        EXPERIENCED,     // 5 projets complétés
        EXPERT,          // 10 projets complétés
        ELITE,           // 20 projets + rating >= 4.8
        TOP_RATED,       // rating >= 4.5
        VERIFIED_PRO,    // compte vérifié
        FIRST_PROPOSAL,  // 1ère proposition soumise
        PROLIFIC,        // 20+ propositions soumises
        HIGH_ACCEPTANCE, // taux d'acceptation >= 50%
        FAST_STARTER     // 3 propositions dans la 1ère semaine
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public BadgeType getType() { return type; }
    public void setType(BadgeType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public LocalDateTime getEarnedAt() { return earnedAt; }
}