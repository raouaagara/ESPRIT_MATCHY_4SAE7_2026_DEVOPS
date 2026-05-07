package com.matchy.controller;

import com.matchy.entity.Proposal;
import com.matchy.entity.User;
import com.matchy.repository.UserRepository;
import com.matchy.service.ProposalService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proposals")
public class ProposalController {

    @Autowired private ProposalService proposalService;
    @Autowired private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Proposal>> getAll(
        @RequestParam(required = false) Long projectId,
        @RequestParam(required = false) Long freelancerId) {
        if (projectId != null)   return ResponseEntity.ok(proposalService.getProposalsByProject(projectId));
        if (freelancerId != null) return ResponseEntity.ok(proposalService.getProposalsByFreelancer(freelancerId));
        return ResponseEntity.ok(proposalService.getAllProposals());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return proposalService.getProposalById(id).map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Proposal proposal, HttpServletRequest req) {
        try {
            String userId = (String) req.getAttribute("userId");
            if (userId == null || userId.isBlank()) {
                if (proposal.getFreelancerId() != null) {
                    userId = String.valueOf(proposal.getFreelancerId());
                } else {
                    return ResponseEntity.badRequest().body(Map.of("error", "Freelancer id is required"));
                }
            }

            Long userIdLong = Long.parseLong(userId);
            User currentUser = userRepository.findById(userIdLong).orElseGet(() -> fetchUserFromUserService(userIdLong));

            String email = (String) req.getAttribute("userEmail");
            if (email == null || email.isBlank()) {
                email = currentUser != null && currentUser.getEmail() != null && !currentUser.getEmail().isBlank()
                    ? currentUser.getEmail()
                    : proposal.getFreelancerEmail();
            }

            // ✅ Extract real full name from JWT attributes
            String firstName = (String) req.getAttribute("firstName");
            String lastName  = (String) req.getAttribute("lastName");
            String fullName  = buildFullName(firstName, lastName);
            if ("Unknown".equals(fullName) && currentUser != null) {
                fullName = buildFullName(currentUser.getFirstName(), currentUser.getLastName());
            }
            if ("Unknown".equals(fullName) && proposal.getFreelancerName() != null && !proposal.getFreelancerName().isBlank()) {
                fullName = proposal.getFreelancerName();
            }

            return ResponseEntity.ok(proposalService.createProposal(proposal, userId, fullName, email));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(proposalService.updateStatus(id, body.get("status"), body.get("feedback")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        proposalService.deleteProposal(id);
        return ResponseEntity.ok(Map.of("message", "Proposal deleted"));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(proposalService.getStats());
    }

    @GetMapping("/analytics/{freelancerId}")
    public ResponseEntity<?> getFreelancerAnalytics(@PathVariable Long freelancerId) {
        try {
            return ResponseEntity.ok(proposalService.getFreelancerAnalytics(freelancerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/optimizer")
    public ResponseEntity<?> optimizeProposal(@RequestBody Map<String, Object> payload) {
        try {
            return ResponseEntity.ok(proposalService.optimizeProposal(payload));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String buildFullName(String firstName, String lastName) {
        if (firstName == null && lastName == null) return "Unknown";
        if (firstName == null) return lastName;
        if (lastName == null)  return firstName;
        return firstName + " " + lastName;
    }

    private User fetchUserFromUserService(Long userId) {
        try {
            return new RestTemplate().getForObject("http://localhost:8081/api/users/" + userId, User.class);
        } catch (Exception e) {
            return null;
        }
    }
}