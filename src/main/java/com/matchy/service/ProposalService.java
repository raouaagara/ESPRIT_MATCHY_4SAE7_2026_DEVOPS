package com.matchy.service;

import com.matchy.entity.Proposal;
import com.matchy.entity.User;
import com.matchy.repository.ProposalRepository;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.DayOfWeek;
import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ProposalService {

    @Autowired private ProposalRepository proposalRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private EmailService emailService;
    @Autowired private UserRepository userRepository;
    @Autowired private GamificationService gamificationService;

    public List<Proposal> getAllProposals() { return proposalRepository.findAll(); }
    public Optional<Proposal> getProposalById(Long id) { return proposalRepository.findById(id); }
    public List<Proposal> getProposalsByProject(Long projectId) { return proposalRepository.findByProjectId(projectId); }
    public List<Proposal> getProposalsByFreelancer(Long freelancerId) { return proposalRepository.findByFreelancerId(freelancerId); }

    public Proposal createProposal(Proposal proposal, String userId, String userName, String userEmail) {
        if (proposalRepository.existsByProjectIdAndFreelancerId(proposal.getProjectId(), Long.parseLong(userId)))
            throw new RuntimeException("You already applied to this project");

        Long freelancerId = Long.parseLong(userId);
        proposal.setFreelancerId(freelancerId);
        proposal.setFreelancerName(userName);
        String resolvedFreelancerEmail = userEmail;
        if (resolvedFreelancerEmail == null || resolvedFreelancerEmail.isBlank()) {
            resolvedFreelancerEmail = resolveUserEmail(freelancerId);
        }
        proposal.setFreelancerEmail(resolvedFreelancerEmail);
        proposal.setStatus(Proposal.ProposalStatus.PENDING);

        projectRepository.findById(proposal.getProjectId()).ifPresent(project -> {
            proposal.setProjectTitle(project.getTitle());
            proposal.setClientId(project.getClientId());
            String resolvedClientEmail = project.getClientEmail();
            if (resolvedClientEmail == null || resolvedClientEmail.isBlank()) {
                resolvedClientEmail = resolveUserEmail(project.getClientId());
            }
            final String clientEmailForNotification = resolvedClientEmail;
            proposal.setClientEmail(resolvedClientEmail);

            notificationService.notifyProposalReceived(
                project.getClientId(), clientEmailForNotification,
                userName, project.getTitle()
            );

            String clientFirstName = resolveUserFirstName(project.getClientId());
            String freelancerBio = resolveUserBio(freelancerId);
            try {
                if (clientEmailForNotification != null && !clientEmailForNotification.isBlank()) {
                    emailService.sendNewProposalToClient(
                        clientEmailForNotification, clientFirstName,
                        project.getTitle(), userName, freelancerBio
                    );
                }
            } catch (Exception e) {
                System.err.println("New proposal email failed: " + e.getMessage());
            }
        });

        Proposal saved = proposalRepository.save(proposal);

        // Increment proposalsCount on the project
        projectRepository.findById(saved.getProjectId()).ifPresent(project -> {
            int current = project.getProposalsCount() == null ? 0 : project.getProposalsCount();
            project.setProposalsCount(current + 1);
            projectRepository.save(project);
        });

        // Gamification — check badges on submission
        gamificationService.onProposalSubmitted(saved.getFreelancerId());

        return saved;
    }

    public Proposal updateStatus(Long id, String status, String feedback) {
        Proposal p = proposalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Proposal not found"));

        Proposal.ProposalStatus newStatus = Proposal.ProposalStatus.valueOf(status.toUpperCase());
        p.setStatus(newStatus);
        if (feedback != null) p.setClientFeedback(feedback);

        Proposal saved = proposalRepository.save(p);

        String freelancerFirstName = resolveUserFirstName(p.getFreelancerId());
        if (newStatus == Proposal.ProposalStatus.ACCEPTED) {
            String freelancerEmail = p.getFreelancerEmail();
            if (freelancerEmail == null || freelancerEmail.isBlank()) {
                freelancerEmail = resolveUserEmail(p.getFreelancerId());
            }
            if (freelancerEmail != null && !freelancerEmail.isBlank()) {
                p.setFreelancerEmail(freelancerEmail);
                proposalRepository.save(p);
            }
            notificationService.notifyProposalAccepted(
                p.getFreelancerId(), freelancerEmail, p.getProjectTitle()
            );
            String clientName = resolveUserFirstName(p.getClientId());
            try {
                if (freelancerEmail != null && !freelancerEmail.isBlank()) {
                    emailService.sendProposalAccepted(
                        freelancerEmail, freelancerFirstName, p.getProjectTitle(), clientName
                    );
                }
            } catch (Exception e) {
                System.err.println("Accepted email failed: " + e.getMessage());
            }
            gamificationService.onProposalAccepted(p.getFreelancerId());
        } else if (newStatus == Proposal.ProposalStatus.REJECTED) {
            String freelancerEmail = p.getFreelancerEmail();
            if (freelancerEmail == null || freelancerEmail.isBlank()) {
                freelancerEmail = resolveUserEmail(p.getFreelancerId());
            }
            notificationService.notifyProposalRejected(
                p.getFreelancerId(), freelancerEmail, p.getProjectTitle()
            );
            try {
                if (freelancerEmail != null && !freelancerEmail.isBlank()) {
                    emailService.sendProposalRejected(
                        freelancerEmail, freelancerFirstName, p.getProjectTitle()
                    );
                }
            } catch (Exception e) {
                System.err.println("Rejected email failed: " + e.getMessage());
            }
            gamificationService.onProposalRejected(p.getFreelancerId());
        }

        return saved;
    }

    public void deleteProposal(Long id) { proposalRepository.deleteById(id); }

    public Map<String, Long> getStats() {
        Map<String, Long> s = new LinkedHashMap<>();
        s.put("total",    proposalRepository.count());
        s.put("pending",  proposalRepository.countByStatus(Proposal.ProposalStatus.PENDING));
        s.put("accepted", proposalRepository.countByStatus(Proposal.ProposalStatus.ACCEPTED));
        s.put("rejected", proposalRepository.countByStatus(Proposal.ProposalStatus.REJECTED));
        return s;
    }

    public Map<String, Object> getFreelancerAnalytics(Long freelancerId) {
        List<Proposal> proposals = proposalRepository.findByFreelancerId(freelancerId);
        long total = proposals.size();
        long accepted = proposals.stream().filter(p -> p.getStatus() == Proposal.ProposalStatus.ACCEPTED).count();
        double acceptanceRate = total == 0 ? 0.0 : (accepted * 100.0 / total);

        Map<String, long[]> categoryStats = new LinkedHashMap<>();
        for (Proposal proposal : proposals) {
            String category = projectRepository.findById(proposal.getProjectId())
                .map(project -> project.getCategory() == null || project.getCategory().isBlank() ? "Other" : project.getCategory())
                .orElse("Other");
            long[] stat = categoryStats.computeIfAbsent(category, k -> new long[]{0L, 0L});
            stat[0]++; // total
            if (proposal.getStatus() == Proposal.ProposalStatus.ACCEPTED) stat[1]++; // accepted
        }

        List<Map<String, Object>> acceptanceByCategory = categoryStats.entrySet().stream()
            .map(entry -> {
                long catTotal = entry.getValue()[0];
                long catAccepted = entry.getValue()[1];
                double rate = catTotal == 0 ? 0.0 : (catAccepted * 100.0 / catTotal);
                return Map.<String, Object>of(
                    "category", entry.getKey(),
                    "total", catTotal,
                    "accepted", catAccepted,
                    "acceptanceRate", Math.round(rate * 100.0) / 100.0
                );
            })
            .sorted((a, b) -> Double.compare((Double) b.get("acceptanceRate"), (Double) a.get("acceptanceRate")))
            .collect(Collectors.toList());

        List<Proposal> clientAnswered = proposals.stream()
            .filter(p -> p.getStatus() == Proposal.ProposalStatus.ACCEPTED || p.getStatus() == Proposal.ProposalStatus.REJECTED)
            .filter(p -> p.getCreatedAt() != null && p.getUpdatedAt() != null && p.getUpdatedAt().isAfter(p.getCreatedAt()))
            .collect(Collectors.toList());

        double avgResponseHours = clientAnswered.isEmpty() ? 0.0 :
            clientAnswered.stream()
                .mapToLong(p -> Duration.between(p.getCreatedAt(), p.getUpdatedAt()).toSeconds())
                .average().orElse(0.0) / 3600.0;

        List<Proposal> baseline = proposals.stream()
            .filter(p -> p.getCreatedAt() != null)
            .collect(Collectors.toList());
        List<Proposal> acceptedBaseline = proposals.stream()
            .filter(p -> p.getStatus() == Proposal.ProposalStatus.ACCEPTED && p.getCreatedAt() != null)
            .collect(Collectors.toList());
        List<Proposal> signalSet = acceptedBaseline.isEmpty() ? baseline : acceptedBaseline;

        Map<DayOfWeek, Long> dayCounts = signalSet.stream()
            .collect(Collectors.groupingBy(p -> p.getCreatedAt().getDayOfWeek(), Collectors.counting()));
        DayOfWeek bestDay = dayCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(DayOfWeek.MONDAY);

        Map<Integer, Long> hourCounts = signalSet.stream()
            .collect(Collectors.groupingBy(p -> p.getCreatedAt().getHour(), Collectors.counting()));
        Integer bestHour = hourCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(10);

        Map<String, Object> bestSubmitWindow = new LinkedHashMap<>();
        bestSubmitWindow.put("day", bestDay.name());
        bestSubmitWindow.put("hour", bestHour);
        bestSubmitWindow.put("sampleSize", signalSet.size());
        bestSubmitWindow.put("basedOnAcceptedOnly", !acceptedBaseline.isEmpty());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalProposals", total);
        result.put("acceptedProposals", accepted);
        result.put("globalAcceptanceRate", Math.round(acceptanceRate * 100.0) / 100.0);
        result.put("acceptanceByCategory", acceptanceByCategory);
        result.put("averageClientResponseHours", Math.round(avgResponseHours * 100.0) / 100.0);
        result.put("bestSubmitWindow", bestSubmitWindow);
        return result;
    }

    public Map<String, Object> optimizeProposal(Map<String, Object> payload) {
        String coverLetter = String.valueOf(payload.getOrDefault("coverLetter", ""));
        String projectTitle = String.valueOf(payload.getOrDefault("projectTitle", ""));
        String projectDescription = String.valueOf(payload.getOrDefault("projectDescription", ""));
        Double projectBudget = toDouble(payload.get("projectBudget"));
        Double proposedBudget = toDouble(payload.get("proposedBudget"));

        if ((projectBudget == null || projectBudget <= 0) && payload.get("projectId") != null) {
            try {
                Long projectId = Long.valueOf(String.valueOf(payload.get("projectId")));
                var projectOpt = projectRepository.findById(projectId);
                if (projectOpt.isPresent()) {
                    var project = projectOpt.get();
                    if (project.getBudget() != null) payload.put("projectBudget", project.getBudget());
                    if ((projectTitle == null || projectTitle.isBlank()) && project.getTitle() != null) {
                        payload.put("projectTitle", project.getTitle());
                    }
                    if ((projectDescription == null || projectDescription.isBlank()) && project.getDescription() != null) {
                        payload.put("projectDescription", project.getDescription());
                    }
                }
            } catch (Exception ignored) {
            }
            projectTitle = String.valueOf(payload.getOrDefault("projectTitle", projectTitle));
            projectDescription = String.valueOf(payload.getOrDefault("projectDescription", projectDescription));
            projectBudget = toDouble(payload.get("projectBudget"));
        }

        int clarity = scoreClarity(coverLetter);
        int personalization = scorePersonalization(coverLetter, projectTitle, projectDescription);
        int budget = scoreBudgetCoherence(proposedBudget, projectBudget);
        int cta = scoreCta(coverLetter);
        int total = clarity + personalization + budget + cta;

        List<String> suggestions = new ArrayList<>();
        if (clarity < 20) suggestions.add("Improve clarity: use 3-6 concise sentences and mention concrete deliverables.");
        if (personalization < 20) suggestions.add("Personalize more: reference project title, key requirements, and expected outcomes.");
        if (budget < 15) suggestions.add("Adjust budget: keep your quote aligned with the project budget range.");
        if (cta < 8) suggestions.add("Add a stronger CTA: invite the client to discuss details and confirm your availability.");
        if (suggestions.isEmpty()) suggestions.add("Excellent proposal quality. Keep this structure for future submissions.");

        Map<String, Object> breakdown = new LinkedHashMap<>();
        breakdown.put("clarity", clarity);
        breakdown.put("personalization", personalization);
        breakdown.put("budgetCoherence", budget);
        breakdown.put("cta", cta);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalScore", total);
        result.put("breakdown", breakdown);
        result.put("suggestions", suggestions);
        return result;
    }

    private String resolveUserEmail(Long userId) {
        String email = userRepository.findById(userId).map(User::getEmail).orElse(null);
        if (email != null && !email.isBlank()) return email;
        try {
            User user = new RestTemplate().getForObject("http://localhost:8081/api/users/" + userId, User.class);
            if (user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
                return user.getEmail();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String resolveUserFirstName(Long userId) {
        String firstName = userRepository.findById(userId).map(User::getFirstName).orElse(null);
        if (firstName != null && !firstName.isBlank()) return firstName;
        try {
            User user = new RestTemplate().getForObject("http://localhost:8081/api/users/" + userId, User.class);
            if (user != null && user.getFirstName() != null && !user.getFirstName().isBlank()) {
                return user.getFirstName();
            }
        } catch (Exception ignored) {
        }
        return "User";
    }

    private String resolveUserBio(Long userId) {
        String bio = userRepository.findById(userId).map(User::getBio).orElse(null);
        if (bio != null && !bio.isBlank()) return bio;
        try {
            User user = new RestTemplate().getForObject("http://localhost:8081/api/users/" + userId, User.class);
            if (user != null && user.getBio() != null && !user.getBio().isBlank()) {
                return user.getBio();
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    private Double toDouble(Object value) {
        if (value == null) return null;
        try {
            return Double.valueOf(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }

    private int scoreClarity(String coverLetter) {
        if (coverLetter == null) return 0;
        String text = coverLetter.trim();
        if (text.isEmpty()) return 0;
        int words = text.split("\\s+").length;
        int score = 0;
        if (words >= 60 && words <= 220) score += 16;
        else if (words >= 35 && words <= 260) score += 10;
        else score += 4;
        long sentences = Pattern.compile("[.!?]").matcher(text).results().count();
        if (sentences >= 3 && sentences <= 8) score += 10;
        else if (sentences >= 2) score += 6;
        else score += 2;
        if (text.contains("\n") || text.contains("•") || text.contains("-")) score += 4;
        return Math.min(30, score);
    }

    private int scorePersonalization(String coverLetter, String projectTitle, String projectDescription) {
        if (coverLetter == null || coverLetter.isBlank()) return 0;
        String text = coverLetter.toLowerCase();
        Set<String> keywords = new LinkedHashSet<>();
        keywords.addAll(extractKeywords(projectTitle));
        keywords.addAll(extractKeywords(projectDescription));
        if (keywords.isEmpty()) return 12;
        long matched = keywords.stream().filter(text::contains).count();
        double ratio = (double) matched / keywords.size();
        if (ratio >= 0.6) return 30;
        if (ratio >= 0.4) return 24;
        if (ratio >= 0.2) return 16;
        return 8;
    }

    private int scoreBudgetCoherence(Double proposedBudget, Double projectBudget) {
        if (proposedBudget == null || proposedBudget <= 0) return 0;
        if (projectBudget == null || projectBudget <= 0) return 15;
        double diff = Math.abs(proposedBudget - projectBudget) / projectBudget;
        if (diff <= 0.10) return 25;
        if (diff <= 0.20) return 21;
        if (diff <= 0.35) return 16;
        if (diff <= 0.50) return 10;
        return 5;
    }

    private int scoreCta(String coverLetter) {
        if (coverLetter == null || coverLetter.isBlank()) return 0;
        String text = coverLetter.toLowerCase();
        List<String> ctaSignals = List.of(
            "ready to start",
            "available to start",
            "let's discuss",
            "happy to discuss",
            "looking forward",
            "thank you",
            "i can start",
            "contact me"
        );
        long hits = ctaSignals.stream().filter(text::contains).count();
        if (hits >= 3) return 15;
        if (hits == 2) return 11;
        if (hits == 1) return 7;
        return 3;
    }

    private Set<String> extractKeywords(String value) {
        if (value == null) return Set.of();
        return Arrays.stream(value.toLowerCase().split("[^a-z0-9]+"))
            .filter(token -> token.length() >= 4)
            .filter(token -> !Set.of("with", "from", "that", "this", "have", "will", "your", "about", "project").contains(token))
            .limit(20)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}