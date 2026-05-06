package org.example.contentservice.controller;

import org.example.contentservice.entities.ContentTranslation;
import org.example.contentservice.services.interfaces.ITranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/Translation")
public class TranslationController {

    @Autowired
    private ITranslationService translationService;

    @PostMapping("/translate/{contentId}/{targetLanguage}")
    public ContentTranslation translateContent(
            @PathVariable Integer contentId,
            @PathVariable String targetLanguage) {
        return translationService.translateContent(contentId, targetLanguage);
    }

    @GetMapping("/{contentId}/{languageCode}")
    public ContentTranslation getTranslation(
            @PathVariable Integer contentId,
            @PathVariable String languageCode) {
        return translationService.getTranslation(contentId, languageCode);
    }

    @GetMapping("/all/{contentId}")
    public List<ContentTranslation> getAllTranslations(@PathVariable Integer contentId) {
        return translationService.getAllTranslations(contentId);
    }

    @GetMapping("/supported-languages")
    public List<String> getSupportedLanguages() {
        return translationService.getSupportedLanguages();
    }
}