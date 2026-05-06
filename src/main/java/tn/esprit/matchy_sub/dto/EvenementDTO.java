package tn.esprit.matchy_sub.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lightweight DTO representing an event as returned by event-service.
 * Only the fields needed by subscription-service are mapped; unknown fields are ignored.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EvenementDTO {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime date;
    private String location;
    private String type;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
