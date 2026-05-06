package org.example.contentservice.repositories;

import org.example.contentservice.entities.ContentTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentTranslationRepository extends JpaRepository<ContentTranslation, Integer> {
    List<ContentTranslation> findByContent_ContentId(Integer contentId);
    Optional<ContentTranslation> findByContent_ContentIdAndLanguageCode(Integer contentId, String languageCode);
}