package com.matchy.service;

import com.matchy.entity.PredictionSuccessEntity;
import com.matchy.entity.User;
import com.matchy.entity.Project;
import com.matchy.entity.Proposal;
import com.matchy.repository.PredictionSuccessRepository;
import com.matchy.repository.UserRepository;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PredictionSuccessService {

    private final PredictionSuccessRepository predictionRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.user.url:http://localhost:8081}")
    private String userServiceUrl;

    public PredictionSuccessEntity predictSuccess(Long freelancerId, Long projectId) {

        User freelancer = resolveFreelancer(freelancerId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));

        double skillsScore = calculateSkillsScore(freelancer, project);
        double experienceScore = calculateExperienceScore(freelancer);
        double reputationScore = calculateReputationScore(freelancer);
        double successRateScore = calculateSuccessRateScore(freelancerId);
        double availabilityScore = calculateAvailabilityScore(freelancerId);

        double finalScore = (skillsScore * 0.40)
                + (experienceScore * 0.20)
                + (reputationScore * 0.20)
                + (successRateScore * 0.10)
                + (availabilityScore * 0.10);

        String predictionLevel = determinePredictionLevel(finalScore);
        String advice = generateAdvice(skillsScore, experienceScore, reputationScore, finalScore);

        Optional<PredictionSuccessEntity> existing = predictionRepository
                .findByFreelancerIdAndProjectId(freelancerId, projectId);

        PredictionSuccessEntity prediction = existing.orElse(new PredictionSuccessEntity());
        prediction.setFreelancerId(freelancerId);
        prediction.setProjectId(projectId);
        prediction.setSkillsScore(skillsScore);
        prediction.setExperienceScore(experienceScore);
        prediction.setReputationScore(reputationScore);
        prediction.setSuccessRateScore(successRateScore);
        prediction.setAvailabilityScore(availabilityScore);
        prediction.setFinalScore(Math.round(finalScore * 100.0) / 100.0);
        prediction.setPredictionLevel(predictionLevel);
        prediction.setAdvice(advice);

        return predictionRepository.save(prediction);
    }

    

    private double calculateSkillsScore(User freelancer, Project project) {
        if (freelancer.getSkills() == null || freelancer.getSkills().isEmpty()) return 0;

        List<String> projectSkills = new ArrayList<>(
            project.getRequiredSkills() != null ? project.getRequiredSkills() : new ArrayList<>()
        );

        if (projectSkills.isEmpty()) {
            String category = project.getCategory();
            if (category != null && freelancer.getSkills().toLowerCase()
                    .contains(category.toLowerCase())) {
                return 70.0;
            }
            return 50.0;
        }

        long matchCount = projectSkills.stream()
                .filter(skill -> freelancer.getSkills().toLowerCase()
                        .contains(skill.toLowerCase()))
                .count();

        return (double) matchCount / projectSkills.size() * 100;
    }

    private double calculateExperienceScore(User freelancer) {
        int projectsCount = freelancer.getProjectsCount() != null ?
                freelancer.getProjectsCount() : 0;

        if (projectsCount >= 20) return 100.0;
        if (projectsCount >= 10) return 80.0;
        if (projectsCount >= 5)  return 60.0;
        if (projectsCount >= 2)  return 40.0;
        if (projectsCount >= 1)  return 20.0;
        return 0.0;
    }

    private double calculateReputationScore(User freelancer) {
        if (freelancer.getRating() == null) return 0.0;
        return (freelancer.getRating() / 5.0) * 100;
    }

    private double calculateSuccessRateScore(Long freelancerId) {
        long totalProposals = proposalRepository.countByFreelancerId(freelancerId);
        if (totalProposals == 0) return 0.0;

        long acceptedProposals = proposalRepository
                .countByFreelancerIdAndStatus(freelancerId, Proposal.ProposalStatus.ACCEPTED);

        return (double) acceptedProposals / totalProposals * 100;
    }

    private double calculateAvailabilityScore(Long freelancerId) {
        long activeProposals = proposalRepository
                .countByFreelancerIdAndStatus(freelancerId, Proposal.ProposalStatus.PENDING);

        if (activeProposals == 0)  return 100.0;
        if (activeProposals <= 2)  return 75.0;
        if (activeProposals <= 4)  return 50.0;
        return 25.0;
    }

    // ============================================
    // NIVEAU DE PREDICTION
    // ============================================
    private String determinePredictionLevel(double finalScore) {
        if (finalScore >= 70) return "ÉLEVÉ";
        if (finalScore >= 40) return "MOYEN";
        return "FAIBLE";
    }

    // ============================================
    // GENERATION DES CONSEILS
    // ============================================
    private String generateAdvice(double skillsScore, double experienceScore,
                                   double reputationScore, double finalScore) {
        List<String> advices = new ArrayList<>();

        if (skillsScore < 50) {
            advices.add("Improve your skills to match the project requirements.");
        }
        if (experienceScore < 40) {
            advices.add("Complete more projects to increase your experience.");
        }
        if (reputationScore < 60) {
            advices.add("Work on your reputation by earning better ratings.");
        }
        if (finalScore >= 70) {
            advices.add("Excellent profile! You have a very good chance of getting this project.");
        } else if (finalScore >= 40) {
            advices.add("Good profile! Write a convincing cover letter to increase your chances.");
        } else {
            advices.add("Keep improving your profile before applying for this project.");
        }

        return String.join(" | ", advices);
    }

    // ============================================
    // AUTRES METHODES
    // ============================================
    public Optional<PredictionSuccessEntity> getPrediction(Long freelancerId, Long projectId) {
        return predictionRepository.findByFreelancerIdAndProjectId(freelancerId, projectId);
    }

    public List<PredictionSuccessEntity> getFreelancerPredictions(Long freelancerId) {
        return predictionRepository.findByFreelancerId(freelancerId);
    }

    public List<PredictionSuccessEntity> getBestPredictions(Long freelancerId) {
        return predictionRepository.findBestPredictions(freelancerId);
    }

    private User resolveFreelancer(Long freelancerId) {
        return userRepository.findById(freelancerId)
            .orElseGet(() -> {
                try {
                    User user = restTemplate.getForObject(userServiceUrl + "/api/users/" + freelancerId, User.class);
                    if (user != null) return user;
                } catch (Exception ignored) {
                }
                throw new RuntimeException("Freelancer non trouvé");
            });
    }
}