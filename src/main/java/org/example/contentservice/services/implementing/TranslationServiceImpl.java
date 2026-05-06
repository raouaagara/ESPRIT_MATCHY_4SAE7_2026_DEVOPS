package org.example.contentservice.services.implementing;

import org.example.contentservice.entities.Content;
import org.example.contentservice.entities.ContentTranslation;
import org.example.contentservice.repositories.ContentRepository;
import org.example.contentservice.repositories.ContentTranslationRepository;
import org.example.contentservice.services.interfaces.ITranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TranslationServiceImpl implements ITranslationService {

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private ContentTranslationRepository translationRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String TRANSLATION_API_URL = "https://api.mymemory.translated.net/get";

    private static final List<String> SUPPORTED_LANGUAGES = Arrays.asList(
            "en", "fr", "es", "de", "it", "pt", "ar", "zh", "ja", "ru"
    );

    @Override
    public ContentTranslation translateContent(Integer contentId, String targetLanguage) {
        // Vérifier si la traduction existe déjà
        Optional<ContentTranslation> existingTranslation =
                translationRepository.findByContent_ContentIdAndLanguageCode(contentId, targetLanguage);

        if (existingTranslation.isPresent()) {
            System.out.println("✅ Translation already exists for " + targetLanguage);
            ContentTranslation existing = existingTranslation.get();

            // Synchroniser contentId
            if (existing.getContent() != null) {
                existing.setContentId(existing.getContent().getContentId());
            }

            return existing;
        }

        // Récupérer le contenu original
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Content not found"));

        System.out.println("🌍 Translating content #" + contentId + " to " + targetLanguage + "...");

        // Créer une nouvelle traduction
        ContentTranslation translation = new ContentTranslation();
        translation.setContent(content);
        translation.setLanguageCode(targetLanguage);

        try {
            // Traduire le titre
            String translatedTitle = translateText(content.getTitle(), "en", targetLanguage);
            translation.setTranslatedTitle(translatedTitle);

            // Traduire la description
            String translatedDescription = translateText(content.getDescription(), "en", targetLanguage);
            translation.setTranslatedDescription(translatedDescription);

            System.out.println("✅ Translation completed!");
            System.out.println("   Title: " + translatedTitle);
            System.out.println("   Description: " + translatedDescription.substring(0, Math.min(50, translatedDescription.length())) + "...");

        } catch (Exception e) {
            System.err.println("❌ Error during translation: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Translation failed: " + e.getMessage());
        }

        // Sauvegarder la traduction
        ContentTranslation saved = translationRepository.save(translation);

        // Synchroniser contentId après sauvegarde
        saved.setContentId(content.getContentId());

        return saved;
    }

    private String translateText(String text, String sourceLanguage, String targetLanguage) {
        try {
            // Si source = target, pas besoin de traduire
            if (sourceLanguage.equals(targetLanguage)) {
                System.out.println("ℹ️ Source and target language are the same, skipping translation");
                return text;
            }

            // Construire l'URL de l'API
            String url = UriComponentsBuilder
                    .fromHttpUrl(TRANSLATION_API_URL)
                    .queryParam("q", text)
                    .queryParam("langpair", sourceLanguage + "|" + targetLanguage)
                    .build()
                    .toUriString();

            System.out.println("🔗 API Call: " + sourceLanguage + " → " + targetLanguage);

            // Appeler l'API de traduction
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("responseData")) {
                Map<String, Object> responseData = (Map<String, Object>) response.get("responseData");
                String translatedText = (String) responseData.get("translatedText");

                if (translatedText != null && !translatedText.isEmpty()
                        && !translatedText.toUpperCase().contains("INVALID")) {
                    System.out.println("✅ Translated successfully");
                    return translatedText;
                }
            }

            System.err.println("⚠️ Translation API returned no result, using original text");
            return text;

        } catch (Exception e) {
            System.err.println("⚠️ API Error: " + e.getMessage());
            return text;
        }
    }

    @Override
    public ContentTranslation getTranslation(Integer contentId, String languageCode) {
        Optional<ContentTranslation> translationOpt =
                translationRepository.findByContent_ContentIdAndLanguageCode(contentId, languageCode);

        if (translationOpt.isPresent()) {
            ContentTranslation translation = translationOpt.get();

            // Synchroniser contentId
            if (translation.getContent() != null) {
                translation.setContentId(translation.getContent().getContentId());
            }

            return translation;
        }

        return null;
    }

    @Override
    public List<ContentTranslation> getAllTranslations(Integer contentId) {
        List<ContentTranslation> translations = translationRepository.findByContent_ContentId(contentId);

        // Synchroniser contentId pour toutes les traductions
        for (ContentTranslation translation : translations) {
            if (translation.getContent() != null) {
                translation.setContentId(translation.getContent().getContentId());
            }
        }

        return translations;
    }

    @Override
    public List<String> getSupportedLanguages() {
        return SUPPORTED_LANGUAGES;
    }
}