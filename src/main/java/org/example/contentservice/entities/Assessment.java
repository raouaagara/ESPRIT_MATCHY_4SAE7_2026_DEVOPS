package org.example.contentservice.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Getter
@Setter
@ToString(exclude = "content")
@AllArgsConstructor
@NoArgsConstructor
public class Assessment implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer assessmentId;

    @Column(columnDefinition = "TEXT")
    private String questions;

    private Float passingScore;

    private Integer duration;

    @OneToOne
    @JsonBackReference
    private Content content;

    @Transient
    private Integer contentId;
}