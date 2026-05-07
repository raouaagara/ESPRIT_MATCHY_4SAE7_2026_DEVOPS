package com.matchy.controller;

import com.matchy.service.GeminiService;
import com.matchy.entity.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:4200")
public class AiController {

    @Autowired
    private GeminiService geminiService;

    @PostMapping("/generate-description")
    public ResponseEntity<?> generateDescription(@RequestBody Map<String, String> request) {
        try {
            String title    = request.getOrDefault("title", "");
            String category = request.getOrDefault("category", "");

            if (title.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Title is required"));
            }

            String prompt = String.format(
                "Write a professional project description for a freelance marketplace.\n" +
                "Project Title: %s\n" +
                "Category: %s\n\n" +
                "Requirements:\n" +
                "- 3-4 sentences max\n" +
                "- Professional and clear tone\n" +
                "- Mention expected deliverables\n" +
                "- End with required profile/skills\n" +
                "- Write in English only\n" +
                "- No intro like 'Here is a description', go straight to the point",
                title, category
            );

            String description = geminiService.sendMessage(
                List.of(new ChatMessage("user", prompt))
            );

            return ResponseEntity.ok(Map.of("description", description));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to generate description: " + e.getMessage()));
        }
    }
}