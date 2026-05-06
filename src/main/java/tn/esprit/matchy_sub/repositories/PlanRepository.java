package tn.esprit.matchy_sub.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.entities.PlanType;

import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {
    Optional<Plan> findByName(PlanType name);
}
