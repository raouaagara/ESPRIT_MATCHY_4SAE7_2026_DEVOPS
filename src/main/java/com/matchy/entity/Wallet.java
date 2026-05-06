package com.matchy.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Double solde = 0.0;

    @Column(nullable = false)
    private Double soldeBloque = 0.0;

    @Column(nullable = false)
    private String devise = "TND";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ─── Constructeurs ───
    public Wallet() {}

    public Wallet(User user) {
        this.user = user;
        this.solde = 0.0;
        this.soldeBloque = 0.0;
        this.devise = "TND";
    }

    // ─── Getters & Setters ───
    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Double getSolde() { return solde; }
    public void setSolde(Double solde) { this.solde = solde; }
    public Double getSoldeBloque() { return soldeBloque; }
    public void setSoldeBloque(Double soldeBloque) { this.soldeBloque = soldeBloque; }
    public String getDevise() { return devise; }
    public void setDevise(String devise) { this.devise = devise; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}