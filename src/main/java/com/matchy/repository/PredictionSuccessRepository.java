package com.matchy.repository;

import com.matchy.entity.PredictionSuccessEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PredictionSuccessRepository extends JpaRepository<PredictionSuccessEntity, Long> {

    // Trouver une prédiction par freelancer et projet
    Optional<PredictionSuccessEntity> findByFreelancerIdAndProjectId(
        Long freelancerId, Long projectId
    );

    // Toutes les prédictions d'un freelancer
    List<PredictionSuccessEntity> findByFreelancerId(Long freelancerId);

    // Toutes les prédictions d'un projet
    List<PredictionSuccessEntity> findByProjectId(Long projectId);

    // Meilleures prédictions d'un freelancer (score > 70)
    @Query("SELECT p FROM PredictionSuccessEntity p WHERE p.freelancerId = :freelancerId AND p.finalScore >= 70 ORDER BY p.finalScore DESC")
    List<PredictionSuccessEntity> findBestPredictions(@Param("freelancerId") Long freelancerId);

    // Supprimer une prédiction par freelancer et projet
    void deleteByFreelancerIdAndProjectId(Long freelancerId, Long projectId);
}