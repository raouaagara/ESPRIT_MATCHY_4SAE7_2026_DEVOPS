package org.example.contentservice.repositories;

import org.example.contentservice.entities.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Integer> {
    // Trouve un Assessment par contentId
    Optional<Assessment> findByContent_ContentId(Integer contentId);
}