package com.matchy.controller;

import com.matchy.entity.ChatRequest;
import com.matchy.entity.ChatResponse;
import com.matchy.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class ChatbotController {

    @Autowired
    private GeminiService geminiService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        try {
            if (request.getHistory() == null || request.getHistory().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ChatResponse("L'historique de conversation est vide.", false));
            }

            String reply = geminiService.sendMessage(request.getHistory());
            return ResponseEntity.ok(new ChatResponse(reply));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ChatResponse("Erreur serveur : " + e.getMessage(), false));
        }
    }

    // Endpoint de santé pour vérifier que le backend tourne
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Matchy Chatbot Backend is running ✅");
    }
}