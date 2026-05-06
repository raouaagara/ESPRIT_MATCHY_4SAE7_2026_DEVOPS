package tn.esprit.matchy_sub.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@EqualsAndHashCode
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double price;
    private String currency;
    private String billingCycle;

    private String description;

    private Integer durationInDays;

    private Integer maxProjects;

    private Integer maxBids;

    private Boolean active;

    @Enumerated(EnumType.STRING)
    private PlanType name;
}
