package com.matchy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private Double commission = 0.0;

    @Column(nullable = false)
    private Double montantNet;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    private TransactionStatut statut;

    private String description;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public enum TransactionType {
        ESCROW,
        PAIEMENT,
        REMBOURSEMENT,
        COMMISSION
    }

    public enum TransactionStatut {
        PENDING,
        COMPLETED,
        FAILED,
        REFUNDED
    }

    // ─── Constructeurs ───
    public Transaction() {}

    public Transaction(User sender, User receiver, Project project,
                       Double montant, Double commission, Double montantNet,
                       TransactionType type, TransactionStatut statut, String description) {
        this.sender = sender;
        this.receiver = receiver;
        this.project = project;
        this.montant = montant;
        this.commission = commission;
        this.montantNet = montantNet;
        this.type = type;
        this.statut = statut;
        this.description = description;
    }

    // ─── Getters & Setters ───
    public Long getId() { return id; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public User getReceiver() { return receiver; }
    public void setReceiver(User receiver) { this.receiver = receiver; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }
    public Double getCommission() { return commission; }
    public void setCommission(Double commission) { this.commission = commission; }
    public Double getMontantNet() { return montantNet; }
    public void setMontantNet(Double montantNet) { this.montantNet = montantNet; }
    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }
    public TransactionStatut getStatut() { return statut; }
    public void setStatut(TransactionStatut statut) { this.statut = statut; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}