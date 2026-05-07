package com.matchy.service;

import com.matchy.entity.Project;
import com.matchy.entity.Proposal;
import com.matchy.entity.User;
import com.matchy.entity.MatchResult;  
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import com.matchy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProposalRepository proposalRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.user.url:http://localhost:8081}")
    private String userServiceUrl;

    // Pour le CLIENT: top freelancers pour son projet
    public List<MatchResult> getTopFreelancersForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        List<User> freelancers = userRepository.findByRole(User.Role.FREELANCER);
        if (freelancers.isEmpty()) freelancers = fetchFreelancers();

        return freelancers.stream()
            .filter(f -> f.getStatus() == User.UserStatus.ACTIVE)
            .map(f -> computeScore(f, project))
            .filter(r -> r.getTotalScore() > 0)
            .sorted((a, b) -> b.getTotalScore() - a.getTotalScore())
            .limit(10)
            .collect(Collectors.toList());
    }

    // Pour le FREELANCER: top projets compatibles
    public List<MatchResult> getTopProjectsForFreelancer(Long freelancerId) {
        User freelancer = userRepository.findById(freelancerId).orElseGet(() -> fetchUser(freelancerId));
        if (freelancer == null) throw new RuntimeException("Freelancer not found");

        Set<Long> alreadyApplied = proposalRepository.findByFreelancerId(freelancerId)
            .stream().map(Proposal::getProjectId).collect(Collectors.toSet());

        return projectRepository.findAll().stream()
            .filter(p -> p.getStatus() == Project.ProjectStatus.OPEN)
            .filter(p -> !alreadyApplied.contains(p.getId()))
            .map(p -> computeScoreForProject(freelancer, p))
            .filter(r -> r.getTotalScore() > 0)
            .sorted((a, b) -> b.getTotalScore() - a.getTotalScore())
            .limit(10)
            .collect(Collectors.toList());
    }

    private MatchResult computeScore(User f, Project p) {
        MatchResult r = new MatchResult();
        r.setFreelancerId(f.getId());
        r.setFreelancerName(f.getFirstName() + " " + f.getLastName());
        r.setFreelancerSkills(f.getSkills());
        r.setFreelancerAvatar(f.getAvatar());
        r.setVerified(Boolean.TRUE.equals(f.getVerified()));

        r.setSkillsScore(calcSkillsScore(f.getSkills(), p.getRequiredSkills()));
        r.setMatchedSkills(getMatchedSkills(f.getSkills(), p.getRequiredSkills()));
        r.setBudgetScore(calcBudgetScore(f.getId(), p.getBudget()));

        long accepted = proposalRepository.countByFreelancerIdAndStatus(f.getId(), Proposal.ProposalStatus.ACCEPTED);
        r.setExperienceScore(calcExperienceScore(accepted));

        long recent = proposalRepository.findByFreelancerId(f.getId()).stream()
            .filter(pr -> pr.getCreatedAt() != null && pr.getCreatedAt().isAfter(LocalDateTime.now().minusDays(30)))
            .count();
        r.setActivityScore(recent > 0 ? 15 : 0);

        r.computeTotal();
        return r;
    }

    private MatchResult computeScoreForProject(User f, Project p) {
        MatchResult r = new MatchResult();
        r.setFreelancerId(p.getId());
        r.setFreelancerName(p.getTitle());
        r.setFreelancerSkills(p.getCategory());
        r.setSkillsScore(calcSkillsScore(f.getSkills(), p.getRequiredSkills()));
        r.setMatchedSkills(getMatchedSkills(f.getSkills(), p.getRequiredSkills()));
        r.setBudgetScore(calcBudgetScore(f.getId(), p.getBudget()));

        long accepted = proposalRepository.countByFreelancerIdAndStatus(f.getId(), Proposal.ProposalStatus.ACCEPTED);
        r.setExperienceScore(calcExperienceScore(accepted));
        r.setActivityScore(15);
        r.computeTotal();
        return r;
    }

    private int calcSkillsScore(String fSkills, List<String> required) {
        if (fSkills == null || fSkills.isBlank()) return 0;
        if (required == null || required.isEmpty()) return 20;
        List<String> fList = Arrays.stream(fSkills.split("[,;]"))
            .map(s -> s.trim().toLowerCase()).collect(Collectors.toList());
        long matched = required.stream().map(s -> s.trim().toLowerCase()).filter(fList::contains).count();
        return (int) Math.round((double) matched / required.size() * 40);
    }

    private int calcBudgetScore(Long fId, Double projectBudget) {
        if (projectBudget == null) return 12;
        OptionalDouble avg = proposalRepository.findByFreelancerId(fId).stream()
            .filter(p -> p.getProposedBudget() != null)
            .mapToDouble(Proposal::getProposedBudget).average();
        if (avg.isEmpty()) return 12;
        double diff = Math.abs(avg.getAsDouble() - projectBudget) / projectBudget;
        if (diff <= 0.10) return 25;
        if (diff <= 0.20) return 20;
        if (diff <= 0.35) return 12;
        if (diff <= 0.50) return 6;
        return 0;
    }

    private int calcExperienceScore(long accepted) {
        if (accepted >= 20) return 20;
        if (accepted >= 10) return 17;
        if (accepted >= 5)  return 13;
        if (accepted >= 2)  return 9;
        if (accepted >= 1)  return 5;
        return 2;
    }

    private String getMatchedSkills(String fSkills, List<String> required) {
        if (fSkills == null || required == null) return "";
        List<String> fList = Arrays.stream(fSkills.split("[,;]"))
            .map(s -> s.trim().toLowerCase()).collect(Collectors.toList());
        return required.stream().filter(s -> fList.contains(s.trim().toLowerCase()))
            .collect(Collectors.joining(", "));
    }

    private User fetchUser(Long userId) {
        try {
            return restTemplate.getForObject(userServiceUrl + "/api/users/" + userId, User.class);
        } catch (Exception e) {
            return null;
        }
    }

    private List<User> fetchFreelancers() {
        try {
            User[] users = restTemplate.getForObject(userServiceUrl + "/api/users/role/FREELANCER", User[].class);
            if (users == null) return List.of();
            return Arrays.asList(users);
        } catch (Exception e) {
            return List.of();
        }
    }
}