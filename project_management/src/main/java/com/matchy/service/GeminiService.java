package com.matchy.service;

import com.matchy.entity.ChatMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    
    @Value("${groq.api.key:}")
    private String groqApiKey;
    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT =
    "IMPORTANT: You must ALWAYS respond in English only. Never use French or Arabic.\n\n" +
        "You are Matchy AI, the intelligent support assistant of the Matchy platform — " +
        "a marketplace connecting freelancers with clients in Tunisia and the Maghreb.\n\n" +
        "YOUR ROLE:\n" +
        "- Help freelancers use the platform (proposals, profile, projects, payments)\n" +
        "- Give practical and personalized advice to succeed as a freelancer\n" +
        "- Answer questions about Matchy features\n" +
        "- Help write or improve proposals\n" +
        "- Advise on pricing (in TND)\n" +
        "- Explain processes (acceptance, rejection, payment, disputes)\n\n" +
        "YOUR STYLE:\n" +
        "- Warm, professional, encouraging\n" +
        "- Concise but complete answers\n" +
        "- Use emojis sparingly to structure your response\n" +
        "- Always respond in English only\n" +
        "- You know the Tunisian/Maghreb context (TND, local practices)\n\n" +
        "IMPORTANT: Never invent features. If you don't know, suggest contacting support@matchy.tn";

    public String sendMessage(List<ChatMessage> history) {
        try {
            // Build messages list
            List<Map<String, String>> messages = new ArrayList<>();

            // System prompt
            messages.add(Map.of(
                "role", "system",
                "content", SYSTEM_PROMPT
            ));

            // Conversation history
            for (ChatMessage msg : history) {
                messages.add(Map.of(
                    "role", msg.getRole().equals("assistant") ? "assistant" : "user",
                    "content", msg.getContent()
                ));
            }

            // Request body
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", "llama-3.3-70b-versatile");
            body.put("messages", messages);
            body.put("temperature", 0.7);
            body.put("max_tokens", 1000);

            String jsonBody = objectMapper.writeValueAsString(body);

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (groqApiKey == null || groqApiKey.isBlank()) {
                return "AI service is not configured yet. Please contact support@matchy.tn.";
            }
            headers.setBearerAuth(groqApiKey);

            ResponseEntity<String> response = restTemplate.postForEntity(
                GROQ_URL,
                new HttpEntity<>(jsonBody, headers),
                String.class
            );

            // Parse response
            Map<?, ?> responseMap = objectMapper.readValue(response.getBody(), Map.class);
            return extractText(responseMap);

        } catch (Exception e) {
    System.err.println("❌ ERREUR GROQ: " + e.getMessage());
    e.printStackTrace();
    return "🔌 Erreur inattendue. Veuillez réessayer ou contacter support@matchy.tn";
}
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<?, ?> responseBody) {
        if (responseBody == null) return "Désolé, pas de réponse.";

        List<Map<?, ?>> choices = (List<Map<?, ?>>) responseBody.get("choices");
        if (choices == null || choices.isEmpty()) return "Désolé, pas de réponse générée.";

        Map<?, ?> message = (Map<?, ?>) choices.get(0).get("message");
        if (message == null) return "Réponse vide.";

        return (String) message.get("content");
    }
}