package org.example.contentservice.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@ToString(exclude = "assessment")
@AllArgsConstructor
@NoArgsConstructor
public class Content implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer contentId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private ContentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentLevel level;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Integer authorId;

    @OneToOne(mappedBy = "content", cascade = CascadeType.ALL)
    @JsonManagedReference
    private Assessment assessment;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (level == null) {
            level = ContentLevel.DEBUTANT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (level == null) {
            level = ContentLevel.DEBUTANT;
        }
    }

    public enum ContentType {
        COURS, ARTICLE, VIDEO
    }

    public enum ContentLevel {
        DEBUTANT, INTERMEDIAIRE, AVANCE
    }
}