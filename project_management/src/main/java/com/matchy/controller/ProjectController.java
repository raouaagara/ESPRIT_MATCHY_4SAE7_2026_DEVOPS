package com.matchy.controller;

import com.matchy.entity.Project;
import com.matchy.entity.User;
import com.matchy.repository.UserRepository;
import com.matchy.service.NotificationService;
import com.matchy.service.ProjectService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired private ProjectService      projectService;
    @Autowired private UserRepository      userRepository;
    @Autowired private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Project>> getAll(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Long clientId) {
        if (clientId != null) return ResponseEntity.ok(projectService.getProjectsByClient(clientId));
        if (status   != null) return ResponseEntity.ok(projectService.getProjectsByStatus(status));
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/open")
    public ResponseEntity<List<Project>> getOpen() {
        return ResponseEntity.ok(projectService.getOpenProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return projectService.getProjectById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/delivered")
    public ResponseEntity<List<Project>> getDelivered(@RequestParam Long clientId) {
        return ResponseEntity.ok(projectService.getDeliveredProjects(clientId));
    }

    @GetMapping("/debug/notify-test")
    public ResponseEntity<?> debugNotify() {
        List<User> freelancers = userRepository.findByRole(User.Role.FREELANCER);
        notificationService.notifyNewProjectToFreelancers("TEST PROJECT DEBUG", 999L, "2026-12-31");
        return ResponseEntity.ok(Map.of(
            "freelancersFound", freelancers.size(),
            "message", "Check backend logs"
        ));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Project project, HttpServletRequest req) {
        try {
            String userId = (String) req.getAttribute("userId");
            if (userId == null) userId = "1";

            Long userIdLong = Long.parseLong(userId);
            User currentUser = userRepository.findById(userIdLong).orElseGet(() -> fetchUserFromUserService(userIdLong));

            String email = (String) req.getAttribute("userEmail");
            if (email == null || email.isBlank()) {
                email = currentUser != null && currentUser.getEmail() != null && !currentUser.getEmail().isBlank()
                    ? currentUser.getEmail()
                    : "client@matchy.tn";
            }

            String clientName = "Client";
            if (currentUser != null) {
                String firstName = currentUser.getFirstName() == null ? "" : currentUser.getFirstName().trim();
                String lastName = currentUser.getLastName() == null ? "" : currentUser.getLastName().trim();
                String fullName = (firstName + " " + lastName).trim();
                if (!fullName.isBlank()) clientName = fullName;
            }

            return ResponseEntity.ok(projectService.createProject(project, userId, clientName, email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(
                Map.of("error", e.getMessage() != null ? e.getMessage() : e.getClass().getName()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Project project) {
        try {
            return ResponseEntity.ok(projectService.updateProject(id, project));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(
                Map.of("error", e.getMessage() != null ? e.getMessage() : e.getClass().getName()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(Map.of("message", "Project deleted"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(projectService.updateStatus(id, body.get("status")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/proposals/increment")
    public ResponseEntity<?> incrementProposals(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.incrementProposalsCount(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(projectService.getStats());
    }

    @PostMapping("/reminders/deadline")
    public ResponseEntity<?> sendDeadlineReminders() {
        try {
            return ResponseEntity.ok(projectService.sendDeadlineReminders());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/deliver")
    public ResponseEntity<?> deliver(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String deliveryLink    = (String) body.get("deliveryLink");
            String deliveryMessage = (String) body.getOrDefault("deliveryMessage", "");
            return ResponseEntity.ok(projectService.submitDelivery(id, deliveryLink, deliveryMessage));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Complete + paiement → retourne { project, transaction, message } ──
    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long clientId   = Long.valueOf(body.get("clientId").toString());
            Long proposalId = Long.valueOf(body.get("proposalId").toString());
            Map<String, Object> result = projectService.completeProject(id, clientId, proposalId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/revision")
    public ResponseEntity<?> revision(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String revisionMessage = (String) body.get("revisionMessage");
            Long clientId          = Long.valueOf(body.get("clientId").toString());
            return ResponseEntity.ok(projectService.requestRevision(id, revisionMessage, clientId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private User fetchUserFromUserService(Long userId) {
        try {
            return new RestTemplate().getForObject("http://localhost:8081/api/users/" + userId, User.class);
        } catch (Exception e) {
            return null;
        }
    }
}