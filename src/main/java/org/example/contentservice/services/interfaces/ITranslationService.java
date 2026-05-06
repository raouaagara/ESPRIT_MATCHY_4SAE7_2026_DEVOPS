package org.example.contentservice.services.interfaces;

import org.example.contentservice.entities.ContentTranslation;

import java.util.List;

public interface ITranslationService {
    ContentTranslation translateContent(Integer contentId, String targetLanguage);
    ContentTranslation getTranslation(Integer contentId, String languageCode);
    List<ContentTranslation> getAllTranslations(Integer contentId);
    List<String> getSupportedLanguages();
}