package com.matchy.controller;

import com.matchy.entity.MatchResult;
import com.matchy.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/matching")
public class MatchingController {

    @Autowired private MatchingService matchingService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<MatchResult>> forProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(matchingService.getTopFreelancersForProject(projectId));
    }

    @GetMapping("/freelancer/{freelancerId}")
    public ResponseEntity<List<MatchResult>> forFreelancer(@PathVariable Long freelancerId) {
        return ResponseEntity.ok(matchingService.getTopProjectsForFreelancer(freelancerId));
    }
}