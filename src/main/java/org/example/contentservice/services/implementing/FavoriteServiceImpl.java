package org.example.contentservice.services.implementing;

import org.example.contentservice.entities.Favorite;
import org.example.contentservice.entities.Content;
import org.example.contentservice.repositories.FavoriteRepository;
import org.example.contentservice.repositories.ContentRepository;
import org.example.contentservice.services.interfaces.IFavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FavoriteServiceImpl implements IFavoriteService {

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private ContentRepository contentRepository;

    @Override
    @Transactional
    public Favorite addFavorite(String userId, Integer contentId) {
        // Vérifier si le favori existe déjà
        Optional<Favorite> existing = favoriteRepository.findByUserIdAndContentId(userId, contentId);

        if (existing.isPresent()) {
            // Déjà en favori, retourner l'existant
            return existing.get();
        }

        // Vérifier que le contenu existe
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Content not found"));

        // Créer nouveau favori
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setContentId(contentId);

        return favoriteRepository.save(favorite);
    }

    @Override
    @Transactional
    public void removeFavorite(String userId, Integer contentId) {
        favoriteRepository.deleteByUserIdAndContentId(userId, contentId);
    }

    @Override
    public boolean isFavorite(String userId, Integer contentId) {
        return favoriteRepository.findByUserIdAndContentId(userId, contentId).isPresent();
    }

    @Override
    public List<Favorite> getUserFavorites(String userId) {
        return favoriteRepository.findByUserId(userId);
    }

    @Override
    public List<Content> getUserFavoriteContents(String userId) {
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);

        // Récupérer les contenus correspondants
        return favorites.stream()
                .map(favorite -> contentRepository.findById(favorite.getContentId()).orElse(null))
                .filter(content -> content != null)
                .collect(Collectors.toList());
    }

    @Override
    public long countUserFavorites(String userId) {
        return favoriteRepository.countByUserId(userId);
    }
}