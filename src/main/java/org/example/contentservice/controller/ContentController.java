package org.example.contentservice.controller;

import org.example.contentservice.entities.Content;
import org.example.contentservice.services.interfaces.IContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/Content")
public class ContentController {

    @Autowired
    private IContentService contentService;

    @PostMapping("/addContent")
    public Content addContent(@RequestBody Content content) {
        return contentService.addContent(content);
    }

    @PutMapping("/modifierContent")
    public Content modifierContent(@RequestBody Content content) {
        return contentService.updateContent(content);
    }

    @DeleteMapping("/deleteContent/{contentId}")
    public void deleteContent(@PathVariable Integer contentId) {
        contentService.deleteContent(contentId);
    }

    @GetMapping("/getAllContents")
    public List<Content> getAllContents() {
        return contentService.retrieveAllContents();
    }

    @GetMapping("/{contentId}")
    public Content getContent(@PathVariable Integer contentId) {
        return contentService.retrieveContent(contentId);
    }
}