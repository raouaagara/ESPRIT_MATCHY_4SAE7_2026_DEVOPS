package com.matchy.controller;

import com.matchy.entity.Badge;
import com.matchy.service.GamificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    @Autowired private GamificationService gamificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Badge>> getBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(gamificationService.getBadgesForUser(userId));
    }
}