package org.example.contentservice.services.interfaces;

import org.example.contentservice.entities.Content;

import java.util.List;

public interface IContentService {
    List<Content> retrieveAllContents();
    Content addContent(Content content);
    Content updateContent(Content content);
    Content retrieveContent(Integer contentId);
    void deleteContent(Integer contentId);
}