package org.example.contentservice.controller;

import org.example.contentservice.entities.Favorite;
import org.example.contentservice.entities.Content;
import org.example.contentservice.services.interfaces.IFavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/Favorite")
public class FavoriteController {

    @Autowired
    private IFavoriteService favoriteService;

    /**
     * Ajouter un contenu aux favoris
     */
    @PostMapping("/add/{userId}/{contentId}")
    public ResponseEntity<Favorite> addFavorite(
            @PathVariable String userId,
            @PathVariable Integer contentId
    ) {
        Favorite favorite = favoriteService.addFavorite(userId, contentId);
        return ResponseEntity.ok(favorite);
    }

    /**
     * Supprimer un contenu des favoris
     */
    @DeleteMapping("/remove/{userId}/{contentId}")
    public ResponseEntity<Map<String, String>> removeFavorite(
            @PathVariable String userId,
            @PathVariable Integer contentId
    ) {
        favoriteService.removeFavorite(userId, contentId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Removed from favorites");

        return ResponseEntity.ok(response);
    }

    /**
     * Vérifier si un contenu est favori
     */
    @GetMapping("/check/{userId}/{contentId}")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(
            @PathVariable String userId,
            @PathVariable Integer contentId
    ) {
        boolean isFavorite = favoriteService.isFavorite(userId, contentId);

        Map<String, Boolean> response = new HashMap<>();
        response.put("isFavorite", isFavorite);

        return ResponseEntity.ok(response);
    }

    /**
     * Récupérer tous les favoris d'un utilisateur
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Favorite>> getUserFavorites(@PathVariable String userId) {
        List<Favorite> favorites = favoriteService.getUserFavorites(userId);
        return ResponseEntity.ok(favorites);
    }

    /**
     * Récupérer les contenus favoris d'un utilisateur
     */
    @GetMapping("/user/{userId}/contents")
    public ResponseEntity<List<Content>> getUserFavoriteContents(@PathVariable String userId) {
        List<Content> contents = favoriteService.getUserFavoriteContents(userId);
        return ResponseEntity.ok(contents);
    }

    /**
     * Compter les favoris d'un utilisateur
     */
    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Map<String, Long>> countUserFavorites(@PathVariable String userId) {
        long count = favoriteService.countUserFavorites(userId);

        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ResponseEntity.ok(response);
    }
}