package org.example.contentservice.services.interfaces;

import org.example.contentservice.entities.Favorite;
import org.example.contentservice.entities.Content;
import java.util.List;

public interface IFavoriteService {

    // Ajouter un favori
    Favorite addFavorite(String userId, Integer contentId);

    // Supprimer un favori
    void removeFavorite(String userId, Integer contentId);

    // Vérifier si un contenu est favori
    boolean isFavorite(String userId, Integer contentId);

    // Récupérer tous les favoris d'un utilisateur
    List<Favorite> getUserFavorites(String userId);

    // Récupérer les contenus favoris d'un utilisateur
    List<Content> getUserFavoriteContents(String userId);

    // Compter les favoris d'un utilisateur
    long countUserFavorites(String userId);
}