package com.matchy.controller;

import com.matchy.entity.Project;
import com.matchy.entity.Proposal;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
public class FreelancerStatsController {

    private final ProposalRepository proposalRepository;
    private final ProjectRepository projectRepository;

    public FreelancerStatsController(ProposalRepository proposalRepository, ProjectRepository projectRepository) {
        this.proposalRepository = proposalRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/api/freelancers/{userId}/reactivity")
    public ResponseEntity<Map<String, Object>> getReactivity(@PathVariable Long userId) {
        List<Proposal> mine = proposalRepository.findByFreelancerId(userId);
        long total = mine.size();
        long accepted = mine.stream().filter(p -> p.getStatus() == Proposal.ProposalStatus.ACCEPTED).count();
        int score = total == 0 ? 0 : (int) Math.min(100, Math.round((accepted * 100.0) / total));
        String label = score >= 70 ? "Excellent" : score >= 40 ? "Good" : "Needs improvement";

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("score", score);
        out.put("label", label);
        out.put("totalProposals", total);
        out.put("acceptedProposals", accepted);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/api/freelancers/{userId}/overload")
    public ResponseEntity<Map<String, Object>> getOverload(@PathVariable Long userId) {
        List<Proposal> mine = proposalRepository.findByFreelancerId(userId);
        long active = mine.stream().filter(p ->
            p.getStatus() == Proposal.ProposalStatus.ACCEPTED || p.getStatus() == Proposal.ProposalStatus.COMPLETED
        ).count();

        int threshold = 5;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("activeProjects", active);
        out.put("threshold", threshold);
        out.put("overloaded", active >= threshold);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/api/availability/{userId}")
    public ResponseEntity<Map<String, Object>> getAvailability(@PathVariable Long userId) {
        List<Proposal> mine = proposalRepository.findByFreelancerId(userId);
        long occupied = mine.stream().filter(p ->
            p.getStatus() == Proposal.ProposalStatus.ACCEPTED || p.getStatus() == Proposal.ProposalStatus.COMPLETED
        ).count();

        int maxSlots = 5;
        String status = occupied >= maxSlots ? "BUSY" : occupied >= 3 ? "PARTIAL" : "AVAILABLE";

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", status);
        out.put("occupiedSlots", occupied);
        out.put("maxSlots", maxSlots);
        out.put("availableFrom", "");
        return ResponseEntity.ok(out);
    }

    @GetMapping("/api/market/heatmap")
    public ResponseEntity<List<Map<String, Object>>> getMarketHeatmap() {
        List<Project> projects = projectRepository.findAll();
        Map<String, List<Project>> byCategory = projects.stream().collect(Collectors.groupingBy(p -> {
            String c = p.getCategory();
            return (c == null || c.isBlank()) ? "General" : c;
        }));

        List<Map<String, Object>> out = new ArrayList<>();
        byCategory.forEach((category, list) -> {
            Set<Long> uniqueCandidates = new HashSet<>();
            for (Project p : list) {
                List<Proposal> proposals = proposalRepository.findByProjectId(p.getId());
                proposals.forEach(prop -> uniqueCandidates.add(prop.getFreelancerId()));
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("category", category);
            row.put("projectCount", list.size());
            row.put("candidateCount", uniqueCandidates.size());
            out.add(row);
        });
        out.sort((a, b) -> Integer.compare((Integer) b.get("projectCount"), (Integer) a.get("projectCount")));
        return ResponseEntity.ok(out);
    }
}
