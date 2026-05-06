package org.example.contentservice.repositories;

import org.example.contentservice.entities.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {

    // Trouver tous les favoris d'un utilisateur
    List<Favorite> findByUserId(String userId);

    // Vérifier si un contenu est déjà en favori
    Optional<Favorite> findByUserIdAndContentId(String userId, Integer contentId);

    // Supprimer un favori spécifique
    void deleteByUserIdAndContentId(String userId, Integer contentId);

    // Compter les favoris d'un utilisateur
    long countByUserId(String userId);
}