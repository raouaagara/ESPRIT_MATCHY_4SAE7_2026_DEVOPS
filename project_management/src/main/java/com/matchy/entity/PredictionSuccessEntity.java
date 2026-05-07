package com.matchy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "prediction_success")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionSuccessEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "freelancer_id", nullable = false)
    private Long freelancerId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "skills_score")
    private Double skillsScore;

    @Column(name = "experience_score")
    private Double experienceScore;

    @Column(name = "reputation_score")
    private Double reputationScore;

    @Column(name = "success_rate_score")
    private Double successRateScore;

    @Column(name = "availability_score")
    private Double availabilityScore;

    @Column(name = "final_score")
    private Double finalScore;

    @Column(name = "prediction_level")
    private String predictionLevel;

    @Column(name = "advice", columnDefinition = "TEXT")
    private String advice;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}