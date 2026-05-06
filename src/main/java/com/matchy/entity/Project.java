package com.matchy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Long clientId;

    private String clientName;
    private String clientEmail;

    private String category;

    @Convert(converter = ProjectStatusConverter.class)
    private ProjectStatus status = ProjectStatus.OPEN;

    private Double budget;
    private String budgetType;
    private String currency = "TND";

    @ElementCollection
    @CollectionTable(name = "project_skills", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "skill")
    private List<String> requiredSkills;

    private String deadline;
    private Integer proposalsCount = 0;
    private String duration;
    private String experienceLevel;
    private Double rating;

    // ── Delivery fields ──────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String deliveryLink;

    @Column(columnDefinition = "TEXT")
    private String deliveryMessage;

    @Column(columnDefinition = "TEXT")
    private String clientFeedback;

    private LocalDateTime createdAt;
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

    public enum ProjectStatus {
        OPEN, IN_PROGRESS, DELIVERED, COMPLETED, CANCELLED, DRAFT
    }

    // ── Getters & Setters ────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public ProjectStatus getStatus() { return status; }
    public void setStatus(ProjectStatus status) { this.status = status; }
    public Double getBudget() { return budget; }
    public void setBudget(Double budget) { this.budget = budget; }
    public String getBudgetType() { return budgetType; }
    public void setBudgetType(String budgetType) { this.budgetType = budgetType; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> skills) { this.requiredSkills = skills; }
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    public Integer getProposalsCount() { return proposalsCount; }
    public void setProposalsCount(Integer count) { this.proposalsCount = count; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String level) { this.experienceLevel = level; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    // delivery getters/setters
    public String getDeliveryLink() { return deliveryLink; }
    public void setDeliveryLink(String deliveryLink) { this.deliveryLink = deliveryLink; }
    public String getDeliveryMessage() { return deliveryMessage; }
    public void setDeliveryMessage(String deliveryMessage) { this.deliveryMessage = deliveryMessage; }
    public String getClientFeedback() { return clientFeedback; }
    public void setClientFeedback(String clientFeedback) { this.clientFeedback = clientFeedback; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}