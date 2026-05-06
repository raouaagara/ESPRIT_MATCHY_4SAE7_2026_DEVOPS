package org.example.contentservice.services.implementing;

import org.example.contentservice.entities.Content;
import org.example.contentservice.repositories.ContentRepository;
import org.example.contentservice.services.interfaces.IContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContentServiceImpl implements IContentService {

    private static final Content.ContentLevel DEFAULT_LEVEL = Content.ContentLevel.DEBUTANT;

    @Autowired
    private ContentRepository contentRepository;

    @Override
    public List<Content> retrieveAllContents() {
        List<Content> contents = contentRepository.findAll();
        contents.forEach(this::normalizeLevel);
        return contents;
    }

    @Override
    public Content addContent(Content content) {
        content.setCreatedAt(LocalDateTime.now());
        content.setUpdatedAt(LocalDateTime.now());
        normalizeLevel(content);
        return contentRepository.save(content);
    }

    @Override
    public Content updateContent(Content content) {
        content.setUpdatedAt(LocalDateTime.now());
        normalizeLevel(content);
        return contentRepository.save(content);
    }

    @Override
    public Content retrieveContent(Integer contentId) {
        Content content = contentRepository.findById(contentId).orElse(null);
        if (content != null) {
            normalizeLevel(content);
        }
        return content;
    }

    @Override
    public void deleteContent(Integer contentId) {
        contentRepository.deleteById(contentId);
    }

    private void normalizeLevel(Content content) {
        if (content.getLevel() == null) {
            content.setLevel(DEFAULT_LEVEL);
        }
    }
}