package org.example.contentservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@ToString(exclude = "content")
@AllArgsConstructor
@NoArgsConstructor
public class ContentTranslation implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer translationId;

    @ManyToOne
    @JsonIgnore  // ← AJOUTE CETTE LIGNE
    private Content content;

    private String languageCode;

    private String translatedTitle;

    @Column(columnDefinition = "TEXT")
    private String translatedDescription;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Pour l'API Angular - on stocke juste l'ID
    @Transient
    private Integer contentId;

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